import React, { useState, useRef } from 'react';
import { Group, Contact } from '../types';
import { Edit2, Trash2, Mail, List, X } from 'lucide-react';

// Component props interface
interface GroupListProps {
  groups?: Group[];
  onSelectGroup?: (group: Group) => void;
  selectedGroups?: number[];
  onToggleGroup?: (groupId: number) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (groupId: number) => void;
  onHighlightGroupContacts?: (groupId: number) => void;
  onShowAll?: () => void;
  isLoading?: boolean;
  activeGroup?: Group | null;
  highlightedGroupId?: number | null;
  onClose?: () => void;
  onGroupSelect?: (group: Group) => void;
  onGroupEdit?: (group: Group) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups = [],
  onSelectGroup,
  selectedGroups = [],
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  onHighlightGroupContacts,
  onShowAll,
  isLoading = false,
  activeGroup,
  highlightedGroupId,
  onClose,
  onGroupSelect,
  onGroupEdit
}) => {
  const [lastClickedGroup, setLastClickedGroup] = useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number | null>(null);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const DOUBLE_CLICK_DELAY = 300;

  const handleEmailGroup = (group: Group, e: React.MouseEvent): void => {
    e.stopPropagation();
    
    // Get email addresses from group contacts
    const emailAddresses = group.contacts?.map(contact => contact.email).filter(Boolean) || [];

    if (emailAddresses.length === 0) {
      alert(`No email addresses found in group "${group.name}". Please add contacts with email addresses to this group.`);
      return;
    }

    const mailtoLink = `mailto:?bcc=${emailAddresses.join(',')}`;
    window.location.href = mailtoLink;
  };

  const handleGroupClick = (group: Group): void => {
    const now = Date.now();
    const timeDiff = now - (lastClickTime || 0);
    console.log('Click detected:', { groupId: group.id, timeDiff, lastClickedGroup });

    if (lastClickedGroup === group.id && timeDiff < DOUBLE_CLICK_DELAY) {
      console.log('Double click detected - Opening GroupContactManager');
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }

      setLastClickedGroup(null);
      setLastClickTime(null);

      // Handle double click - open group details
      const callback = onGroupSelect || onSelectGroup;
      if (callback) {
        callback(group);
      }
    } else {
      // Single click - set up for potential double click
      setLastClickedGroup(group.id);
      setLastClickTime(now);

      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }

      clickTimeout.current = setTimeout(() => {
        console.log('Single click confirmed - Highlighting group contacts');
        if (onHighlightGroupContacts) {
          onHighlightGroupContacts(group.id);
        }
        setLastClickedGroup(null);
        setLastClickTime(null);
        clickTimeout.current = null;
      }, DOUBLE_CLICK_DELAY);
    }
  };

  const handleEditClick = (group: Group, e: React.MouseEvent): void => {
    e.stopPropagation();
    const callback = onGroupEdit || onEditGroup;
    if (callback) {
      callback(group);
    }
  };

  const handleDeleteClick = (group: Group, e: React.MouseEvent): void => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"? This will not delete the contacts, only the group.`)) {
      return;
    }

    if (onDeleteGroup) {
      onDeleteGroup(group.id);
    }
  };

  const handleToggleGroup = (groupId: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (onToggleGroup) {
      onToggleGroup(groupId);
    }
  };

  const handleShowAll = (): void => {
    if (onShowAll) {
      onShowAll();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading groups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <List className="h-5 w-5 mr-2" />
          Groups ({groups.length})
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Show All Button */}
      {onShowAll && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleShowAll}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              !activeGroup && highlightedGroupId === null
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Show All Contacts
          </button>
        </div>
      )}

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-6 text-center">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No groups created yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Create a group to organize your contacts
            </p>
          </div>
        ) : (
          <div className="p-2">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className={`group relative p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                  highlightedGroupId === group.id
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                    : activeGroup?.id === group.id
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : selectedGroups.includes(group.id)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Checkbox for selection */}
                    {onToggleGroup && (
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={(e) => handleToggleGroup(group.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    )}

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {group.contact_count || group.contacts?.length || 0} contact{(group.contact_count || group.contacts?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Email Group Button */}
                    <button
                      onClick={(e) => handleEmailGroup(group, e)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Email all contacts in group"
                    >
                      <Mail className="h-4 w-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleEditClick(group, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit group"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(group, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Group Status Indicator */}
                {highlightedGroupId === group.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg"></div>
                )}
                {activeGroup?.id === group.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Single click to highlight • Double click to manage
        </p>
      </div>
    </div>
  );
};

export default GroupList;
