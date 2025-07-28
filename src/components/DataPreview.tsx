import React, { useMemo, useState } from 'react';
import { 
  Table, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';
import { CreateContactRequest } from '../types';

// Display field interface
interface DisplayField {
  key: keyof CreateContactRequest;
  label: string;
  validate?: (value: string | undefined) => boolean;
  required?: boolean;
}

// Validation issue interface
interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Validation result interface
interface ValidationResult {
  valid: number;
  invalid: number;
  issues: ValidationIssue[];
}

// Component props interface
interface DataPreviewProps {
  data: CreateContactRequest[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  onConfirm, 
  onCancel, 
  isImporting = false 
}) => {
  const [showAllIssues, setShowAllIssues] = useState<boolean>(false);

  const displayFields: DisplayField[] = [
    { 
      key: 'first_name', 
      label: 'First Name', 
      validate: (value) => Boolean(value?.length),
      required: true
    },
    { 
      key: 'last_name', 
      label: 'Last Name', 
      validate: (value) => Boolean(value?.length),
      required: true
    },
    { 
      key: 'email', 
      label: 'Email', 
      validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    { 
      key: 'phone', 
      label: 'Phone', 
      validate: (value) => !value || /^[\d\s+()-]+$/.test(value)
    },
    { key: 'company', label: 'Company' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'address_street', label: 'Street Address' },
    { key: 'address_city', label: 'City' },
    { key: 'address_state', label: 'State' },
    { key: 'address_zip', label: 'ZIP' },
    { key: 'address_country', label: 'Country' },
    { key: 'website', label: 'Website' },
    { key: 'notes', label: 'Notes' }
  ];

  const validateData = (contacts: CreateContactRequest[]): ValidationResult => {
    const issues: ValidationIssue[] = [];
    let valid = 0;
    let invalid = 0;

    contacts.forEach((contact, index) => {
      let hasErrors = false;

      displayFields.forEach(field => {
        const value = contact[field.key];
        
        if (field.required && (!value || !value.toString().trim())) {
          issues.push({
            row: index + 1,
            field: field.label,
            message: `${field.label} is required`,
            severity: 'error'
          });
          hasErrors = true;
        } else if (field.validate && value && !field.validate(value.toString())) {
          issues.push({
            row: index + 1,
            field: field.label,
            message: `Invalid ${field.label.toLowerCase()} format`,
            severity: 'error'
          });
          hasErrors = true;
        }
      });

      // Check if contact has at least one identifier
      if (!contact.first_name && !contact.last_name && !contact.email) {
        issues.push({
          row: index + 1,
          field: 'General',
          message: 'Contact must have at least first name, last name, or email',
          severity: 'error'
        });
        hasErrors = true;
      }

      if (hasErrors) {
        invalid++;
      } else {
        valid++;
      }
    });

    return { valid, invalid, issues };
  };

  const validation = useMemo(() => validateData(data), [data]);

  const getRowStatus = (contact: CreateContactRequest, index: number): 'valid' | 'invalid' => {
    const rowIssues = validation.issues.filter(issue => issue.row === index + 1);
    return rowIssues.length > 0 ? 'invalid' : 'valid';
  };

  const getCellStatus = (contact: CreateContactRequest, field: DisplayField, index: number): 'valid' | 'invalid' | 'warning' => {
    const cellIssues = validation.issues.filter(
      issue => issue.row === index + 1 && issue.field === field.label
    );
    
    if (cellIssues.some(issue => issue.severity === 'error')) {
      return 'invalid';
    }
    if (cellIssues.some(issue => issue.severity === 'warning')) {
      return 'warning';
    }
    return 'valid';
  };

  const displayedIssues = showAllIssues ? validation.issues : validation.issues.slice(0, 5);

  if (isImporting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Contacts</h3>
        <p className="text-sm text-gray-600">Please wait while we process your data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Table className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
      </div>

      {/* Validation Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Validation Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{validation.valid}</div>
            <div className="text-sm text-gray-600">Valid Records</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{validation.invalid}</div>
            <div className="text-sm text-gray-600">Invalid Records</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{validation.issues.length}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {validation.issues.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Validation Issues</h4>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {displayedIssues.map((issue, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  {issue.severity === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-gray-600">
                    <strong>Row {issue.row}:</strong> {issue.message}
                  </span>
                </div>
              ))}
            </div>
            
            {validation.issues.length > 5 && (
              <button
                onClick={() => setShowAllIssues(!showAllIssues)}
                className="mt-3 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showAllIssues ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All {validation.issues.length} Issues
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">
            Contact Data Preview ({data.length} records)
          </h4>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {displayFields.slice(0, 6).map(field => (
                  <th key={field.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((contact, index) => {
                const rowStatus = getRowStatus(contact, index);
                return (
                  <tr key={index} className={rowStatus === 'invalid' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {rowStatus === 'valid' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </td>
                    {displayFields.slice(0, 6).map(field => {
                      const cellStatus = getCellStatus(contact, field, index);
                      const value = contact[field.key];
                      return (
                        <td 
                          key={field.key} 
                          className={`px-4 py-2 whitespace-nowrap text-sm ${
                            cellStatus === 'invalid' ? 'text-red-600 bg-red-50' :
                            cellStatus === 'warning' ? 'text-yellow-600 bg-yellow-50' :
                            'text-gray-900'
                          }`}
                        >
                          {value || <span className="text-gray-400">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing first 10 of {data.length} records
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Mapping
        </button>
        
        <button
          onClick={onConfirm}
          disabled={validation.valid === 0}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import {validation.valid} Valid Contact{validation.valid !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};

export default DataPreview;
