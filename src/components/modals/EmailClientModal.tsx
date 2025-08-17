import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import ClassicEmailClient from '../ClassicEmailClient';

interface EmailClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedContacts?: Array<{ id: number; email: string; name?: string }>;
  composeMode?: boolean;
}

const EmailClientModal: React.FC<EmailClientModalProps> = ({
  isOpen,
  onClose,
  preSelectedContacts = [],
  composeMode = false
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Email Client */}
      <div className="h-full">
        <ClassicEmailClient
          onClose={onClose}
          preSelectedContacts={preSelectedContacts}
          composeMode={composeMode}
        />
      </div>
    </div>
  );
};

export default EmailClientModal;
