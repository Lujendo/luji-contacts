// Contact routes for CRUD operations
import { Hono } from 'hono';
import { DatabaseService, Contact } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';
import { StorageService, ALLOWED_IMAGE_TYPES } from '../utils/storage';

export function createContactRoutes(db: DatabaseService, auth: AuthService, storage: StorageService) {
  const contacts = new Hono<{ Bindings: Env }>();

  // Apply authentication middleware to all routes
  contacts.use('*', createAuthMiddleware(auth, db));

  // Get all contacts with search and sorting
  contacts.get('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const { search, sort, direction } = c.req.query();

      const contactList = await db.getContactsByUserId(
        user.id,
        search,
        sort,
        direction
      );

      // Get groups for each contact (if needed)
      const contactsWithGroups = await Promise.all(
        contactList.map(async (contact) => {
          const groups = await db.getGroupsByContactId(contact.id);
          return {
            ...contact,
            groups: groups.map(g => ({ id: g.id, name: g.name }))
          };
        })
      );

      return c.json({
        contacts: contactsWithGroups,
        total: contactsWithGroups.length
      });

    } catch (error) {
      console.error('Get contacts error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Get single contact by ID
  contacts.get('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const contactId = parseInt(c.req.param('id'));

      if (isNaN(contactId)) {
        return c.json({ error: 'Invalid contact ID' }, 400);
      }

      const contact = await db.getContactById(contactId, user.id);
      if (!contact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      // Get groups for this contact
      const groups = await db.getGroupsByContactId(contact.id);

      return c.json({
        contact: {
          ...contact,
          groups: groups.map(g => ({ id: g.id, name: g.name }))
        }
      });

    } catch (error) {
      console.error('Get contact error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Create new contact
  contacts.post('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();

      // Validate required fields
      if (!body.first_name && !body.last_name && !body.email) {
        return c.json({ 
          error: 'At least one of first_name, last_name, or email is required' 
        }, 400);
      }

      // Validate email format if provided
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }

      // Check contact limit
      if (user.contact_limit && user.contact_limit > 0) {
        const existingContacts = await db.getContactsByUserId(user.id);
        if (existingContacts.length >= user.contact_limit) {
          return c.json({ 
            error: `Contact limit reached. Maximum ${user.contact_limit} contacts allowed.` 
          }, 403);
        }
      }

      const contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        first_name: body.first_name?.trim() || '',
        last_name: body.last_name?.trim() || '',
        email: body.email?.toLowerCase().trim() || '',
        phone: body.phone?.trim() || '',
        address_street: body.address_street?.trim() || '',
        address_city: body.address_city?.trim() || '',
        address_state: body.address_state?.trim() || '',
        address_zip: body.address_zip?.trim() || '',
        address_country: body.address_country?.trim() || '',
        birthday: body.birthday || '',
        website: body.website?.trim() || '',
        facebook: body.facebook?.trim() || '',
        twitter: body.twitter?.trim() || '',
        linkedin: body.linkedin?.trim() || '',
        instagram: body.instagram?.trim() || '',
        company: body.company?.trim() || '',
        job_title: body.job_title?.trim() || '',
        notes: body.notes?.trim() || '',
        profile_image_url: body.profile_image_url || ''
      };

      const contact = await db.createContact(contactData);

      return c.json({
        message: 'Contact created successfully',
        contact
      }, 201);

    } catch (error) {
      console.error('Create contact error:', error);
      console.error('Request body:', body);
      return c.json({
        error: 'Internal server error',
        details: error.message
      }, 500);
    }
  });

  // Update contact
  contacts.put('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const contactId = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(contactId)) {
        return c.json({ error: 'Invalid contact ID' }, 400);
      }

      // Check if contact exists and belongs to user
      const existingContact = await db.getContactById(contactId, user.id);
      if (!existingContact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      // Validate email format if provided
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }

      const updateData: Partial<Contact> = {};
      
      // Only update provided fields
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 'address_street',
        'address_city', 'address_state', 'address_zip', 'address_country',
        'birthday', 'website', 'facebook', 'twitter', 'linkedin',
        'instagram', 'company', 'job_title', 'notes', 'profile_image_url'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field as keyof Contact] = body[field]?.trim?.() || body[field];
        }
      }

      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
      }

      const updatedContact = await db.updateContact(contactId, user.id, updateData);
      if (!updatedContact) {
        return c.json({ error: 'Failed to update contact' }, 500);
      }

      return c.json({
        message: 'Contact updated successfully',
        contact: updatedContact
      });

    } catch (error) {
      console.error('Update contact error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Delete contact
  contacts.delete('/:id', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const contactId = parseInt(c.req.param('id'));

      if (isNaN(contactId)) {
        return c.json({ error: 'Invalid contact ID' }, 400);
      }

      // Check if contact exists and belongs to user
      const existingContact = await db.getContactById(contactId, user.id);
      if (!existingContact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      // Delete profile image if exists
      if (existingContact.profile_image_url) {
        await storage.deleteFile(existingContact.profile_image_url);
      }

      const deleted = await db.deleteContact(contactId, user.id);
      if (!deleted) {
        return c.json({ error: 'Failed to delete contact' }, 500);
      }

      return c.json({ message: 'Contact deleted successfully' });

    } catch (error) {
      console.error('Delete contact error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Upload profile image (alternative endpoint for frontend compatibility)
  contacts.put('/:id/profile-image', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const contactId = parseInt(c.req.param('id'));

      if (isNaN(contactId)) {
        return c.json({ error: 'Invalid contact ID' }, 400);
      }

      // Check if contact exists and belongs to user
      const existingContact = await db.getContactById(contactId, user.id);
      if (!existingContact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      const formData = await c.req.formData();
      const file = formData.get('profile_image') as File;

      if (!file) {
        return c.json({ error: 'No image file provided' }, 400);
      }

      // Validate file
      const validation = storage.validateFile(file, ALLOWED_IMAGE_TYPES, 5);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Delete old image if exists
      if (existingContact.profile_image_url) {
        await storage.deleteFile(existingContact.profile_image_url);
      }

      // Upload new image
      const fileName = await storage.uploadProfileImage(file, user.id, contactId);

      // Update contact with new image URL
      const updatedContact = await db.updateContact(contactId, user.id, {
        profile_image_url: fileName
      });

      return c.json({
        message: 'Profile image uploaded successfully',
        profile_image_url: fileName,
        contact: updatedContact
      });

    } catch (error) {
      console.error('Upload profile image error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Upload profile image (original endpoint)
  contacts.post('/:id/image', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const contactId = parseInt(c.req.param('id'));

      if (isNaN(contactId)) {
        return c.json({ error: 'Invalid contact ID' }, 400);
      }

      // Check if contact exists and belongs to user
      const existingContact = await db.getContactById(contactId, user.id);
      if (!existingContact) {
        return c.json({ error: 'Contact not found' }, 404);
      }

      const formData = await c.req.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return c.json({ error: 'No image file provided' }, 400);
      }

      // Validate file
      const validation = storage.validateFile(file, ALLOWED_IMAGE_TYPES, 5);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Delete old image if exists
      if (existingContact.profile_image_url) {
        await storage.deleteFile(existingContact.profile_image_url);
      }

      // Upload new image
      const fileName = await storage.uploadProfileImage(file, user.id, contactId);

      // Update contact with new image URL
      const updatedContact = await db.updateContact(contactId, user.id, {
        profile_image_url: fileName
      });

      return c.json({
        message: 'Profile image uploaded successfully',
        contact: updatedContact
      });

    } catch (error) {
      console.error('Upload image error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Bulk delete contacts
  contacts.post('/bulk-delete', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();
      const { contactIds } = body;

      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return c.json({ error: 'Contact IDs array is required' }, 400);
      }

      let deletedCount = 0;
      const errors: string[] = [];

      for (const contactId of contactIds) {
        try {
          const contact = await db.getContactById(contactId, user.id);
          if (contact) {
            // Delete profile image if exists
            if (contact.profile_image_url) {
              await storage.deleteFile(contact.profile_image_url);
            }
            
            const deleted = await db.deleteContact(contactId, user.id);
            if (deleted) {
              deletedCount++;
            }
          }
        } catch (error) {
          errors.push(`Failed to delete contact ${contactId}`);
        }
      }

      return c.json({
        message: `Successfully deleted ${deletedCount} contacts`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return contacts;
}
