import React from 'react';
import { X, AlertCircle } from 'lucide-react';

// Component props interface
interface ErrorDisplayProps {
  error: string | null;
  onClose: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button 
          onClick={onClose} 
          className="text-red-400 hover:text-red-600 transition-colors"
          aria-label="Close error"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
