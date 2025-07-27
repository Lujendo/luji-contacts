import React, { useState, useCallback } from 'react';
import { FileText, HelpCircle, AlertCircle, Check, X } from 'lucide-react';

// Custom Alert Component
const Alert = ({ children, variant = 'default', onClose }) => {
  const variants = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]} mb-4`}>
      <div className="flex items-start">
        <div className="flex-1">{children}</div>
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

const ColumnMapping = ({ headers, sampleData, onConfirm, onCancel }) => {
  // System fields definition with validation rules
  const systemFields = [
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'address_street', label: 'Street Address' },
    { key: 'address_city', label: 'City' },
    { key: 'address_state', label: 'State/Province' },
    { key: 'address_zip', label: 'Postal Code' },
    { key: 'address_country', label: 'Country' },
    { key: 'website', label: 'Website' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'notes', label: 'Notes' }
  ];

  // State for column mapping
  const [mapping, setMapping] = useState(
    headers.reduce((acc, header) => {
      // Try to auto-map fields
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = systemFields.find(field => {
        const normalizedField = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedHeader === normalizedField || 
               normalizedHeader === field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      });
      acc[header] = match ? match.key : '';
      return acc;
    }, {})
  );

  // Validate mapping
  const validateMapping = useCallback(() => {
    const errors = [];
    const mappedFields = new Set(Object.values(mapping).filter(Boolean));
    
    // Check required fields
    systemFields
      .filter(field => field.required)
      .forEach(field => {
        if (!mappedFields.has(field.key)) {
          errors.push(`${field.label} is required but not mapped`);
        }
      });

    // Check duplicate mappings
    const duplicates = Object.entries(mapping).reduce((acc, [header, value]) => {
      if (value) {
        acc[value] = (acc[value] || []).concat(header);
      }
      return acc;
    }, {});

    Object.entries(duplicates)
      .filter(([_, headers]) => headers.length > 1)
      .forEach(([field, headers]) => {
        errors.push(`Multiple columns mapped to ${field}: ${headers.join(', ')}`);
      });

    return errors;
  }, [mapping]);

  const errors = validateMapping();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FileText className="mr-2 text-indigo-600" size={20} />
          Map Your Columns
        </h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Sample Data Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <HelpCircle size={16} className="mr-1 text-gray-400" />
          Sample Row Preview
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {headers.map(header => (
            <div key={header} className="text-xs">
              <span className="font-medium text-gray-600">{header}:</span>
              <span className="ml-1 text-gray-500">{sampleData[header]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Please fix the following issues:</div>
              <ul className="list-disc pl-4 mt-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Alert>
      )}

      {/* Mapping Fields */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Map Your Fields</h4>
        <div className="grid grid-cols-1 gap-4">
          {headers.map(header => (
            <div key={header} className="flex items-center space-x-4">
              <div className="w-1/3">
                <span className="text-sm font-medium text-gray-600">{header}</span>
              </div>
              <div className="w-2/3">
                <select
                  value={mapping[header]}
                  onChange={(e) => setMapping(prev => ({
                    ...prev,
                    [header]: e.target.value
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm
                           focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">-- Skip this column --</option>
                  {systemFields.map(field => (
                    <option
                      key={field.key}
                      value={field.key}
                      disabled={Object.values(mapping).includes(field.key) && mapping[header] !== field.key}
                    >
                      {field.label} {field.required ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white 
                   border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(mapping)}
          disabled={errors.length > 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600
                   rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2
                   focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400
                   disabled:cursor-not-allowed flex items-center"
        >
          {errors.length > 0 ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Fix Issues to Continue
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirm Mapping
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ColumnMapping;