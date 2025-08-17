import React from 'react';
import Modal from '../ui/Modal';
import EmailClient from '../EmailClient';

interface EmailClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailClientModal: React.FC<EmailClientModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Professional Email Client"
      size="2xl"
      showCloseButton={true}
    >
      <EmailClient onClose={onClose} />
    </Modal>
  );
};

export default EmailClientModal;
