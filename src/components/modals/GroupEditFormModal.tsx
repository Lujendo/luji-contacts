import React from 'react';
import Modal from '../ui/Modal';
import GroupEditForm from '../GroupEditForm';
import { Group } from '../../types';

interface GroupEditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onGroupUpdated: (group: Group) => void;
}

const GroupEditFormModal: React.FC<GroupEditFormModalProps> = ({
  isOpen,
  onClose,
  group,
  onGroupUpdated
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group"
      size="lg"
    >
      <GroupEditForm
        group={group}
        onClose={onClose}
        onGroupUpdated={onGroupUpdated}
      />
    </Modal>
  );
};

export default GroupEditFormModal;
