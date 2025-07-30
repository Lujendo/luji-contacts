// Contact routes for CRUD operations
import { Hono } from 'hono';
import { DatabaseService, Contact, ApiResponse, ErrorHandler } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';
import { StorageService, ALLOWED_IMAGE_TYPES } from '../utils/storage';
import { Validator } from '../utils/validation';

export function createContactRoutes(db: DatabaseService, auth: AuthService, storage: StorageService) {
  const contacts = new Hono<{ Bindings: Env }>();

  // Apply authentication middleware to all routes
  contacts.use('*', createAuthMiddleware(auth, db));

  // Get all contacts with search, sorting, and pagination
  contacts.get('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const { search, sort, direction, limit, offset, page, group } = c.req.query();

      // Parse pagination parameters
      const parsedLimit = limit ? Math.min(parseInt(limit), 100) : 50; // Default 50, max 100
      const parsedOffset = offset ? parseInt(offset) : 0;
      const parsedPage = page ? parseInt(page) : 1;
      const parsedGroupId = group ? parseInt(group) : undefined;

      // Calculate offset from page if provided
      const finalOffset = page ? (parsedPage - 1) * parsedLimit : parsedOffset;

      console.log('📡 API: Contacts request - User:', user.id, 'Group:', parsedGroupId, 'Search:', search, 'Page:', parsedPage);

      const result = await db.getContactsByUserId(
        user.id,
        search,
        sort,
        direction,
        parsedLimit,
        finalOffset,
        parsedGroupId
      );

      // Optimize group loading - batch fetch all groups for all contacts at once
      const storage = new StorageService(c.env.STORAGE);
      const contactIds = result.contacts.map(c => c.id);

      // Batch fetch all groups for all contacts in one query
      const allContactGroups = contactIds.length > 0
        ? await db.getBatchGroupsByContactIds(contactIds)
        : new Map();

      const contactsWithGroups = result.contacts.map((contact) => {
        const groups = allContactGroups.get(contact.id) || [];
        return {
          ...contact,
          profile_image_url: contact.profile_image_url ? (
            contact.profile_image_url.startsWith('/api/files/')
              ? contact.profile_image_url
              : `/api/files/${contact.profile_image_url}`
          ) : contact.profile_image_url,
          Groups: groups.map(g => ({ id: g.id, name: g.name })), // Use uppercase Groups for frontend compatibility
          groups: groups.map(g => ({ id: g.id, name: g.name }))  // Keep lowercase for backward compatibility
        };
      });

      const totalPages = Math.ceil(result.total / parsedLimit);
      const currentPage = Math.floor(finalOffset / parsedLimit) + 1;

      const response: ApiResponse = {
        data: contactsWithGroups,
        total: result.total,
        pagination: {
          limit: parsedLimit,
          offset: finalOffset,
          page: currentPage,
          totalPages: totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        },
        success: true
      };

      return c.json(response);

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

      const idValidation = Validator.validateId(contactId, 'Contact ID');
      if (!idValidation.valid) {
        const error = ErrorHandler.validationError('Invalid contact ID', idValidation.errors);
        return c.json(error.response, error.status);
      }

      const contact = await db.getContactById(contactId, user.id);
      if (!contact) {
        const error = ErrorHandler.notFoundError('Contact not found');
        return c.json(error.response, error.status);
      }

      // Get groups for this contact
      const groups = await db.getGroupsByContactId(contact.id);
      const storage = new StorageService(c.env.STORAGE);

      const contactWithGroups = {
        ...contact,
        profile_image_url: contact.profile_image_url ? (
          contact.profile_image_url.startsWith('/api/files/')
            ? contact.profile_image_url
            : `/api/files/${contact.profile_image_url}`
        ) : contact.profile_image_url,
        Groups: groups.map(g => ({ id: g.id, name: g.name })), // Use uppercase Groups for frontend compatibility
        groups: groups.map(g => ({ id: g.id, name: g.name }))  // Keep lowercase for backward compatibility
      };

      const response: ApiResponse = {
        data: contactWithGroups,
        success: true
      };

      return c.json(response);

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

      // Validate contact data
      const validation = Validator.validateContact(body);
      if (!validation.valid) {
        const error = ErrorHandler.validationError('Contact validation failed', validation.errors);
        return c.json(error.response, error.status);
      }

      // Check contact limit
      if (user.contact_limit && user.contact_limit > 0) {
        const existingContacts = await db.getContactsByUserIdLegacy(user.id);
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
        youtube: body.youtube?.trim() || '',
        tiktok: body.tiktok?.trim() || '',
        snapchat: body.snapchat?.trim() || '',
        discord: body.discord?.trim() || '',
        spotify: body.spotify?.trim() || '',
        apple_music: body.apple_music?.trim() || '',
        github: body.github?.trim() || '',
        behance: body.behance?.trim() || '',
        dribbble: body.dribbble?.trim() || '',
        company: body.company?.trim() || '',
        job_title: body.job_title?.trim() || '',
        role: body.role?.trim() || '',
        notes: body.notes?.trim() || '',
        profile_image_url: body.profile_image_url || ''
      };

      const contact = await db.createContact(contactData);

      const response: ApiResponse = {
        data: contact,
        message: 'Contact created successfully',
        success: true
      };

      return c.json(response, 201);

    } catch (error) {
      console.error('Create contact error:', error);
      return c.json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
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
        'instagram', 'youtube', 'tiktok', 'snapchat', 'discord', 'spotify',
        'apple_music', 'github', 'behance', 'dribbble', 'company', 'job_title', 'role', 'notes', 'profile_image_url'
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
        return c.json({ error: 'Failed to update contact', success: false }, 500);
      }

      // Get groups for the updated contact
      const groups = await db.getGroupsByContactId(updatedContact.id);
      const storage = new StorageService(c.env.STORAGE);
      const contactWithGroups = {
        ...updatedContact,
        profile_image_url: updatedContact.profile_image_url ? (
          updatedContact.profile_image_url.startsWith('/api/files/')
            ? updatedContact.profile_image_url
            : `/api/files/${updatedContact.profile_image_url}`
        ) : updatedContact.profile_image_url,
        Groups: groups.map(g => ({ id: g.id, name: g.name })), // Use uppercase Groups for frontend compatibility
        groups: groups.map(g => ({ id: g.id, name: g.name }))  // Keep lowercase for backward compatibility
      };

      const response: ApiResponse = {
        data: contactWithGroups,
        message: 'Contact updated successfully',
        success: true
      };

      return c.json(response);

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

      const response: ApiResponse = {
        message: 'Contact deleted successfully',
        success: true
      };

      return c.json(response);

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

      const response: ApiResponse = {
        data: {
          profile_image_url: `/api/files/${fileName}`,
          contact: updatedContact
        },
        message: 'Profile image uploaded successfully',
        success: true
      };

      return c.json(response);

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

      const response: ApiResponse = {
        data: {
          profile_image_url: `/api/files/${fileName}`,
          contact: updatedContact
        },
        message: 'Profile image uploaded successfully',
        success: true
      };

      return c.json(response);

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

      const response: ApiResponse = {
        data: {
          deletedCount,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `Successfully deleted ${deletedCount} contacts`,
        success: true
      };

      return c.json(response);

    } catch (error) {
      console.error('Bulk delete error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return contacts;
}
