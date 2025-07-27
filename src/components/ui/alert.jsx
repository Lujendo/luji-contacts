import React from 'react';
import { X } from 'lucide-react';

const Alert = ({ variant = 'info', className = '', children, onClose }) => {
  const alertStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  return (
    <div className={`alert flex items-center border p-4 rounded-md ${alertStyles[variant]} ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button className="ml-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const AlertDescription = ({ children }) => (
  <div className="alert-description">{children}</div>
);

export { Alert, AlertDescription };
