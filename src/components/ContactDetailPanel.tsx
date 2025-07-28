import React from 'react';
import { Contact, Group } from '../types';
import ContactDetail from './ContactDetail';

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
          className={`
            fixed inset-0 bg-black transition-opacity duration-500 ease-in-out z-40
            ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}
          `}
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`
          fixed inset-y-0 right-0 w-[90vw] max-w-[1400px] bg-white shadow-2xl transform transition-all duration-500 z-50
          ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        `}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Panel content */}
        <div className="h-full overflow-hidden">
          <ContactDetail
            contact={contact}
            allGroups={groups}
            onContactUpdate={onContactUpdate}
            onContactDelete={onContactDelete}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
};

export default ContactDetailPanel;
