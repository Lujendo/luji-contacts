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
