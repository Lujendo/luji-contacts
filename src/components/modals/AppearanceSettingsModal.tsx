import React from 'react';
import Modal from '../ui/Modal';
import AppearanceSettingsComponent, { AppearanceSettings } from '../AppearanceSettings';

interface AppearanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppearanceSettings) => void;
}

const AppearanceSettingsModal: React.FC<AppearanceSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appearance Settings"
      size="xl"
    >
      <AppearanceSettingsComponent
        onClose={onClose}
        onSettingsChange={onSettingsChange}
      />
    </Modal>
  );
};

export default AppearanceSettingsModal;
