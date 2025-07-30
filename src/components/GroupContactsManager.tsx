import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, UserMinus, Loader, X, AlertTriangle, Users, User } from 'lucide-react';
import { Contact, Group } from '../types';
import { contactsApi } from '../api';

// Component props interface
interface GroupContactsManagerProps {
  group: Group;
  contacts?: Contact[];
  onAddContacts?: (groupId: number, contactIds: number[]) => void;
  onRemoveContacts?: (groupId: number, contactIds: number[]) => void;
  isLoading?: boolean;
  onClose: () => void;
  onGroupUpdated?: (group: Group) => void;
}

const GroupContactsManager: React.FC<GroupContactsManagerProps> = ({
  group,
  contacts = [],
  onAddContacts,
  onRemoveContacts,
  isLoading: parentIsLoading = false,
  onClose,
  onGroupUpdated
}) => {
  // Safety check - if group is not provided, show error
  if (!group) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">No group selected</p>
          <p className="text-gray-500 text-sm mt-1">Please select a group to manage its contacts.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  // State declarations
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);
  const [selectedAvailableContacts, setSelectedAvailableContacts] = useState<number[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(true);

  // Fetch group contacts when component mounts
  useEffect(() => {
    const fetchGroupContacts = async (): Promise<void> => {
      if (!group?.id) {
        setError('Invalid group data');
        setIsLoadingContacts(false);
        return;
      }

      try {
        setIsLoadingContacts(true);
        const groupContactsData = await contactsApi.getGroupContacts(group.id);
        setGroupContacts(groupContactsData);
        setError('');
      } catch (error) {
        console.error('Error fetching group contacts:', error);
        setError(error instanceof Error ? error.message : 'Failed to load group contacts');
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchGroupContacts();
  }, [group?.id]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter contacts based on search term
  const filteredGroupContacts = useMemo(() => {
    if (!searchTerm) return groupContacts;
    
    const term = searchTerm.toLowerCase();
    return groupContacts.filter(contact =>
      contact.first_name?.toLowerCase().includes(term) ||
      contact.last_name?.toLowerCase().includes(term) ||
      contact.email?.toLowerCase().includes(term) ||
      contact.company?.toLowerCase().includes(term)
    );
  }, [groupContacts, searchTerm]);

  // Get available contacts (not in group)
  const availableContacts = useMemo(() => {
    const groupContactIds = new Set(groupContacts.map(c => c.id));
    const filtered = contacts.filter(contact => !groupContactIds.has(contact.id));
    
    if (!searchTerm) return filtered;
    
    const term = searchTerm.toLowerCase();
    return filtered.filter(contact =>
      contact.first_name?.toLowerCase().includes(term) ||
      contact.last_name?.toLowerCase().includes(term) ||
      contact.email?.toLowerCase().includes(term) ||
      contact.company?.toLowerCase().includes(term)
    );
  }, [contacts, groupContacts, searchTerm]);

  // Handle adding contacts to group
  const handleAddContacts = async (): Promise<void> => {
    if (selectedAvailableContacts.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      if (onAddContacts) {
        onAddContacts(group.id, selectedAvailableContacts);
      } else {
        await contactsApi.assignContactsToGroup(group.id, selectedAvailableContacts);
      }

      // Refresh group contacts
      const updatedGroupContacts = await contactsApi.getGroupContacts(group.id);
      setGroupContacts(updatedGroupContacts);
      setSelectedAvailableContacts([]);

      // Update group data if callback provided
      if (onGroupUpdated) {
        const updatedGroup = { ...group, contact_count: updatedGroupContacts.length };
        onGroupUpdated(updatedGroup);
      }

    } catch (error) {
      console.error('Error adding contacts to group:', error);
      setError(error instanceof Error ? error.message : 'Failed to add contacts to group');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle removing contacts from group
  const handleRemoveContacts = async (): Promise<void> => {
    if (selectedGroupMembers.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      if (onRemoveContacts) {
        onRemoveContacts(group.id, selectedGroupMembers);
      } else {
        await contactsApi.removeContactsFromGroup(group.id, selectedGroupMembers);
      }

      // Refresh group contacts
      const updatedGroupContacts = await contactsApi.getGroupContacts(group.id);
      setGroupContacts(updatedGroupContacts);
      setSelectedGroupMembers([]);
      setShowConfirmDelete(false);

      // Update group data if callback provided
      if (onGroupUpdated) {
        const updatedGroup = { ...group, contact_count: updatedGroupContacts.length };
        onGroupUpdated(updatedGroup);
      }

    } catch (error) {
      console.error('Error removing contacts from group:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove contacts from group');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle contact selection
  const handleGroupMemberToggle = (contactId: number): void => {
    setSelectedGroupMembers(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAvailableContactToggle = (contactId: number): void => {
    setSelectedAvailableContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Handle select all
  const handleSelectAllGroupMembers = (): void => {
    if (selectedGroupMembers.length === filteredGroupContacts.length) {
      setSelectedGroupMembers([]);
    } else {
      setSelectedGroupMembers(filteredGroupContacts.map(c => c.id));
    }
  };

  const handleSelectAllAvailable = (): void => {
    if (selectedAvailableContacts.length === availableContacts.length) {
      setSelectedAvailableContacts([]);
    } else {
      setSelectedAvailableContacts(availableContacts.map(c => c.id));
    }
  };

  // Contact list item component
  const ContactItem: React.FC<{
    contact: Contact;
    isSelected: boolean;
    onToggle: (id: number) => void;
  }> = ({ contact, isSelected, onToggle }) => (
    <div
      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => onToggle(contact.id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(contact.id)}
        className="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {contact.profile_image_url ? (
              <img
                src={contact.profile_image_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {contact.first_name || contact.last_name
                ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                : 'Unnamed Contact'
              }
            </p>
            <p className="text-sm text-gray-500 truncate">
              {contact.email || contact.company || 'No additional info'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoadingContacts) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Manage Group Contacts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading group contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2" />
            Manage Group Contacts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Group: <span className="font-medium">{group?.name || 'Unknown Group'}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-2 gap-6 p-6">
          {/* Current Group Members */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Group Members ({filteredGroupContacts.length})
              </h3>
              {filteredGroupContacts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAllGroupMembers}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {selectedGroupMembers.length === filteredGroupContacts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedGroupMembers.length > 0 && (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove ({selectedGroupMembers.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredGroupContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching contacts in this group' : 'No contacts in this group yet'}
                  </p>
                </div>
              ) : (
                filteredGroupContacts.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedGroupMembers.includes(contact.id)}
                    onToggle={handleGroupMemberToggle}
                  />
                ))
              )}
            </div>
          </div>

          {/* Available Contacts */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Available Contacts ({availableContacts.length})
              </h3>
              {availableContacts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAllAvailable}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {selectedAvailableContacts.length === availableContacts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedAvailableContacts.length > 0 && (
                    <button
                      onClick={handleAddContacts}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader className="h-4 w-4 mr-1 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add ({selectedAvailableContacts.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {availableContacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching available contacts' : 'All contacts are already in this group'}
                  </p>
                </div>
              ) : (
                availableContacts.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedAvailableContacts.includes(contact.id)}
                    onToggle={handleAvailableContactToggle}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Removal</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove {selectedGroupMembers.length} contact{selectedGroupMembers.length !== 1 ? 's' : ''} from "{group.name}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveContacts}
                disabled={isProcessing}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </div>
                ) : (
                  'Remove Contacts'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupContactsManager;
