import React, { useState, useRef, useCallback, ChangeEvent } from 'react';
import { Contact, CreateContactRequest } from '../types';
import { contactsApi } from '../api';
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
// import ColumnMapping from './ColumnMapping.jsx'; // TODO: Convert to TypeScript

// Alert component props interface
interface AlertProps {
  variant?: 'default' | 'destructive' | 'success';
  children: React.ReactNode;
  onClose?: () => void;
}

// Custom Alert Component
const Alert: React.FC<AlertProps> = ({ variant = 'default', children, onClose }) => {
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
  first_name: { label: 'First Name', required: false },
  last_name: { label: 'Last Name', required: false },
  email: { label: 'Email', required: false },
  phone: { label: 'Phone', required: false },
  company: { label: 'Company', required: false },
  job_title: { label: 'Job Title', required: false },
  website: { label: 'Website', required: false },
  linkedin: { label: 'LinkedIn', required: false },
  twitter: { label: 'Twitter', required: false },
  facebook: { label: 'Facebook', required: false },
  instagram: { label: 'Instagram', required: false },
  birthday: { label: 'Birthday', required: false },
  address_street: { label: 'Street Address', required: false },
  address_city: { label: 'City', required: false },
  address_state: { label: 'State/Province', required: false },
  address_zip: { label: 'ZIP/Postal Code', required: false },
  address_country: { label: 'Country', required: false },
  notes: { label: 'Notes', required: false }
};

// Import result interface
interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Component props interface
interface DashboardImportExportProps {
  onClose: () => void;
  onContactsImported?: (contacts: Contact[]) => void;
}

// Import step type
type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

// Export format type
type ExportFormat = 'csv' | 'xlsx' | 'json';

