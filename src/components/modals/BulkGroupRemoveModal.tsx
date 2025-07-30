import React from 'react';
import Modal from '../ui/Modal';
import BulkGroupRemove from '../BulkGroupRemove';
import { Group } from '../../types';

interface BulkGroupRemoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactIds: number[];
  groups: Group[];
  onRemovalComplete: () => void;
}

const BulkGroupRemoveModal: React.FC<BulkGroupRemoveModalProps> = ({
  isOpen,
  onClose,
  contactIds,
  groups,
  onRemovalComplete
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Contacts from Groups"
      size="lg"
    >
      <BulkGroupRemove
        contactIds={contactIds}
        groups={groups}
        onClose={onClose}
        onRemovalComplete={onRemovalComplete}
      />
    </Modal>
  );
};

export default BulkGroupRemoveModal;
