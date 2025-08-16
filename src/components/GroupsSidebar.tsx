import React, { useState } from 'react';
import { Group } from '../types';
import { Plus, ChevronLeft, ChevronRight, Users, X, Edit2, Trash2, Mail } from 'lucide-react';

interface GroupsSidebarProps {
  groups: Group[];
  activeGroup: Group | null;
  highlightedGroupId: number | null;
  onGroupClick: (groupId: number) => void;
  onGroupEdit: (group: Group) => void;
  onGroupDelete: (groupId: number) => void;
  onAddNewGroup: () => void;
  onShowAll: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const GroupsSidebar: React.FC<GroupsSidebarProps> = ({
  groups,
  activeGroup,
  highlightedGroupId,
  onGroupClick,
  onGroupEdit,
  onGroupDelete,
  onAddNewGroup,
  onShowAll,
  isCollapsed,
  onToggleCollapse
}) => {
  const [lastClickedGroup, setLastClickedGroup] = useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number | null>(null);
  const clickTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const DOUBLE_CLICK_DELAY = 300;

  const handleGroupClick = (group: Group): void => {
    const now = Date.now();
    const timeDiff = now - (lastClickTime || 0);

    if (lastClickedGroup === group.id && timeDiff < DOUBLE_CLICK_DELAY) {
      // Double click - open group contacts manager (assignment modal)
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      setLastClickedGroup(null);
      setLastClickTime(null);
      onGroupEdit(group); // This opens the group contacts manager
    } else {
      // Single click - filter by group
      setLastClickedGroup(group.id);
      setLastClickTime(now);

      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }

      clickTimeout.current = setTimeout(() => {
        onGroupClick(group.id);
        setLastClickedGroup(null);
        setLastClickTime(null);
        clickTimeout.current = null;
      }, DOUBLE_CLICK_DELAY);
    }
  };

  const handleEmailGroup = (group: Group, e: React.MouseEvent): void => {
    e.stopPropagation();
    
    const emailAddresses = group.contacts?.map(contact => contact.email).filter(Boolean) || [];
    if (emailAddresses.length === 0) {
      alert(`No email addresses found in group "${group.name}".`);
      return;
    }

    const mailtoLink = `mailto:?bcc=${emailAddresses.join(',')}`;
    window.location.href = mailtoLink;
  };

  const handleDeleteClick = (group: Group, e: React.MouseEvent): void => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return;
    }

    onGroupDelete(group.id);
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Groups</h2>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title={isCollapsed ? 'Expand Groups' : 'Collapse Groups'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Add New Group Button */}
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={onAddNewGroup}
              className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </button>
          </div>

          {/* Show All Button */}
          <div className="p-3 border-b border-gray-200">
            <button
              onClick={onShowAll}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                !activeGroup 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              All Contacts
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No groups yet</p>
                <p className="text-gray-400 text-xs mt-1">Create a group to organize contacts</p>
              </div>
            ) : (
              <div className="p-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className={`group relative p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                      activeGroup?.id === group.id
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
                        : highlightedGroupId === group.id
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {group.name}
                          </h3>
                          {activeGroup?.id === group.id && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              FILTERING
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {group.contact_count || 0} contact{(group.contact_count || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEmailGroup(group, e)}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Email group"
                        >
                          <Mail className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onGroupEdit(group); }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit group"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(group, e)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete group"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {activeGroup?.id === group.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Single click to filter • Double click to assign contacts
            </p>
          </div>
        </>
      )}

      {/* Collapsed state - show only icons */}
      {isCollapsed && (
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-2">
            <button
              onClick={onShowAll}
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md transition-colors ${
                !activeGroup 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title="All Contacts"
            >
              <Users className="w-4 h-4" />
            </button>
            {groups.slice(0, 8).map((group) => (
              <button
                key={group.id}
                onClick={() => onGroupClick(group.id)}
                className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                  activeGroup?.id === group.id
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={group.name}
              >
                {group.name.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsSidebar;
