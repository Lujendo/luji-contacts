import React from 'react';
import Modal from '../ui/Modal';
import DuplicateDetectionPanel from '../DuplicateDetectionPanel';
import { Contact } from '../../types';

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onMergeContacts: (contacts: Contact[]) => void;
}

const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onMergeContacts
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Detection"
      size="2xl"
    >
      <DuplicateDetectionPanel
        contacts={contacts}
        onMergeContacts={onMergeContacts}
        onClose={onClose}
      />
    </Modal>
  );
};

export default DuplicateDetectionModal;
