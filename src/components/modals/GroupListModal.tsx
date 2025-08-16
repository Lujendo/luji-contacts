import React from 'react';
import Modal from '../ui/Modal';
import GroupList from '../GroupList';
import { Group } from '../../types';

interface GroupListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  onGroupEdit: (group: Group) => void;
}

const GroupListModal: React.FC<GroupListModalProps> = ({
  isOpen,
  onClose,
  groups,
  onGroupSelect,
  onGroupEdit
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Groups"
      size="lg"
    >
      <GroupList
        groups={groups}
        onClose={onClose}
        onGroupSelect={onGroupSelect}
        onGroupEdit={onGroupEdit}
      />
    </Modal>
  );
};

export default GroupListModal;
