// Import/Export routes for CSV and VCF functionality
import { Hono } from 'hono';
import { DatabaseService, Contact } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';
import { StorageService, ALLOWED_CSV_TYPES, parseCSV, generateCSV, generateVCF } from '../utils/storage';

export function createImportExportRoutes(db: DatabaseService, auth: AuthService, storage: StorageService) {
  const importExport = new Hono<{ Bindings: Env }>();

  // Apply authentication middleware to all routes
  importExport.use('*', createAuthMiddleware(auth, db));

  // Upload CSV file for import preview
  importExport.post('/upload-csv', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Validate file
      const validation = storage.validateFile(file, ALLOWED_CSV_TYPES, 10);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Upload file to temporary storage
      const fileName = await storage.uploadCSVFile(file, user.id);

      // Read and parse CSV content for preview
      const content = await storage.getFileContent(fileName);
      const rows = parseCSV(content);

      if (rows.length === 0) {
        return c.json({ error: 'CSV file is empty' }, 400);
      }

      const headers = rows[0];
      const sampleData = rows.slice(1, 6); // First 5 rows for preview

      return c.json({
        message: 'CSV file uploaded successfully',
        fileName,
        headers,
        sampleData,
        totalRows: rows.length - 1 // Exclude header row
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Import contacts from uploaded CSV
  importExport.post('/import-csv', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();
      const { fileName, mapping, skipFirstRow = true } = body;

      if (!fileName || !mapping) {
        return c.json({ error: 'File name and field mapping are required' }, 400);
      }

      // Check contact limit
      if (user.contact_limit && user.contact_limit > 0) {
        const existingContacts = await db.getContactsByUserId(user.id);
        const remainingSlots = user.contact_limit - existingContacts.length;
        if (remainingSlots <= 0) {
          return c.json({ 
            error: `Contact limit reached. Maximum ${user.contact_limit} contacts allowed.` 
          }, 403);
        }
      }

      // Get CSV content
      const content = await storage.getFileContent(fileName);
      const rows = parseCSV(content);

      if (rows.length === 0) {
        return c.json({ error: 'CSV file is empty' }, 400);
      }

      const dataRows = skipFirstRow ? rows.slice(1) : rows;
      const headers = rows[0];

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const contactData: Partial<Contact> = { user_id: user.id };

          // Map CSV columns to contact fields
          for (const [csvColumn, contactField] of Object.entries(mapping)) {
            const columnIndex = headers.indexOf(csvColumn);
            if (columnIndex !== -1 && row[columnIndex]) {
              const value = row[columnIndex].trim();
              if (value) {
                (contactData as Record<string, any>)[contactField as string] = value;
              }
            }
          }

          // Validate required data
          if (!contactData.first_name && !contactData.last_name && !contactData.email) {
            skippedCount++;
            continue;
          }

          // Validate email format if provided
          if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
            errors.push(`Row ${i + 1}: Invalid email format`);
            skippedCount++;
            continue;
          }

          // Check contact limit during import
          if (user.contact_limit && user.contact_limit > 0) {
            const currentCount = await db.getContactsByUserId(user.id);
            if (currentCount.length >= user.contact_limit) {
              errors.push(`Contact limit reached after importing ${importedCount} contacts`);
              break;
            }
          }

          await db.createContact(contactData as Omit<Contact, 'id' | 'created_at' | 'updated_at'>);
          importedCount++;

        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skippedCount++;
        }
      }

      // Clean up uploaded file
      await storage.deleteFile(fileName);

      return c.json({
        message: 'Import completed',
        importedCount,
        skippedCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit error messages
      });

    } catch (error) {
      console.error('CSV import error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Export contacts as CSV
  importExport.get('/export-csv', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const { groupId } = c.req.query();

      let contacts: Contact[];

      if (groupId) {
        // Export contacts from specific group
        const groupIdNum = parseInt(groupId);
        if (isNaN(groupIdNum)) {
          return c.json({ error: 'Invalid group ID' }, 400);
        }

        // Verify group belongs to user
        const group = await db.getGroupById(groupIdNum, user.id);
        if (!group) {
          return c.json({ error: 'Group not found' }, 404);
        }

        contacts = await db.getContactsByGroupId(groupIdNum);
      } else {
        // Export all contacts
        contacts = await db.getContactsByUserId(user.id);
      }

      if (contacts.length === 0) {
        return c.json({ error: 'No contacts to export' }, 400);
      }

      // Define CSV headers
      const headers = [
        'first_name', 'last_name', 'email', 'phone', 'company', 'job_title',
        'address_street', 'address_city', 'address_state', 'address_zip', 'address_country',
        'birthday', 'website', 'facebook', 'twitter', 'linkedin', 'instagram', 'notes'
      ];

      // Generate CSV content
      const csvContent = generateCSV(contacts, headers);

      // Upload to storage
      const fileName = await storage.uploadExportFile(csvContent, user.id, 'csv');

      return c.json({
        message: 'CSV export generated successfully',
        fileName,
        downloadUrl: `/api/import-export/download/${fileName}`,
        contactCount: contacts.length
      });

    } catch (error) {
      console.error('CSV export error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Export contacts as VCF
  importExport.get('/export-vcf', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const { groupId } = c.req.query();

      let contacts: Contact[];

      if (groupId) {
        // Export contacts from specific group
        const groupIdNum = parseInt(groupId);
        if (isNaN(groupIdNum)) {
          return c.json({ error: 'Invalid group ID' }, 400);
        }

        // Verify group belongs to user
        const group = await db.getGroupById(groupIdNum, user.id);
        if (!group) {
          return c.json({ error: 'Group not found' }, 404);
        }

        contacts = await db.getContactsByGroupId(groupIdNum);
      } else {
        // Export all contacts
        contacts = await db.getContactsByUserId(user.id);
      }

      if (contacts.length === 0) {
        return c.json({ error: 'No contacts to export' }, 400);
      }

      // Generate VCF content
      const vcfContent = generateVCF(contacts);

      // Upload to storage
      const fileName = await storage.uploadExportFile(vcfContent, user.id, 'vcf');

      return c.json({
        message: 'VCF export generated successfully',
        fileName,
        downloadUrl: `/api/import-export/download/${fileName}`,
        contactCount: contacts.length
      });

    } catch (error) {
      console.error('VCF export error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Download exported file
  importExport.get('/download/:fileName', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const fileName = c.req.param('fileName');

      // Verify file belongs to user (check if filename contains user ID)
      if (!fileName.includes(`/${user.id}/`)) {
        return c.json({ error: 'File not found' }, 404);
      }

      const fileBlob = await storage.getFileBlob(fileName);
      const fileMetadata = await storage.getFileMetadata(fileName);

      if (!fileMetadata) {
        return c.json({ error: 'File not found' }, 404);
      }

      // Set appropriate headers for download
      const headers = new Headers();
      headers.set('Content-Type', fileMetadata.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${fileName.split('/').pop()}"`);
      headers.set('Content-Length', fileBlob.size.toString());

      return new Response(fileBlob, { headers });

    } catch (error) {
      console.error('Download file error:', error);
      return c.json({ error: 'File not found' }, 404);
    }
  });

  // Get import/export history (list of exported files)
  importExport.get('/history', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      
      const exportFiles = await storage.listFiles(`exports/${user.id}/`, 50);
      
      const fileList = await Promise.all(
        exportFiles.map(async (fileName) => {
          const metadata = await storage.getFileMetadata(fileName);
          return {
            fileName,
            downloadUrl: `/api/import-export/download/${fileName}`,
            createdAt: metadata?.uploaded,
            size: metadata?.size,
            type: fileName.endsWith('.csv') ? 'CSV' : 'VCF'
          };
        })
      );

      // Sort by creation date (newest first)
      fileList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return c.json({
        files: fileList,
        total: fileList.length
      });

    } catch (error) {
      console.error('Get history error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Delete exported file
  importExport.delete('/files/:fileName', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const fileName = decodeURIComponent(c.req.param('fileName'));

      // Verify file belongs to user
      if (!fileName.includes(`/${user.id}/`)) {
        return c.json({ error: 'File not found' }, 404);
      }

      const deleted = await storage.deleteFile(fileName);
      if (!deleted) {
        return c.json({ error: 'File not found' }, 404);
      }

      return c.json({ message: 'File deleted successfully' });

    } catch (error) {
      console.error('Delete file error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return importExport;
}