const DashboardImportExport: React.FC<DashboardImportExportProps> = ({
  onClose,
  onContactsImported
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear messages after timeout
  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle file selection
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls|json)$/i)) {
      setError('Please select a CSV, Excel, or JSON file');
      return;
    }

    setFile(selectedFile);
    setError('');
    parseFile(selectedFile);
  }, []);

  // Parse uploaded file
  const parseFile = useCallback((file: File) => {
    setLoading(true);
    setError('');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          Papa.parse(content as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                setError(`CSV parsing error: ${results.errors[0].message}`);
                setLoading(false);
                return;
              }
              setParsedData(results.data);
              setImportStep('mapping');
              setLoading(false);
            }
          });
        } else if (file.name.match(/\.(xlsx|xls)$/i)) {
          // Parse Excel
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setParsedData(jsonData);
          setImportStep('mapping');
          setLoading(false);
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          try {
            const jsonData = JSON.parse(content as string);
            if (!Array.isArray(jsonData)) {
              setError('JSON file must contain an array of contacts');
              setLoading(false);
              return;
            }
            setParsedData(jsonData);
            setImportStep('mapping');
            setLoading(false);
          } catch (parseError) {
            setError('Invalid JSON file format');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('File parsing error:', error);
        setError('Failed to parse file. Please check the file format.');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    if (file.name.match(/\.(xlsx|xls)$/i)) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  }, []);

  // Handle column mapping completion
  const handleMappingComplete = useCallback((mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    setImportStep('preview');
  }, []);

  // Transform data based on column mapping
  const transformData = useCallback((): CreateContactRequest[] => {
    return parsedData.map(row => {
      const transformedRow: CreateContactRequest = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        website: '',
        linkedin: '',
        twitter: '',
        facebook: '',
        instagram: '',
        birthday: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        address_country: '',
        notes: ''
      };

      // Apply column mapping
      Object.entries(columnMapping).forEach(([csvColumn, contactField]) => {
        if (contactField && row[csvColumn] !== undefined) {
          const value = String(row[csvColumn]).trim();
          if (value) {
            (transformedRow as any)[contactField] = value;
          }
        }
      });

      return transformedRow;
    });
  }, [parsedData, columnMapping]);

  // Import contacts
  const handleImport = useCallback(async () => {
    setImportStep('importing');
    setLoading(true);
    setError('');

    try {
      const transformedData = transformData();
      const results: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Import contacts one by one (could be optimized with batch API)
      for (const contactData of transformedData) {
        try {
          // Skip empty contacts
          if (!contactData.first_name && !contactData.last_name && !contactData.email) {
            continue;
          }

          await contactsApi.createContact(contactData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to import contact: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      setImportResult(results);
      setImportStep('complete');

      if (results.success > 0) {
        setSuccess(`Successfully imported ${results.success} contacts`);
        
        // Refresh contacts list if callback provided
        if (onContactsImported) {
          try {
            const allContacts = await contactsApi.getContacts();
            onContactsImported(allContacts);
          } catch (error) {
            console.error('Error refreshing contacts:', error);
          }
        }
      }

      if (results.failed > 0) {
        setError(`${results.failed} contacts failed to import`);
      }

    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import contacts');
      setImportStep('preview');
    } finally {
      setLoading(false);
    }
  }, [transformData, onContactsImported]);

  // Export contacts
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    setError('');

    try {
      const contacts = await contactsApi.getContacts();
      
      if (contacts.length === 0) {
        setError('No contacts to export');
        setExportLoading(false);
        return;
      }

      // Prepare export data
      const exportData = contacts.map(contact => ({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        job_title: contact.job_title || '',
        website: contact.website || '',
        linkedin: contact.linkedin || '',
        twitter: contact.twitter || '',
        facebook: contact.facebook || '',
        instagram: contact.instagram || '',
        birthday: contact.birthday || '',
        address_street: contact.address_street || '',
        address_city: contact.address_city || '',
        address_state: contact.address_state || '',
        address_zip: contact.address_zip || '',
        address_country: contact.address_country || '',
        notes: contact.notes || ''
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `contacts_${timestamp}`;

      if (exportFormat === 'csv') {
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${filename}.csv`);
      } else if (exportFormat === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${filename}.xlsx`);
      } else if (exportFormat === 'json') {
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        saveAs(blob, `${filename}.json`);
      }

      setSuccess(`Successfully exported ${contacts.length} contacts`);

    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export contacts');
    } finally {
      setExportLoading(false);
    }
  }, [exportFormat]);

  // Reset import process
  const resetImport = useCallback(() => {
    setImportStep('upload');
    setFile(null);
    setParsedData([]);
    setColumnMapping({});
    setImportResult(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Import & Export Contacts
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4">
          <Alert variant="destructive" onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4">
          <Alert variant="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Import Contacts
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export Contacts
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Steps */}
            <div className="flex items-center space-x-4 mb-8">
              {['upload', 'mapping', 'preview', 'importing', 'complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      importStep === step
                        ? 'bg-indigo-600 text-white'
                        : index < ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(importStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                    {step}
                  </span>
                  {index < 4 && <div className="w-8 h-0.5 bg-gray-200 ml-4" />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {importStep === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Upload Contact File
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Upload a CSV, Excel, or JSON file containing your contacts. The file should include columns for contact information.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {loading ? (
                    <div className="flex flex-col items-center">
                      <Loader className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                      <p className="text-sm text-gray-600">Processing file...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Choose a file to upload
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        CSV, Excel (.xlsx, .xls), or JSON files up to 10MB
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Select File
                      </button>
                    </div>
                  )}
                </div>

                {/* Supported formats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Formats:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">CSV (.csv)</span>
                    </div>
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">Excel (.xlsx, .xls)</span>
                    </div>
                    <div className="flex items-center">
                      <FileJson className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">JSON (.json)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {importStep === 'mapping' && parsedData.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Map Columns
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Map the columns from your file to the contact fields. Found {parsedData.length} rows.
                  </p>
                </div>

                {/* Simple Column Mapping */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Column Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(parsedData[0] || {}).map((fileColumn) => (
                        <div key={fileColumn}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {fileColumn}
                          </label>
                          <select
                            value={columnMapping[fileColumn] || ''}
                            onChange={(e) => setColumnMapping(prev => ({
                              ...prev,
                              [fileColumn]: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">-- Skip this column --</option>
                            {Object.entries(EXPECTED_COLUMNS).map(([key, config]) => (
                              <option key={key} value={key}>
                                {config.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleMappingComplete(columnMapping)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Continue to Preview
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            )}

            {importStep === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Preview Import
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Review the contacts that will be imported. {transformData().length} contacts ready for import.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Contact Preview</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transformData().slice(0, 10).map((contact, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {`${contact.first_name} ${contact.last_name}`.trim() || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.email || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.phone || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{contact.company || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {transformData().length > 10 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Showing first 10 of {transformData().length} contacts
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setImportStep('mapping')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Mapping
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Import Contacts
                  </button>
                </div>
              </div>
            )}

            {importStep === 'importing' && (
              <div className="text-center py-12">
                <Loader className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Contacts</h3>
                <p className="text-sm text-gray-600">Please wait while we import your contacts...</p>
              </div>
            )}

            {importStep === 'complete' && importResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete</h3>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                      <div className="text-sm text-gray-600">Successfully Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-gray-600">Failed to Import</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-red-600">{error}</p>
                        ))}
                        {importResult.errors.length > 5 && (
                          <p className="text-sm text-red-600">
                            ... and {importResult.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Import More Contacts
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Export Contacts
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Export all your contacts to a file. Choose your preferred format below.
              </p>
            </div>

            {/* Export Format Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Select Export Format</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">CSV</div>
                        <div className="text-sm text-gray-600">Comma-separated values</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="xlsx"
                    checked={exportFormat === 'xlsx'}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    exportFormat === 'xlsx'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Excel</div>
                        <div className="text-sm text-gray-600">Microsoft Excel format</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    exportFormat === 'json'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center">
                      <FileJson className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">JSON</div>
                        <div className="text-sm text-gray-600">JavaScript Object Notation</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Export Information</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• All contact information will be included in the export</li>
                    <li>• The file will be downloaded to your default download folder</li>
                    <li>• Export includes: name, email, phone, company, address, and more</li>
                    <li>• File will be named with current date: contacts_YYYY-MM-DD</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-center">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Export Contacts ({exportFormat.toUpperCase()})
                  </>
                )}
              </button>
            </div>

            {/* Export Tips */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>CSV:</strong> Best for importing into other contact management systems</li>
                <li>• <strong>Excel:</strong> Great for viewing and editing in spreadsheet applications</li>
                <li>• <strong>JSON:</strong> Ideal for developers and technical integrations</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardImportExport;
