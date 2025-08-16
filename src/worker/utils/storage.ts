// R2 Storage utilities for file management
export class StorageService {
  constructor(private bucket: R2Bucket) {}

  // Generate unique filename with timestamp and random string
  private generateFileName(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${prefix}${timestamp}-${random}.${extension}`;
  }

  // Upload profile image
  async uploadProfileImage(file: File, userId: number, contactId?: number): Promise<string> {
    try {
      const prefix = contactId ? `contacts/${contactId}/` : `users/${userId}/`;
      const fileName = this.generateFileName(file.name, prefix);

      // Add retry logic for R2 uploads
      let lastError: Error | null = null;
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await this.bucket.put(fileName, file.stream(), {
            httpMetadata: {
              contentType: file.type,
              cacheControl: 'public, max-age=31536000', // 1 year cache
            },
            customMetadata: {
              uploadedBy: userId.toString(),
              uploadedAt: new Date().toISOString(),
              originalName: file.name,
              fileSize: file.size.toString(),
            },
          });

          return fileName;
        } catch (error) {
          lastError = error as Error;
          console.warn(`R2 upload attempt ${attempt + 1} failed:`, error);

          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      // If all retries failed, throw the last error
      throw new Error(`Failed to upload file after ${maxRetries} attempts: ${lastError?.message}`);

    } catch (error) {
      console.error('Profile image upload error:', error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload CSV file for import
  async uploadCSVFile(file: File, userId: number): Promise<string> {
    const fileName = this.generateFileName(file.name, `imports/${userId}/`);
    
    await this.bucket.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return fileName;
  }

  // Upload export file
  async uploadExportFile(content: string, userId: number, format: 'csv' | 'vcf'): Promise<string> {
    const timestamp = Date.now();
    const fileName = `exports/${userId}/contacts-${timestamp}.${format}`;
    
    await this.bucket.put(fileName, content, {
      httpMetadata: {
        contentType: format === 'csv' ? 'text/csv' : 'text/vcard',
      },
    });

    return fileName;
  }

  // Get file URL (for downloads)
  async getFileUrl(fileName: string, _expiresIn: number = 3600): Promise<string> {
    const object = await this.bucket.get(fileName);
    if (!object) {
      throw new Error('File not found');
    }

    // For Cloudflare R2, generate a public URL
    // In production, you would configure a custom domain for your R2 bucket
    // For now, we'll return the file path that can be served through the worker
    return `/api/files/${fileName}`;
  }

  // Get public URL for profile images (served through worker)
  getPublicUrl(fileName: string): string {
    return `/api/files/${fileName}`;
  }

  // Get file content
  async getFileContent(fileName: string): Promise<string> {
    const object = await this.bucket.get(fileName);
    if (!object) {
      throw new Error('File not found');
    }

    return await object.text();
  }

  // Get file as blob
  async getFileBlob(fileName: string): Promise<Blob> {
    const object = await this.bucket.get(fileName);
    if (!object) {
      throw new Error('File not found');
    }

    return object.blob();
  }

  // Delete file
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      await this.bucket.delete(fileName);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // List files in a directory
  async listFiles(prefix: string, limit: number = 100): Promise<string[]> {
    const objects = await this.bucket.list({ prefix, limit });
    return objects.objects.map(obj => obj.key);
  }

  // Clean up old temporary files
  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const tempFiles = await this.listFiles('temp/', 1000);
    
    let deletedCount = 0;
    for (const fileName of tempFiles) {
      // Extract timestamp from filename
      const timestampMatch = fileName.match(/(\d{13})/);
      if (timestampMatch) {
        const fileTimestamp = parseInt(timestampMatch[1]);
        if (fileTimestamp < cutoffTime) {
          if (await this.deleteFile(fileName)) {
            deletedCount++;
          }
        }
      }
    }

    return deletedCount;
  }

  // Validate file type and size
  validateFile(file: File, allowedTypes: string[], maxSizeMB: number = 5): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  // Get file metadata
  async getFileMetadata(fileName: string): Promise<R2ObjectBody | null> {
    return await this.bucket.get(fileName);
  }
}

// File type constants
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const ALLOWED_CSV_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain'
];

export const ALLOWED_IMPORT_TYPES = [
  ...ALLOWED_CSV_TYPES,
  'text/vcard',
  'text/x-vcard'
];

// Helper function to parse CSV content
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    if (line.trim()) {
      // Simple CSV parsing - in production, use a proper CSV parser
      const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
      result.push(fields);
    }
  }
  
  return result;
}

// Helper function to generate CSV content
export function generateCSV(data: any[], headers: string[]): string {
  const csvLines = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvLines.push(values.join(','));
  }
  
  return csvLines.join('\n');
}

// Helper function to generate VCF content
export function generateVCF(contacts: any[]): string {
  let vcfContent = '';
  
  for (const contact of contacts) {
    vcfContent += 'BEGIN:VCARD\n';
    vcfContent += 'VERSION:3.0\n';
    
    if (contact.first_name || contact.last_name) {
      vcfContent += `FN:${contact.first_name || ''} ${contact.last_name || ''}\n`;
      vcfContent += `N:${contact.last_name || ''};${contact.first_name || ''};;;\n`;
    }
    
    if (contact.email) {
      vcfContent += `EMAIL:${contact.email}\n`;
    }
    
    if (contact.phone) {
      vcfContent += `TEL:${contact.phone}\n`;
    }
    
    if (contact.company) {
      vcfContent += `ORG:${contact.company}\n`;
    }
    
    if (contact.job_title) {
      vcfContent += `TITLE:${contact.job_title}\n`;
    }
    
    if (contact.website) {
      vcfContent += `URL:${contact.website}\n`;
    }
    
    if (contact.notes) {
      vcfContent += `NOTE:${contact.notes}\n`;
    }
    
    // Address
    if (contact.address_street || contact.address_city || contact.address_state || contact.address_zip || contact.address_country) {
      const address = [
        '',
        '',
        contact.address_street || '',
        contact.address_city || '',
        contact.address_state || '',
        contact.address_zip || '',
        contact.address_country || ''
      ].join(';');
      vcfContent += `ADR:${address}\n`;
    }
    
    if (contact.birthday) {
      vcfContent += `BDAY:${contact.birthday}\n`;
    }
    
    vcfContent += 'END:VCARD\n';
  }
  
  return vcfContent;
}
