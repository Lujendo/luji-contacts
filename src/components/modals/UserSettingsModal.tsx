import React from 'react';
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
  // Only render UserSettings if modal should be open
  if (!isOpen) return null;

  return (
    <UserSettings onClose={onClose} initialTab={initialTab} />
  );
};

export default UserSettingsModal;
