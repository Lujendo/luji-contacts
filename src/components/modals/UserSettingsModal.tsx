import React from 'react';
import Modal from '../ui/Modal';
import UserSettings from '../UserSettings';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'email' | 'subscription' | 'security' | 'appearance';
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Settings"
      size="xl"
    >
      <UserSettings onClose={onClose} initialTab={initialTab} />
    </Modal>
  );
};

export default UserSettingsModal;
