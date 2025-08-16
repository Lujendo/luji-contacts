import React from 'react';
import Modal from '../ui/Modal';
import EmailHistory from '../EmailHistory';

interface EmailHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailHistoryModal: React.FC<EmailHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email History"
      size="xl"
    >
      <EmailHistory onClose={onClose} />
    </Modal>
  );
};

export default EmailHistoryModal;
