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
  Printer,
  FileOutput,
  Mail,
  AlertTriangle,
  HelpCircle,
  Settings,
  ArrowUpDown
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DashboardImportExport = ({ onImportComplete, onError }) => {
  // Enhanced state management
  const [state, setState] = useState({
    importing: false,
    exporting: false,
    error: '',
    success: '',
    debugInfo: '',
    importData: null,
    showMapping: false,
    showPreview: false,
    mappedData: null,
    fileProgress: 0,
    dragActive: false,
    showAdvancedSettings: false,
    recentImports: [],
    recentExports: []
  });

  // Settings and preferences
  const [preferences, setPreferences] = useState({
    autoMapFields: true,
    skipEmptyRows: true,
    validateEmails: true,
    validatePhones: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['csv', 'xlsx', 'xls', 'vcf', 'json'],
    defaultExportFormat: 'csv',
    showPreviewBeforeImport: true,
    preserveHistory: true,
    debugMode: process.env.NODE_ENV === 'development'
  });

  // Refs
  const fileInputRef = useRef(null);
  const importTimeoutRef = useRef(null);
  const dragCountRef = useRef(0);

  // Load saved preferences and history on mount
  useEffect(() => {
    const loadSavedPreferences = () => {
      const saved = localStorage.getItem('contactImportPreferences');
      if (saved) {
        try {
          setPreferences(prev => ({
            ...prev,
            ...JSON.parse(saved)
          }));
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    };

    const loadImportHistory = () => {
      const saved = localStorage.getItem('contactImportHistory');
      if (saved && preferences.preserveHistory) {
        try {
          const history = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            recentImports: history.imports || [],
            recentExports: history.exports || []
          }));
        } catch (error) {
          console.error('Error loading import history:', error);
        }
      }
    };

    loadSavedPreferences();
    loadImportHistory();
  }, [preferences.preserveHistory]);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('contactImportPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Update import/export history
  const updateHistory = useCallback((type, details) => {
    if (!preferences.preserveHistory) return;

    setState(prev => {
      const key = type === 'import' ? 'recentImports' : 'recentExports';
      const updated = [
        { ...details, timestamp: new Date().toISOString() },
        ...prev[key].slice(0, 9) // Keep last 10 entries
      ];

      localStorage.setItem('contactImportHistory', JSON.stringify({
        imports: type === 'import' ? updated : prev.recentImports,
        exports: type === 'export' ? updated : prev.recentExports
      }));

      return {
        ...prev,
        [key]: updated
      };
    });
  }, [preferences.preserveHistory]);

  // Enhanced error handling
  const handleError = useCallback((error, context = '') => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    setState(prev => ({
      ...prev,
      error: `${context ? `${context}: ` : ''}${errorMessage}`,
      importing: false,
      exporting: false
    }));

    if (onError) {
      onError(error);
    }

    if (preferences.debugMode) {
      setState(prev => ({
        ...prev,
        debugInfo: `${prev.debugInfo}\nError in ${context}: ${error.stack || error.message}`
      }));
    }
  }, [onError, preferences.debugMode]);

  // File validation
  const validateFile = useCallback((file) => {
    if (!file) {
      throw new Error('No file selected');
    }

    if (file.size > preferences.maxFileSize) {
      throw new Error(`File size exceeds ${preferences.maxFileSize / (1024 * 1024)}MB limit`);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!preferences.allowedFormats.includes(extension)) {
      throw new Error(`Unsupported file format. Allowed formats: ${preferences.allowedFormats.join(', ')}`);
    }

    return true;
  }, [preferences.maxFileSize, preferences.allowedFormats]);

    // Enhanced file processing with type detection and validation
  const processFile = useCallback(async (file) => {
    try {
      setState(prev => ({
        ...prev,
        importing: true,
        error: '',
        debugInfo: `Starting file processing: ${file.name}`
      }));

      validateFile(file);

      const fileType = getFileType(file);
      let parsedData;

      switch (fileType) {
        case 'csv':
          parsedData = await processCSVFile(file);
          break;
        case 'excel':
          parsedData = await processExcelFile(file);
          break;
        case 'vcf':
          parsedData = await processVCardFile(file);
          break;
        case 'json':
          parsedData = await processJSONFile(file);
          break;
        default:
          throw new Error('Unsupported file format');
      }

      if (!parsedData || !parsedData.data.length) {
        throw new Error('No valid data found in file');
      }

      // Update state with parsed data
      setState(prev => ({
        ...prev,
        importData: parsedData,
        showMapping: true,
        importing: false,
        debugInfo: `${prev.debugInfo}\nSuccessfully processed ${parsedData.data.length} records`
      }));

    } catch (error) {
      handleError(error, 'File Processing');
    }
  }, [validateFile, handleError]);

  // CSV File Processing
  const processCSVFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: preferences.skipEmptyRows ? 'greedy' : false,
        transformHeader: (header) => header.trim().toLowerCase().replace(/[\s-]+/g, '_'),
        complete: (results) => {
          if (results.errors.length > 0) {
            setState(prev => ({
              ...prev,
              debugInfo: `${prev.debugInfo}\nParse errors: ${results.errors.map(e => `Row ${e.row}: ${e.message}`).join(', ')}`
            }));
          }

          const validData = validateAndCleanData(results.data);
          if (validData.length === 0) {
            reject(new Error('No valid data rows found after filtering'));
            return;
          }

          resolve({
            type: 'csv',
            headers: results.meta.fields,
            data: validData,
            originalHeaders: results.meta.fields,
            sampleRow: validData[0],
            totalRows: validData.length,
            mapping: preferences.autoMapFields ? autoDetectMapping(results.meta.fields) : {}
          });
        },
        error: (error) => reject(error)
      });
    });
  }, [preferences, validateAndCleanData, autoDetectMapping]);

  // Excel File Processing
  const processExcelFile = useCallback(async (file) => {
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least headers and one data row');
      }

      const headers = jsonData[0].map(h => h.toString().trim().toLowerCase().replace(/[\s-]+/g, '_'));
      const data = jsonData.slice(1).map(row => 
        headers.reduce((obj, header, index) => {
          obj[header] = row[index]?.toString() || '';
          return obj;
        }, {})
      );

      const validData = validateAndCleanData(data);
      if (validData.length === 0) {
        throw new Error('No valid data rows found after filtering');
      }

      return {
        type: 'excel',
        headers,
        data: validData,
        originalHeaders: headers,
        sampleRow: validData[0],
        totalRows: validData.length,
        mapping: preferences.autoMapFields ? autoDetectMapping(headers) : {}
      };
    } catch (error) {
      throw new Error(`Excel processing error: ${error.message}`);
    }
  }, [preferences, validateAndCleanData, autoDetectMapping]);

  // Data Validation and Cleaning
  const validateAndCleanData = useCallback((data) => {
    return data.filter(row => {
      // Check for empty rows
      if (preferences.skipEmptyRows && !Object.values(row).some(val => val?.toString().trim())) {
        return false;
      }

      // Validate email if present and enabled
      if (preferences.validateEmails && row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
          setState(prev => ({
            ...prev,
            debugInfo: `${prev.debugInfo}\nInvalid email found: ${row.email}`
          }));
          row.email = ''; // Clear invalid email
        }
      }

      // Validate phone if present and enabled
      if (preferences.validatePhones && row.phone) {
        const phoneRegex = /^[\d\s+()-]{10,}$/;
        if (!phoneRegex.test(row.phone.trim())) {
          setState(prev => ({
            ...prev,
            debugInfo: `${prev.debugInfo}\nInvalid phone found: ${row.phone}`
          }));
          row.phone = ''; // Clear invalid phone
        }
      }

      // Clean and normalize data
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string') {
          row[key] = row[key].trim();
        }
      });

      return true;
    });
  }, [preferences]);

  // Automatic Field Mapping
  const autoDetectMapping = useCallback((headers) => {
    const mapping = {};
    const commonMappings = {
      'first_name': ['firstname', 'first', 'givenname', 'given_name'],
      'last_name': ['lastname', 'last', 'surname', 'family_name'],
      'email': ['email_address', 'emailaddress', 'mail'],
      'phone': ['telephone', 'phone_number', 'mobile', 'cell'],
      'company': ['organization', 'business', 'employer'],
      'job_title': ['title', 'position', 'role'],
      'address_street': ['street', 'address1', 'address_line_1'],
      'address_city': ['city', 'town'],
      'address_state': ['state', 'province', 'region'],
      'address_zip': ['zip', 'postal_code', 'postcode'],
      'address_country': ['country', 'nation']
    };

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Direct match
      if (commonMappings[normalizedHeader]) {
        mapping[header] = normalizedHeader;
        return;
      }

      // Check common variations
      for (const [field, variations] of Object.entries(commonMappings)) {
        if (variations.some(v => normalizedHeader.includes(v.replace(/[^a-z0-9]/g, '')))) {
          mapping[header] = field;
          return;
        }
      }
    });

    return mapping;
  }, []);

  // File type detection
  const getFileType = useCallback((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const typeMap = {
      'csv': 'csv',
      'xlsx': 'excel',
      'xls': 'excel',
      'vcf': 'vcf',
      'json': 'json'
    };
    return typeMap[extension] || 'unknown';
  }, []);

  // Helper function to read file as ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  // Export functionality
  const handleExport = useCallback(async (format) => {
    try {
      setState(prev => ({
        ...prev,
        exporting: true,
        error: '',
        debugInfo: `Starting export in ${format} format`
      }));

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contacts/export/${format}`,
        { responseType: 'blob' }
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const exportFormats = {
        csv: {
          filename: `contacts_${timestamp}.csv`,
          type: 'text/csv'
        },
        xlsx: {
          filename: `contacts_${timestamp}.xlsx`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        vcf: {
          filename: `contacts_${timestamp}.vcf`,
          type: 'text/vcard'
        },
        json: {
          filename: `contacts_${timestamp}.json`,
          type: 'application/json'
        },
        google: {
          filename: `google_contacts_${timestamp}.csv`,
          type: 'text/csv'
        },
        outlook: {
          filename: `outlook_contacts_${timestamp}.csv`,
          type: 'text/csv'
        }
      };

      const { filename, type } = exportFormats[format];
      const blob = new Blob([response.data], { type });
      saveAs(blob, filename);

      setState(prev => ({
        ...prev,
        exporting: false,
        success: 'Export completed successfully',
        debugInfo: `${prev.debugInfo}\nExport completed: ${filename}`
      }));

      updateHistory('export', { format, filename, count: response.headers['x-total-count'] });
    } catch (error) {
      handleError(error, 'Export');
    }
  }, [updateHistory, handleError]);

  // UI Components
  const ImportSection = () => (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${state.dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}
          ${state.importing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCountRef.current += 1;
          if (!state.importing) setState(prev => ({ ...prev, dragActive: true }));
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
          if (!state.importing && e.dataTransfer.files?.[0]) {
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
          disabled={state.importing}
        />

        <div className="flex flex-col items-center space-y-4">
          <Upload
            className={`h-12 w-12 ${state.importing ? 'text-gray-400' : 'text-indigo-500'}`}
          />
          {state.importing ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader className="animate-spin h-8 w-8 text-indigo-500" />
              <div className="text-sm text-gray-500">
                Processing file... {state.fileProgress}%
              </div>
            </div>
          ) : (
            <>
              <div className="text-lg font-medium text-gray-700">
                Drop your file here or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
                >
                  browse
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Supported formats: {preferences.allowedFormats.join(', ').toUpperCase()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Imports */}
      {preferences.preserveHistory && state.recentImports.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Imports</h4>
          <div className="space-y-2">
            {state.recentImports.map((import_, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <span>{import_.filename}</span>
                <span>{new Date(import_.timestamp).toLocaleDateString()}</span>
                <span>{import_.count} contacts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ExportSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { format: 'csv', icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600' },
          { format: 'xlsx', icon: FileSpreadsheet, label: 'Excel', color: 'text-blue-600' },
          { format: 'vcf', icon: FileText, label: 'vCard', color: 'text-purple-600' },
          { format: 'json', icon: FileJson, label: 'JSON', color: 'text-orange-600' },
          { format: 'google', icon: Mail, label: 'Google', color: 'text-red-600' },
          { format: 'outlook', icon: Mail, label: 'Outlook', color: 'text-blue-500' }
        ].map(({ format, icon: Icon, label, color }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={state.exporting}
            className={`flex items-center justify-center space-x-2 p-4 border rounded-lg
              transition-colors ${state.exporting ? 'opacity-50 cursor-not-allowed' :
                'hover:bg-gray-50'}`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Exports */}
      {preferences.preserveHistory && state.recentExports.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Exports</h4>
          <div className="space-y-2">
            {state.recentExports.map((export_, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <span>{export_.filename}</span>
                <span>{new Date(export_.timestamp).toLocaleDateString()}</span>
                <span>{export_.format.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Settings Panel
  const SettingsPanel = () => (
    <div className="border-t mt-6 pt-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Settings</h3>
      <div className="space-y-4">
        {Object.entries({
          autoMapFields: 'Automatically map fields',
          skipEmptyRows: 'Skip empty rows',
          validateEmails: 'Validate email addresses',
          validatePhones: 'Validate phone numbers',
          showPreviewBeforeImport: 'Show preview before import',
          preserveHistory: 'Keep import/export history',
          debugMode: 'Debug mode'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${preferences[key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform
                  ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      {/* Status Alerts */}
      {state.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
          <button
            onClick={() => setState(prev => ({ ...prev, error: '' }))}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {state.success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{state.success}</AlertDescription>
          <button
            onClick={() => setState(prev => ({ ...prev, success: '' }))}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* Debug Information */}
      {preferences.debugMode && state.debugInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Debug Information</span>
            <button
              onClick={() => setState(prev => ({ ...prev, debugInfo: '' }))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{state.debugInfo}</pre>
        </div>
      )}

      {/* Main Content */}
      {children ? (
        children({
          handleFileUpload: processFile,
          handleExport,
          importing: state.importing,
          exporting: state.exporting,
          error: state.error,
          success: state.success
        })
      ) : (
        <>
          {/* Column Mapping View */}
          {state.showMapping && state.importData && (
            <ColumnMapping
              headers={state.importData.headers}
              sampleData={state.importData.sampleRow}
              predefinedMapping={state.importData.mapping}
              onConfirm={handleMapping}
              onCancel={() => {
                setState(prev => ({
                  ...prev,
                  showMapping: false,
                  importData: null
                }));
              }}
            />
          )}

          {/* Data Preview View */}
          {state.showPreview && state.mappedData && (
            <DataPreview
              data={state.mappedData}
              onConfirm={handleImport}
              onCancel={() => {
                setState(prev => ({
                  ...prev,
                  showPreview: false,
                  showMapping: true
                }));
              }}
              isImporting={state.importing}
            />
          )}

          {/* Default Import/Export View */}
          {!state.showMapping && !state.showPreview && (
            <div className="space-y-8">
              {/* Import Section */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Upload className="h-5 w-5 text-indigo-600 mr-2" />
                  Import Contacts
                </h3>
                <div className="space-y-4">
                  {/* File Drop Zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                      ${state.dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}
                      ${state.importing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !state.importing && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={preferences.allowedFormats.map(fmt => `.${fmt}`).join(',')}
                      onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                      disabled={state.importing}
                    />

                    <div className="flex flex-col items-center space-y-4">
                      {state.importing ? (
                        <>
                          <Loader className="h-12 w-12 animate-spin text-indigo-600" />
                          <p className="text-sm text-gray-500">Processing file...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-indigo-600" />
                          <div>
                            <span className="text-indigo-600 font-medium">Click to upload</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Supported formats: {preferences.allowedFormats.join(', ').toUpperCase()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Recent Imports */}
                  {preferences.preserveHistory && state.recentImports.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Imports</h4>
                      <div className="space-y-2">
                        {state.recentImports.map((import_, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-500 flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span>{import_.filename}</span>
                            <span>{new Date(import_.timestamp).toLocaleDateString()}</span>
                            <span>{import_.count} contacts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Export Section */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Download className="h-5 w-5 text-indigo-600 mr-2" />
                  Export Contacts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { format: 'csv', icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600' },
                    { format: 'xlsx', icon: FileSpreadsheet, label: 'Excel', color: 'text-blue-600' },
                    { format: 'vcf', icon: FileText, label: 'vCard', color: 'text-purple-600' },
                    { format: 'json', icon: FileJson, label: 'JSON', color: 'text-orange-600' },
                    { format: 'google', icon: Mail, label: 'Google', color: 'text-red-600' },
                    { format: 'outlook', icon: Mail, label: 'Outlook', color: 'text-blue-500' }
                  ].map(({ format, icon: Icon, label, color }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      disabled={state.exporting}
                      className={`flex items-center justify-center space-x-2 p-4 border rounded-lg
                        transition-colors ${state.exporting ? 'opacity-50 cursor-not-allowed' :
                          'hover:bg-gray-50'}`}
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Recent Exports */}
                {preferences.preserveHistory && state.recentExports.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Exports</h4>
                    <div className="space-y-2">
                      {state.recentExports.map((export_, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-500 flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span>{export_.filename}</span>
                          <span>{new Date(export_.timestamp).toLocaleDateString()}</span>
                          <span>{export_.format.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Settings Panel */}
              {state.showAdvancedSettings && (
                <div className="border-t mt-6 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Settings</h3>
                  <div className="space-y-4">
                    {[
                      ['autoMapFields', 'Automatically map fields'],
                      ['skipEmptyRows', 'Skip empty rows'],
                      ['validateEmails', 'Validate email addresses'],
                      ['validatePhones', 'Validate phone numbers'],
                      ['showPreviewBeforeImport', 'Show preview before import'],
                      ['preserveHistory', 'Keep import/export history'],
                      ['debugMode', 'Debug mode']
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            ${preferences[key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform
                              ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContactImportExport;