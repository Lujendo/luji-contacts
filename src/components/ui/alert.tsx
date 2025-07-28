import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

// Alert variant type
type AlertVariant = 'info' | 'success' | 'destructive' | 'warning';

// Alert component props interface
interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
  onClose?: () => void;
}

// AlertDescription component props interface
interface AlertDescriptionProps {
  children: ReactNode;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  className = '', 
  children, 
  onClose 
}) => {
  const alertStyles: Record<AlertVariant, string> = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  return (
    <div className={`alert flex items-center border p-4 rounded-md ${alertStyles[variant]} ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button 
          className="ml-4 hover:opacity-70 transition-opacity" 
          onClick={onClose}
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => (
  <div className="alert-description text-sm">{children}</div>
);

export { Alert, AlertDescription };
