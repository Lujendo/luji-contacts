import React from 'react';
import Modal from '../ui/Modal';
import BulkGroupAssign from '../BulkGroupAssign';
import { Group } from '../../types';

interface BulkGroupAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactIds: number[];
  groups: Group[];
  onAssignmentComplete: () => void;
}

const BulkGroupAssignModal: React.FC<BulkGroupAssignModalProps> = ({
  isOpen,
  onClose,
  contactIds,
  groups,
  onAssignmentComplete
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Contacts to Groups"
      size="lg"
    >
      <BulkGroupAssign
        contactIds={contactIds}
        groups={groups}
        onClose={onClose}
        onAssignmentComplete={onAssignmentComplete}
      />
    </Modal>
  );
};

export default BulkGroupAssignModal;
