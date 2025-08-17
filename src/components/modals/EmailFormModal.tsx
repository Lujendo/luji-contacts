import React from 'react';
import Modal from '../ui/Modal';
import EmailForm from '../EmailForm';
import { Contact } from '../../types';

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  selectedContact?: Contact | null;
}

const EmailFormModal: React.FC<EmailFormModalProps> = ({
  isOpen,
  onClose,
  contacts,
  selectedContact
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email"
      size="2xl"
    >
      <EmailForm
        contacts={contacts}
        selectedContact={selectedContact}
        onClose={onClose}
      />
    </Modal>
  );
};

export default EmailFormModal;
