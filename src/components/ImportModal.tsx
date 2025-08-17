import React from 'react';
import Modal from './ui/Modal';
import DashboardImportExport from './DashboardImportExport';
import { Contact } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactsImported?: (contacts: Contact[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onContactsImported
}) => {
  const handleContactsImported = (contacts: Contact[]) => {
    if (onContactsImported) {
      onContactsImported(contacts);
    }
    // Close modal after successful import
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import & Export Contacts"
      size="2xl"
      showCloseButton={true}
      closeOnOverlayClick={false} // Prevent accidental closes during import
    >
      <DashboardImportExport
        onClose={onClose}
        onContactsImported={handleContactsImported}
      />
    </Modal>
  );
};

export default ImportModal;
