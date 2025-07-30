import React from 'react';
import Modal from '../ui/Modal';
import UserSettings from '../UserSettings';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Settings"
      size="xl"
    >
      <UserSettings onClose={onClose} />
    </Modal>
  );
};

export default UserSettingsModal;
