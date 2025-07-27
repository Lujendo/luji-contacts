import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import ColumnMapping from './ColumnMapping';

// Custom Alert Component
const Alert = ({ variant = 'default', children, onClose }) => {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]}`}>
      <div className="flex items-start">
        <div className="flex-1 flex items-center">
          {variant === 'destructive' && <AlertTriangle className="h-5 w-5 mr-2" />}
          {variant === 'success' && <CheckCircle2 className="h-5 w-5 mr-2" />}
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Expected column structure
const EXPECTED_COLUMNS = {
  first_name: ['firstname', 'first', 'givenname', 'given_name'],
  last_name: ['lastname', 'last', 'surname', 'family_name'],
  email: ['email_address', 'emailaddress', 'mail'],
  phone: ['telephone', 'phone_number', 'mobile', 'cell'],
  company: ['organization', 'org', 'business', 'employer'],
  job_title: ['title', 'position', 'role'],
  address_street: ['street', 'address1', 'address_line_1'],
  address_city: ['city', 'town'],
  address_state: ['state', 'province', 'region'],
  address_zip: ['zip', 'postal_code', 'postcode'],
  address_country: ['country', 'nation'],
  website: ['url', 'web'],
  notes: ['note', 'comments', 'description']
};

// Template data for examples
const TEMPLATE_SAMPLE_DATA = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    company: 'Example Corp',
    job_title: 'Manager',
    address_street: '123 Main St',
    address_city: 'New York',
    address_state: 'NY',
    address_zip: '10001',
    address_country: 'USA',
    website: 'https://example.com',
    notes: 'Sample contact'
  }
];

// Helper function to generate templates
const generateTemplate = (format) => {
  const headers = Object.keys(EXPECTED_COLUMNS);
  const sampleData = TEMPLATE_SAMPLE_DATA;

  switch (format) {
    case 'csv':
      const csv = Papa.unparse({
        fields: headers,
        data: sampleData
      });
      const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(csvBlob, 'contact_template.csv');
      break;

    case 'xlsx':
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

      // Add column widths and formatting
      const colWidths = headers.map(() => ({ wch: 20 }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Contacts Template');
      XLSX.writeFile(wb, 'contact_template.xlsx');
      break;

    case 'json':
      const jsonTemplate = {
        format_version: "1.0",
        description: "Contact import template",
        required_fields: ["first_name", "last_name"],
        sample_data: sampleData,
        field_descriptions: Object.fromEntries(
          headers.map(header => [
            header,
            {
              description: `Contact's ${header.replace(/_/g, ' ')}`,
              alternatives: EXPECTED_COLUMNS[header]
            }
          ])
        )
      };
      const jsonBlob = new Blob(
        [JSON.stringify(jsonTemplate, null, 2)],
        { type: 'application/json' }
      );
      saveAs(jsonBlob, 'contact_template.json');
      break;
  }
};

// Helper function for normalizing field names
const normalizeFieldName = (key) => {
  if (!key) return '';
  key = key.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Direct match
  if (Object.keys(EXPECTED_COLUMNS).includes(key)) {
    return key;
  }

  // Check variations
  for (const [standardField, variations] of Object.entries(EXPECTED_COLUMNS)) {
    if (variations.includes(key)) {
      return standardField;
    }
  }

  return key;
};

