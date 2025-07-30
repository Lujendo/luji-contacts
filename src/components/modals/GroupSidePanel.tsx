import React from 'react';
import SidePanel from '../ui/SidePanel';
import GroupList from '../GroupList';
import { Group } from '../../types';
import { Plus } from 'lucide-react';

interface GroupSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  onGroupEdit: (group: Group) => void;
  onAddNewGroup: () => void;
  onHighlightGroupContacts: (groupId: number) => void;
  onShowAll: () => void;
  activeGroup: Group | null;
  highlightedGroupId: number | null;
}

const GroupSidePanel: React.FC<GroupSidePanelProps> = ({
  isOpen,
  onClose,
  groups,
  onGroupSelect,
  onGroupEdit,
  onAddNewGroup,
  onHighlightGroupContacts,
  onShowAll,
  activeGroup,
  highlightedGroupId
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Groups"
      size="lg"
    >
      <div className="flex flex-col h-full">
        {/* Add New Group Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onAddNewGroup}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Group
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-hidden">
          <GroupList
            groups={groups}
            onClose={onClose}
            onGroupSelect={onGroupSelect}
            onGroupEdit={onGroupEdit}
            onHighlightGroupContacts={onHighlightGroupContacts}
            onShowAll={onShowAll}
            activeGroup={activeGroup}
            highlightedGroupId={highlightedGroupId}
          />
        </div>
      </div>
    </SidePanel>
  );
};

export default GroupSidePanel;
