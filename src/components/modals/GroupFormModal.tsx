import React from 'react';
import Modal from '../ui/Modal';
import GroupForm from '../GroupForm';
import { Group } from '../../types';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      size="md"
    >
      <GroupForm
        onClose={onClose}
        onGroupCreated={onGroupCreated}
      />
    </Modal>
  );
};

export default GroupFormModal;
