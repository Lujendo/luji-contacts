// Group routes for contact organization
import { Hono } from 'hono';
import { DatabaseService, Group } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

export function createGroupRoutes(db: DatabaseService, auth: AuthService) {
  const groups = new Hono<{ Bindings: Env }>();

  // Apply authentication middleware to all routes
  groups.use('*', createAuthMiddleware(auth, db));

  // Get all groups for the authenticated user
  groups.get('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupList = await db.getGroupsByUserId(user.id);

      // Get contact count for each group
      const groupsWithCounts = await Promise.all(
        groupList.map(async (group) => {
          const contacts = await db.getContactsByGroupId(group.id);
          return {
            ...group,
            contact_count: contacts.length
          };
        })
      );

      return c.json({
        groups: groupsWithCounts,
        total: groupsWithCounts.length
      });

    } catch (error) {
      console.error('Get groups error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Get single group by ID with its contacts
  groups.get('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      const group = await db.getGroupById(groupId, user.id);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }

      // Get contacts in this group
      const contacts = await db.getContactsByGroupId(group.id);

      return c.json({
        group: {
          ...group,
          contacts,
          contact_count: contacts.length
        }
      });

    } catch (error) {
      console.error('Get group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Create new group
  groups.post('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();

      if (!body.name || body.name.trim().length === 0) {
        return c.json({ error: 'Group name is required' }, 400);
      }

      const groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        name: body.name.trim(),
        description: body.description?.trim()
      };

      const group = await db.createGroup(groupData);

      return c.json({
        message: 'Group created successfully',
        group
      }, 201);

    } catch (error) {
      console.error('Create group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Update group
  groups.put('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      // Check if group exists and belongs to user
      const existingGroup = await db.getGroupById(groupId, user.id);
      if (!existingGroup) {
        return c.json({ error: 'Group not found' }, 404);
      }

      if (!body.name || body.name.trim().length === 0) {
        return c.json({ error: 'Group name is required' }, 400);
      }

      const updateData: Partial<Group> = {
        name: body.name.trim(),
        description: body.description?.trim()
      };

      const updatedGroup = await db.updateGroup(groupId, user.id, updateData);
      if (!updatedGroup) {
        return c.json({ error: 'Failed to update group' }, 500);
      }

      return c.json({
        message: 'Group updated successfully',
        group: updatedGroup
      });

    } catch (error) {
      console.error('Update group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Delete group
  groups.delete('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      // Check if group exists and belongs to user
      const existingGroup = await db.getGroupById(groupId, user.id);
      if (!existingGroup) {
        return c.json({ error: 'Group not found' }, 404);
      }

      const deleted = await db.deleteGroup(groupId, user.id);
      if (!deleted) {
        return c.json({ error: 'Failed to delete group' }, 500);
      }

      return c.json({ message: 'Group deleted successfully' });

    } catch (error) {
      console.error('Delete group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Add contact to group
  groups.post('/:id/contacts', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      const { contactId } = body;
      if (!contactId || isNaN(parseInt(contactId))) {
        return c.json({ error: 'Valid contact ID is required' }, 400);
      }

      // Check if group exists and belongs to user
      const group = await db.getGroupById(groupId, user.id);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }

      // Check if contact exists and belongs to user
      const contact = await db.getContactById(parseInt(contactId), user.id);
      if (!contact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      try {
        await db.addContactToGroup(groupId, parseInt(contactId));
        return c.json({ message: 'Contact added to group successfully' });
      } catch (error) {
        // Handle duplicate entry error
        return c.json({ error: 'Contact is already in this group' }, 409);
      }

    } catch (error) {
      console.error('Add contact to group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Remove contact from group
  groups.delete('/:id/contacts/:contactId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));
      const contactId = parseInt(c.req.param('contactId'));

      if (isNaN(groupId) || isNaN(contactId)) {
        return c.json({ error: 'Invalid group ID or contact ID' }, 400);
      }

      // Check if group exists and belongs to user
      const group = await db.getGroupById(groupId, user.id);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }

      // Check if contact exists and belongs to user
      const contact = await db.getContactById(contactId, user.id);
      if (!contact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      const removed = await db.removeContactFromGroup(groupId, contactId);
      if (!removed) {
        return c.json({ error: 'Contact not found in group' }, 404);
      }

      return c.json({ message: 'Contact removed from group successfully' });

    } catch (error) {
      console.error('Remove contact from group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Bulk add contacts to group
  groups.post('/:id/contacts/bulk', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      const { contactIds } = body;
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return c.json({ error: 'Contact IDs array is required' }, 400);
      }

      // Check if group exists and belongs to user
      const group = await db.getGroupById(groupId, user.id);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }

      let addedCount = 0;
      const errors: string[] = [];

      for (const contactId of contactIds) {
        try {
          // Check if contact exists and belongs to user
          const contact = await db.getContactById(contactId, user.id);
          if (contact) {
            await db.addContactToGroup(groupId, contactId);
            addedCount++;
          } else {
            errors.push(`Contact ${contactId} not found`);
          }
        } catch (error) {
          errors.push(`Failed to add contact ${contactId} (may already be in group)`);
        }
      }

      return c.json({
        message: `Successfully added ${addedCount} contacts to group`,
        addedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Bulk add contacts to group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Bulk remove contacts from group
  groups.delete('/:id/contacts/bulk', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(groupId)) {
        return c.json({ error: 'Invalid group ID' }, 400);
      }

      const { contactIds } = body;
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return c.json({ error: 'Contact IDs array is required' }, 400);
      }

      // Check if group exists and belongs to user
      const group = await db.getGroupById(groupId, user.id);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }

      let removedCount = 0;
      const errors: string[] = [];

      for (const contactId of contactIds) {
        try {
          const removed = await db.removeContactFromGroup(groupId, contactId);
          if (removed) {
            removedCount++;
          } else {
            errors.push(`Contact ${contactId} not found in group`);
          }
        } catch (error) {
          errors.push(`Failed to remove contact ${contactId}`);
        }
      }

      return c.json({
        message: `Successfully removed ${removedCount} contacts from group`,
        removedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Bulk remove contacts from group error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return groups;
}
