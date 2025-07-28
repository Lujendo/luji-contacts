import React from 'react';
import { Contact, Group } from '../types';
import ContactDetail from './ContactDetail';
import { X } from 'lucide-react';

// Component props interface
interface ContactDetailPanelProps {
  isOpen?: boolean;
  onClose: () => void;
  contact: Contact | null;
  groups?: Group[];
  onContactUpdate?: (contact: Contact) => void;
  onContactDelete?: (contactId: number) => void;
}

const ContactDetailPanel: React.FC<ContactDetailPanelProps> = ({
  isOpen = true,
  onClose,
  contact,
  groups = [],
  onContactUpdate,
  onContactDelete
}) => {
  if (!contact) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div 
        className={`
          fixed inset-y-0 right-0 w-[1200px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Panel header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Contact Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close contact details"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Panel content - Use the ContactDetail component */}
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
          <ContactDetail
            contact={contact}
            allGroups={groups}
            onClose={onClose}
            onContactUpdate={onContactUpdate}
            onContactDelete={onContactDelete}
          />
        </div>
      </div>
    </>
  );
};

export default ContactDetailPanel;
