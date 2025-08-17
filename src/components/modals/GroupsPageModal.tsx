import React, { useState } from 'react';
import { X, Users, Plus, Edit2, Trash2, UserPlus, Settings, Search } from 'lucide-react';
import { Group, Contact } from '../../types';

interface GroupsPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  contacts: Contact[];
  onGroupEdit: (group: Group) => void;
  onGroupDelete: (groupId: number) => void;
  onAddNewGroup: () => void;
  onGroupClick: (groupId: number) => void;
  activeGroup?: Group | null;
}

const GroupsPageModal: React.FC<GroupsPageModalProps> = ({
  isOpen,
  onClose,
  groups,
  contacts,
  onGroupEdit,
  onGroupDelete,
  onAddNewGroup,
  onGroupClick,
  activeGroup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  if (!isOpen) return null;

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGroupSelect = (group: Group) => {
    setSelectedGroupId(group.id);
    onGroupClick(group.id);
  };

  const handleDeleteGroup = (group: Group) => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
      onGroupDelete(group.id);
      if (selectedGroupId === group.id) {
        setSelectedGroupId(null);
      }
    }
  };

  const getGroupContacts = (groupId: number) => {
    // This would need to be implemented based on your group-contact relationship
    // For now, returning empty array as placeholder
    return [];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Groups Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Groups List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search and Add */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={onAddNewGroup}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Group
              </button>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'No groups found matching your search' : 'No groups created yet'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={onAddNewGroup}
                      className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Create your first group
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className={`group relative p-4 mb-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedGroupId === group.id
                          ? 'bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200'
                          : activeGroup?.id === group.id
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {group.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {group.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {group.contact_count || 0} contacts
                              </p>
                              {group.description && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onGroupEdit(group);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit group"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group Details */}
          <div className="flex-1 flex flex-col">
            {selectedGroupId ? (
              (() => {
                const selectedGroup = groups.find(g => g.id === selectedGroupId);
                const groupContacts = getGroupContacts(selectedGroupId);
                
                return selectedGroup ? (
                  <div className="flex-1 flex flex-col">
                    {/* Group Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-xl">
                              {selectedGroup.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {selectedGroup.name}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {selectedGroup.contact_count || 0} contacts
                            </p>
                            {selectedGroup.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {selectedGroup.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onGroupEdit(selectedGroup)}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Group Contacts */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Group Members</h4>
                        <button className="flex items-center px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Contacts
                        </button>
                      </div>
                      
                      {groupContacts.length === 0 ? (
                        <div className="text-center py-12">
                          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No contacts in this group yet</p>
                          <button className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            Add contacts to this group
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Contact list would go here */}
                          <p className="text-gray-500 text-sm">Contact list implementation needed</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Group</h3>
                  <p className="text-gray-500 text-sm">
                    Choose a group from the list to view and manage its members
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {groups.length} group{groups.length !== 1 ? 's' : ''} total
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupsPageModal;
