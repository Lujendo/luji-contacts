import React from 'react';
import SidePanel from '../ui/SidePanel';
import GroupList from '../GroupList';
import { Group } from '../../types';

interface GroupSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  onGroupEdit: (group: Group) => void;
}

const GroupSidePanel: React.FC<GroupSidePanelProps> = ({
  isOpen,
  onClose,
  groups,
  onGroupSelect,
  onGroupEdit
}) => {
  return (
    <SidePanel
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
    </SidePanel>
  );
};

export default GroupSidePanel;