// Helper function to clean contact data
const cleanContactData = (contact) => {
  const cleaned = {
    first_name: (contact.first_name || contact.firstname || contact.name || '').toString().trim(),
    last_name: (contact.last_name || contact.lastname || '').toString().trim(),
    email: (contact.email || '').toString().trim(),
    phone: (contact.phone || contact.telephone || '').toString().trim(),
    company: (contact.company || contact.organization || '').toString().trim(),
    job_title: (contact.job_title || contact.title || '').toString().trim(),
    address_street: (contact.address_street || contact.street || '').toString().trim(),
    address_city: (contact.address_city || contact.city || '').toString().trim(),
    address_state: (contact.address_state || contact.state || '').toString().trim(),
    address_zip: (contact.address_zip || contact.zip || '').toString().trim(),
    address_country: (contact.address_country || contact.country || '').toString().trim(),
    website: (contact.website || contact.url || '').toString().trim(),
    notes: (contact.notes || contact.note || '').toString().trim()
  };

  if (!cleaned.first_name && !cleaned.last_name && contact.name) {
    const nameParts = contact.name.toString().trim().split(/\s+/);
    cleaned.first_name = nameParts[0] || '';
    cleaned.last_name = nameParts.slice(1).join(' ') || '';
  }

  return cleaned;
};
// Main Component
const DashboardImportExport = ({ onImportComplete, onError, onClose }) => {
  const [state, setState] = useState({
    isLoading: false,
    progress: 0,
    error: null,
    success: null,
    dragActive: false,
    importData: null,
    showMapping: false,
    showPreview: false,
    mappedData: null
  });

  const fileInputRef = useRef(null);
  const dragCountRef = useRef(0);

  const [preferences] = useState({
    maxFileSize: 10 * 1024 * 1024,
    allowedFormats: ['csv', 'xlsx', 'xls', 'vcf', 'json'],
    batchSize: 50
  });

  // Import contacts in batches
  const importContacts = useCallback(async (contacts) => {
    const batchSize = preferences.batchSize;
    const totalContacts = contacts.length;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      try {
        const results = await Promise.all(
          batch.map(async (contact) => {
            try {
              const cleanedContact = cleanContactData(contact);
              console.log('Sending contact data:', cleanedContact);

              const response = await axios.post('/api/contacts', cleanedContact);
              console.log('Contact import success:', response.data);
              return { success: true };
            } catch (error) {
              console.error('Contact import error:', {
                error: error.response?.data || error.message,
                contact
              });
              return { success: false, error };
            }
          })
        );

        results.forEach(result => {
          if (result.success) imported++;
          else failed++;
        });

        setState(prev => ({
          ...prev,
          progress: Math.round(((i + batch.length) / totalContacts) * 100)
        }));
      } catch (error) {
        console.error('Batch import error:', error);
      }
    }

    return { imported, failed };
  }, [preferences.batchSize]);

  // Format-specific processors
  const processCSVFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: (results) => {
          console.log('CSV parse results:', results);
          resolve({
            data: results.data,
            headers: results.meta.fields,
            originalHeaders: results.meta.fields
          });
        },
        error: reject
      });
    });
  }, []);

  const processVCardFile = useCallback(async (file) => {
    const text = await file.text();
    console.log('Processing vCard file:', text); // Debug log

    const vcards = text.split(/(?=BEGIN:VCARD)/i).filter(card => card.trim());
    console.log(`Found ${vcards.length} vCards`); // Debug log

    const data = vcards.map(vcard => {
      const getValue = (field, isMultiline = false) => {
        let pattern = isMultiline ?
          new RegExp(`${field}([;][^:]*)?:([^\\r\\n]+(?:\\r\\n\\s[^\\r\\n]+)*)`, 'i') :
          new RegExp(`${field}([;][^:]*)?:([^\\r\\n]+)`, 'i');

        const match = vcard.match(pattern);
        if (!match) return '';

        // Handle parameters (like type)
        const value = match[2].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
        return value;
      };

      const getStructuredValue = (field) => {
        const value = getValue(field, true);
        return value.split(';').map(part => part.trim());
      };

      // Parse name components
      const parseName = () => {
        // Try structured name first
        const n = getStructuredValue('N');
        if (n.length >= 2) {
          return {
            lastName: n[0] || '',
            firstName: n[1] || '',
            additionalName: n[2] || '',
            prefix: n[3] || '',
            suffix: n[4] || ''
          };
        }

        // Fallback to formatted name
        const fn = getValue('FN');
        if (fn) {
          const parts = fn.split(' ');
          return {
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            additionalName: '',
            prefix: '',
            suffix: ''
          };
        }

        return { firstName: '', lastName: '', additionalName: '', prefix: '', suffix: '' };
      };

      // Parse address components
      const parseAddress = () => {
        // Try to get the first address entry
        const adr = getStructuredValue('ADR');
        if (adr.length >= 7) {
          return {
            pobox: adr[0] || '',
            extended: adr[1] || '',
            street: adr[2] || '',
            city: adr[3] || '',
            state: adr[4] || '',
            zip: adr[5] || '',
            country: adr[6] || ''
          };
        }
        return { pobox: '', extended: '', street: '', city: '', state: '', zip: '', country: '' };
      };

      // Parse all email addresses
      const parseEmails = () => {
        const emailPattern = /EMAIL([^:]*):([^\r\n]+)/gi;
        const emails = [];
        let match;
        while ((match = emailPattern.exec(vcard)) !== null) {
          emails.push(match[2].trim());
        }
        return emails[0] || ''; // Return first email
      };

      // Parse all phone numbers
      const parsePhones = () => {
        const phonePattern = /TEL([^:]*):([^\r\n]+)/gi;
        const phones = [];
        let match;
        while ((match = phonePattern.exec(vcard)) !== null) {
          phones.push(match[2].trim());
        }
        return phones[0] || ''; // Return first phone
      };

      // Parse organization details
      const parseOrganization = () => {
        const org = getValue('ORG', true);
        return org.split(';')[0] || '';
      };

      const name = parseName();
      const address = parseAddress();
      const email = parseEmails();
      const phone = parsePhones();
      const organization = parseOrganization();

      // Construct the contact object with all available details
      const contact = {
        first_name: name.firstName,
        last_name: name.lastName,
        email: email,
        phone: phone,
        company: organization,
        job_title: getValue('TITLE'),
        address_street: address.street + (address.extended ? ', ' + address.extended : ''),
        address_city: address.city,
        address_state: address.state,
        address_zip: address.zip,
        address_country: address.country,
        website: getValue('URL'),
        notes: getValue('NOTE', true)
      };

      // Additional social media fields if present
      const socialMedia = getValue('X-SOCIALPROFILE') || '';
      if (socialMedia.includes('twitter.com')) contact.twitter = socialMedia;
      if (socialMedia.includes('linkedin.com')) contact.linkedin = socialMedia;
      if (socialMedia.includes('facebook.com')) contact.facebook = socialMedia;
      if (socialMedia.includes('instagram.com')) contact.instagram = socialMedia;

      console.log('Processed vCard contact:', contact); // Debug log
      return contact;
    });

    return {
      data,
      headers: Object.keys(data[0] || {}),
      originalHeaders: Object.keys(data[0] || {})
    };
  }, []);

  // Add this after your processCSVFile and processVCardFile functions
  const processExcelFile = useCallback(async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: ''
      });

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain headers and at least one data row');
      }

      const headers = jsonData[0].map(h => h?.toString().trim() || '');
      const data = jsonData.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header) {
            // Ensure value is converted to string and trimmed
            obj[header] = row[index]?.toString().trim() || '';
          }
        });
        return obj;
      });

      console.log('Processed Excel Data:', {
        headers,
        sampleRow: data[0],
        totalRows: data.length
      });

      return {
        data,
        headers,
        originalHeaders: headers
      };
    } catch (error) {
      console.error('Excel processing error:', error);
      throw new Error(`Error processing Excel file: ${error.message}`);
    }
  }, []);


  // Handle export functionality
  const handleExport = useCallback(async (format) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        success: null
      }));

      const response = await axios.get(`/api/contacts/export/${format}`, {
        responseType: 'blob'
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `contacts_${timestamp}.${format}`;
      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      saveAs(blob, filename);

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Export completed successfully'
      }));
    } catch (error) {
      console.error('Export error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to export contacts'
      }));
      if (onError) onError('Export failed');
    }
  }, [onError]);
  // Process file and show mapping if needed
  const processFile = useCallback(async (file) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        progress: 0,
        error: null,
        success: null
      }));

      console.log('Starting file processing:', file.name);

      if (file.size > preferences.maxFileSize) {
        throw new Error(`File size exceeds ${preferences.maxFileSize / (1024 * 1024)}MB limit`);
      }

      const extension = file.name.split('.').pop().toLowerCase();
      if (!preferences.allowedFormats.includes(extension)) {
        throw new Error(`Unsupported format. Allowed: ${preferences.allowedFormats.join(', ')}`);
      }

      let processedData;
      switch (extension) {
        case 'csv':
          processedData = await processCSVFile(file);
          break;
        case 'xlsx':
        case 'xls':
          processedData = await processExcelFile(file);
          break;
        case 'vcf':
          processedData = await processVCardFile(file);
          break;
        default:
          throw new Error('Unsupported file format');
      }

      if (!processedData.data || processedData.data.length === 0) {
        throw new Error('No valid contacts found in file');
      }

      // Direct import for vCards (no mapping needed)
      if (extension === 'vcf') {
        const { imported, failed } = await importContacts(processedData.data);
        setState(prev => ({
          ...prev,
          isLoading: false,
          progress: 100,
          success: `Successfully imported ${imported} contacts${failed > 0 ? `, ${failed} failed` : ''}`
        }));

        if (imported > 0 && onImportComplete) {
          await onImportComplete();
        }
      } else {
        // Check if mapping is needed for other formats
        const needsMapping = processedData.headers.some(header => {
          const normalizedHeader = normalizeFieldName(header);
          return !Object.keys(EXPECTED_COLUMNS).includes(normalizedHeader);
        });

        if (needsMapping) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            importData: {
              headers: processedData.headers,
              data: processedData.data,
              originalHeaders: processedData.originalHeaders,
              sampleRow: processedData.data[0] || {}
            },
            showMapping: true
          }));
        } else {
          const contacts = processedData.data.map(row => {
            const normalizedRow = {};
            Object.entries(row).forEach(([key, value]) => {
              const normalizedKey = normalizeFieldName(key);
              if (normalizedKey) {
                normalizedRow[normalizedKey] = value;
              }
            });
            return cleanContactData(normalizedRow);
          });

          const { imported, failed } = await importContacts(contacts);
          setState(prev => ({
            ...prev,
            isLoading: false,
            progress: 100,
            success: `Successfully imported ${imported} contacts${failed > 0 ? `, ${failed} failed` : ''}`
          }));

          if (imported > 0 && onImportComplete) {
            await onImportComplete();
          }
        }
      }
    } catch (error) {
      console.error('File processing error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      if (onError) onError(error.message);
    }
  }, [
    preferences.maxFileSize,
    preferences.allowedFormats,
    processCSVFile,
    processExcelFile,
    processVCardFile,
    importContacts,
    onImportComplete,
    onError
  ]);

  // Handle mapped data import
  const handleMappedDataImport = useCallback(async (mappedData) => {
    try {
      const contacts = mappedData.map(cleanContactData);
      const { imported, failed } = await importContacts(contacts);

      setState(prev => ({
        ...prev,
        showMapping: false,
        success: `Successfully imported ${imported} contacts${failed > 0 ? `, ${failed} failed` : ''}`
      }));

      if (imported > 0 && onImportComplete) {
        await onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to import contacts'
      }));
    }
  }, [importContacts, onImportComplete]);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {state.error && (
        <Alert
          variant="destructive"
          onClose={() => setState(prev => ({ ...prev, error: null }))}
        >
          {state.error}
        </Alert>
      )}

      {state.success && (
        <Alert
          variant="success"
          onClose={() => setState(prev => ({ ...prev, success: null }))}
        >
          {state.success}
        </Alert>
      )}

      {/* Column Mapping View */}
      {state.showMapping && state.importData && (
        <ColumnMapping
          headers={state.importData.headers}
          sampleData={state.importData.sampleRow}
          onConfirm={(mapping) => {
            const mappedData = state.importData.data.map(row => {
              const newRow = {};
              Object.entries(mapping).forEach(([header, field]) => {
                if (field) newRow[field] = row[header];
              });
              return newRow;
            });
            handleMappedDataImport(mappedData);
          }}
          onCancel={() => {
            setState(prev => ({
              ...prev,
              showMapping: false,
              importData: null
            }));
          }}
        />
      )}

      {/* Default Import/Export View */}
      {!state.showMapping && (
        <div className="space-y-4">
          {/* Template Downloads */}
          <div className="flex items-center justify-end space-x-4 mb-4">
            <span className="text-sm text-gray-600">Download Template:</span>
            {[
              { format: 'csv', label: 'CSV' },
              { format: 'xlsx', label: 'Excel' },
              { format: 'json', label: 'JSON' }
            ].map(({ format, label }) => (
              <button
                key={format}
                onClick={() => generateTemplate(format)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Import Section */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${state.dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}
                ${state.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !state.isLoading && fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCountRef.current += 1;
              if (!state.isLoading) setState(prev => ({ ...prev, dragActive: true }));
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dragCountRef.current -= 1;
              if (dragCountRef.current === 0) {
                setState(prev => ({ ...prev, dragActive: false }));
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCountRef.current = 0;
              setState(prev => ({ ...prev, dragActive: false }));
              if (!state.isLoading && e.dataTransfer.files?.[0]) {
                processFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={preferences.allowedFormats.map(fmt => `.${fmt}`).join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              disabled={state.isLoading}
            />

            {state.isLoading ? (
              <div className="flex flex-col items-center">
                <Loader className="h-12 w-12 animate-spin text-indigo-600" />
                <p className="mt-2 text-sm text-gray-500">
                  Processing... {state.progress}%
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-indigo-600" />
                <div>
                  <span className="text-indigo-600 font-medium">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: {preferences.allowedFormats.join(', ').toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { format: 'csv', icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600' },
              { format: 'xlsx', icon: FileSpreadsheet, label: 'Excel', color: 'text-blue-600' },
              { format: 'vcf', icon: FileText, label: 'vCard', color: 'text-purple-600' },
              { format: 'json', icon: FileJson, label: 'JSON', color: 'text-orange-600' }
            ].map(({ format, icon: Icon, label, color }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={state.isLoading}
                className={`flex items-center justify-center space-x-2 p-4 border rounded-lg
                    transition-colors ${state.isLoading ? 'opacity-50 cursor-not-allowed' :
                    'hover:bg-gray-50'}`}
              >
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardImportExport;