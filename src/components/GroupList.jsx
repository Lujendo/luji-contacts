import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Mail, List } from 'lucide-react';

const GroupList = ({
  groups,
  onSelectGroup,
  selectedGroups,
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  onHighlightGroupContacts,
  onShowAll,
  isLoading,
  activeGroup,
  highlightedGroupId
}) => {
  const [lastClickedGroup, setLastClickedGroup] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(null);
  const clickTimeout = useRef(null);

  const DOUBLE_CLICK_DELAY = 300;

  const handleEmailGroup = (group, e) => {
    e.stopPropagation();
    const emailAddresses = group.Contacts?.map(contact => contact.email).filter(Boolean) || [];

    if (emailAddresses.length === 0) {
      alert(`No email addresses found in group "${group.name}". Please add contacts with email addresses to this group.`);
      return;
    }

    const mailtoLink = `mailto:?bcc=${emailAddresses.join(',')}`;
    window.location.href = mailtoLink;
  };

  const handleGroupClick = (group) => {
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

      // Call onSelectGroup with the group id
      onSelectGroup(group.id);
    } else {
      console.log('Single click detected');
      setLastClickedGroup(group.id);
      setLastClickTime(now);

      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }

      clickTimeout.current = setTimeout(() => {
        console.log('Single click timeout executed - Highlighting contacts');
        onHighlightGroupContacts(group.id);
        setLastClickedGroup(null);
        setLastClickTime(null);
      }, 250);
    }
  };

  React.useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          onShowAll?.();
          setLastClickedGroup(null);
          setLastClickTime(null);
        }}
        className={`w-full flex items-center px-4 py-2 text-sm
                   ${!highlightedGroupId
            ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
            : 'text-gray-700 hover:bg-gray-50 border-gray-300'}
                   rounded-md border transition-colors duration-200`}
      >
        <List size={16} className="mr-2" />
        Show All Contacts
      </button>

      {groups.map(group => (
        <div
          key={group.id}
          className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer
                     ${activeGroup?.id === group.id ? 'bg-indigo-50' : ''}
                     ${highlightedGroupId === group.id ? 'ring-2 ring-indigo-500' : ''}`}
          onClick={() => handleGroupClick(group)}
        >
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedGroups.includes(group.id)}
              onChange={(e) => {
                e.stopPropagation();
                onToggleGroup(group.id);
              }}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-3 cursor-pointer"
            />
            <span className="text-gray-700 hover:text-gray-900">
              {group.name}
              <span className="ml-2 text-xs text-gray-500">
                ({group.Contacts?.length || 0} {(group.Contacts?.length || 0) === 1 ? 'contact' : 'contacts'})
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={(e) => handleEmailGroup(group, e)}
              className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 group"
              title={`Send email to ${group.Contacts?.length || 0} contacts (BCC)`}
            >
              <Mail size={16} className="group-hover:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditGroup(group);
              }}
              className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup(group.id);
              }}
              className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {groups.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No groups available
        </div>
      )}
    </div>
  );
};

GroupList.defaultProps = {
  selectedGroups: [],
  onSelectGroup: () => { },
  onToggleGroup: () => { },
  onEditGroup: () => { },
  onDeleteGroup: () => { },
  onHighlightGroupContacts: () => { },
  onShowAll: () => { },
  isLoading: false
};

export default GroupList;