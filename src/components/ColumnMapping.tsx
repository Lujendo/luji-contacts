import React, { useState, useCallback } from 'react';
import { FileText, HelpCircle, AlertCircle, Check, X } from 'lucide-react';

// Alert component props interface
interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  onClose?: () => void;
}

// Custom Alert Component
const Alert: React.FC<AlertProps> = ({ children, variant = 'default', onClose }) => {
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

// System field interface
interface SystemField {
  key: string;
  label: string;
  required?: boolean;
}

// Component props interface
interface ColumnMappingProps {
  headers?: string[];
  fileColumns?: string[];
  expectedColumns?: Record<string, { label: string; required?: boolean }>;
  sampleData?: any[];
  onConfirm?: (mapping: Record<string, string>) => void;
  onMappingComplete?: (mapping: Record<string, string>) => void;
  onCancel?: () => void;
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({ 
  headers = [],
  fileColumns = [],
  expectedColumns,
  sampleData = [],
  onConfirm,
  onMappingComplete,
  onCancel 
}) => {
  // Use provided headers or fileColumns
  const csvHeaders = headers.length > 0 ? headers : fileColumns;

  // System fields definition with validation rules
  const systemFields: SystemField[] = expectedColumns 
    ? Object.entries(expectedColumns).map(([key, config]) => ({
        key,
        label: config.label,
        required: config.required
      }))
    : [
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

  // State for column mappings
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initialMappings: Record<string, string> = {};
    
    // Auto-map columns with similar names
    csvHeaders.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchingField = systemFields.find(field => {
        const normalizedField = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedField === normalizedHeader || 
               normalizedField.includes(normalizedHeader) ||
               normalizedHeader.includes(normalizedField);
      });
      
      if (matchingField) {
        initialMappings[header] = matchingField.key;
      }
    });
    
    return initialMappings;
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Handle mapping change
  const handleMappingChange = useCallback((csvHeader: string, systemField: string) => {
    setMappings(prev => ({
      ...prev,
      [csvHeader]: systemField
    }));
    setErrors([]);
  }, []);

  // Validate mappings
  const validateMappings = useCallback((): boolean => {
    const newErrors: string[] = [];
    const usedFields = new Set<string>();
    
    // Check for duplicate mappings
    Object.entries(mappings).forEach(([csvHeader, systemField]) => {
      if (systemField && usedFields.has(systemField)) {
        newErrors.push(`Field "${systemField}" is mapped to multiple columns`);
      }
      if (systemField) {
        usedFields.add(systemField);
      }
    });

    // Check for required fields
    const requiredFields = systemFields.filter(field => field.required);
    requiredFields.forEach(field => {
      if (!usedFields.has(field.key)) {
        newErrors.push(`Required field "${field.label}" is not mapped`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [mappings, systemFields]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (validateMappings()) {
      const callback = onMappingComplete || onConfirm;
      if (callback) {
        callback(mappings);
      }
    }
  }, [mappings, validateMappings, onMappingComplete, onConfirm]);

  // Get sample value for a CSV header
  const getSampleValue = (header: string): string => {
    if (sampleData.length > 0 && sampleData[0][header]) {
      return String(sampleData[0][header]).substring(0, 50);
    }
    return 'No sample data';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">Map Your Columns</h3>
        <HelpCircle className="h-5 w-5 text-gray-400" />
      </div>

      {/* Instructions */}
      <Alert variant="default">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Column Mapping Instructions</p>
            <p className="mt-1 text-sm">
              Map each column from your file to the corresponding contact field. 
              Required fields must be mapped to proceed.
            </p>
          </div>
        </div>
      </Alert>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Mapping Errors</p>
              <ul className="mt-1 text-sm list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Alert>
      )}

      {/* Mapping Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-900">Your Column</div>
            <div className="font-medium text-gray-900">Sample Data</div>
            <div className="font-medium text-gray-900">Maps To</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {csvHeaders.map((header, index) => (
            <div key={header} className="px-4 py-3">
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* CSV Column */}
                <div className="font-medium text-gray-900">
                  {header}
                </div>
                
                {/* Sample Data */}
                <div className="text-sm text-gray-600 truncate">
                  {getSampleValue(header)}
                </div>
                
                {/* System Field Mapping */}
                <div>
                  <select
                    value={mappings[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Skip this column --</option>
                    {systemFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Mapping Summary</h4>
        <div className="text-sm text-gray-600">
          <p>• {csvHeaders.length} columns in your file</p>
          <p>• {Object.values(mappings).filter(Boolean).length} columns mapped</p>
          <p>• {systemFields.filter(f => f.required).length} required fields</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        
        <button
          onClick={handleConfirm}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            Continue with Mapping
          </div>
        </button>
      </div>
    </div>
  );
};

export default ColumnMapping;
