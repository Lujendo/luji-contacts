import React from 'react';
import Modal from '../ui/Modal';
import GroupContactsManager from '../GroupContactsManager';
import { Group } from '../../types';

interface GroupContactsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
}

const GroupContactsManagerModal: React.FC<GroupContactsManagerModalProps> = ({
  isOpen,
  onClose,
  groups
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Group Contacts Manager"
      size="2xl"
    >
      <GroupContactsManager
        groups={groups}
        onClose={onClose}
      />
    </Modal>
  );
};

export default GroupContactsManagerModal;
