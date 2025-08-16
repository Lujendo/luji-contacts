import React from 'react';
import Modal from '../ui/Modal';
import GroupContactsManager from '../GroupContactsManager';
import { Group, Contact } from '../../types';

interface GroupContactsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  contacts: Contact[];
}

const GroupContactsManagerModal: React.FC<GroupContactsManagerModalProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  contacts
}) => {
  if (!selectedGroup) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Group: ${selectedGroup.name}`}
      size="2xl"
    >
      <GroupContactsManager
        group={selectedGroup}
        contacts={contacts}
        onClose={onClose}
      />
    </Modal>
  );
};

export default GroupContactsManagerModal;
