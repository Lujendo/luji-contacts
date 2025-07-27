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

const DataPreview = ({ data, onConfirm, onCancel, isImporting = false }) => {
  const [showAllIssues, setShowAllIssues] = useState(false);

  const displayFields = [
    { 
      key: 'first_name', 
      label: 'First Name', 
      validate: value => value?.length > 0,
      required: true
    },
    { 
      key: 'last_name', 
      label: 'Last Name', 
      validate: value => value?.length > 0,
      required: true
    },
    { 
      key: 'email', 
      label: 'Email', 
      validate: value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    { 
      key: 'phone', 
      label: 'Phone', 
      validate: value => !value || /^[\d\s+()-]+$/.test(value)
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

  const validateData = (contacts) => {
    return contacts.reduce((issues, contact, index) => {
      // Email validation
      if (contact.email) {
        // Duplicate email check
        if (contacts.findIndex(c => c.email === contact.email) !== index) {
          issues.push({
            row: index + 1,
            type: 'error',
            field: 'email',
            message: `Duplicate email: ${contact.email}`
          });
        }
        // Invalid email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          issues.push({
            row: index + 1,
            type: 'error',
            field: 'email',
            message: `Invalid email format: ${contact.email}`
          });
        }
      }

      // Required fields validation
      displayFields
        .filter(field => field.required)
        .forEach(field => {
          if (!contact[field.key]) {
            issues.push({
              row: index + 1,
              type: 'error',
              field: field.key,
              message: `${field.label} is required`
            });
          }
        });

      // Phone number validation
      if (contact.phone && !/^[\d\s+()-]+$/.test(contact.phone)) {
        issues.push({
          row: index + 1,
          type: 'warning',
          field: 'phone',
          message: `Phone number contains invalid characters: ${contact.phone}`
        });
      }

      // Website validation
      if (contact.website) {
        try {
          new URL(contact.website);
        } catch {
          issues.push({
            row: index + 1,
            type: 'warning',
            field: 'website',
            message: `Invalid website URL: ${contact.website}`
          });
        }
      }

      // Social media URLs validation
      ['linkedin', 'twitter', 'facebook', 'instagram'].forEach(social => {
        if (contact[social]) {
          try {
            const url = new URL(contact[social]);
            if (!url.hostname.includes(social)) {
              issues.push({
                row: index + 1,
                type: 'warning',
                field: social,
                message: `Invalid ${social} URL: ${contact[social]}`
              });
            }
          } catch {
            issues.push({
              row: index + 1,
              type: 'warning',
              field: social,
              message: `Invalid ${social} URL format: ${contact[social]}`
            });
          }
        }
      });

      return issues;
    }, []);
  };

  const { issues, errors, warnings } = useMemo(() => {
    const allIssues = validateData(data);
    return {
      issues: allIssues,
      errors: allIssues.filter(i => i.type === 'error'),
      warnings: allIssues.filter(i => i.type === 'warning')
    };
  }, [data]);

  const canImport = errors.length === 0;

  const renderIssuesList = (issues, type) => {
    const displayIssues = showAllIssues ? issues : issues.slice(0, 3);
    const Icon = type === 'error' ? XCircle : AlertTriangle;
    const colors = type === 'error' 
      ? { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800', textLight: 'text-red-700' }
      : { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800', textLight: 'text-yellow-700' };

    return (
      <div className={`${colors.bg} border-l-4 ${colors.border} p-4`}>
        <div className="flex">
          <Icon className={`h-5 w-5 ${type === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${colors.text}`}>
              {issues.length} {type.charAt(0).toUpperCase() + type.slice(1)}
              {issues.length !== 1 ? 's' : ''} Found
            </h3>
            <div className={`mt-2 text-sm ${colors.textLight}`}>
              <ul className="list-disc pl-5 space-y-1">
                {displayIssues.map((issue, index) => (
                  <li key={index}>Row {issue.row}: {issue.message}</li>
                ))}
              </ul>
              {issues.length > 3 && (
                <button
                  onClick={() => setShowAllIssues(!showAllIssues)}
                  className={`flex items-center mt-2 text-sm ${colors.text} hover:underline`}
                >
                  {showAllIssues ? (
                    <>
                      <ChevronUp size={14} className="mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mr-1" />
                      Show {issues.length - 3} more issues
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Table size={20} className="mr-2 text-indigo-600" />
          Preview Import Data
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {data.length} contacts to import
          </div>
          <div className="flex items-center space-x-2">
            {errors.length > 0 && (
              <span className="flex items-center text-red-600 text-sm">
                <XCircle size={16} className="mr-1" />
                {errors.length} errors
              </span>
            )}
            {warnings.length > 0 && (
              <span className="flex items-center text-yellow-600 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {warnings.length} warnings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          {errors.length > 0 && renderIssuesList(errors, 'error')}
          {warnings.length > 0 && renderIssuesList(warnings, 'warning')}
        </div>
      )}

      {/* Data Preview Table */}
      <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {displayFields.map(field => (
                  <th
                    key={field.key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 5).map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {displayFields.map(field => (
                    <td
                      key={field.key}
                      className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                    >
                      {row[field.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing first 5 of {data.length} contacts
        </div>
        <div className="flex items-center">
          {canImport ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-400 mr-1" />
              Ready to import
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-400 mr-1" />
              Please fix errors before importing
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isImporting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                   rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Back to Mapping
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canImport || isImporting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                   rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50
                   disabled:hover:bg-indigo-600 flex items-center"
        >
          {isImporting ? (
            <>
              <Loader size={16} className="animate-spin mr-2" />
              Importing...
            </>
          ) : (
            `Import ${data.length} Contacts`
          )}
        </button>
      </div>
    </div>
  );
};

export default DataPreview;