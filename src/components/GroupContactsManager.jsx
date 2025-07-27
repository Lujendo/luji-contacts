import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, UserMinus, Loader, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://luji-contacts.info-eac.workers.dev';

const GroupContactsManager = ({
  group,
  contacts = [],
  onAddContacts,
  onRemoveContacts,
  isLoading: parentIsLoading,
  onClose
}) => {
  // State declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [selectedAvailableContacts, setSelectedAvailableContacts] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [groupContacts, setGroupContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Fetch group contacts when component mounts
  useEffect(() => {
    const fetchGroupContacts = async () => {
      if (!group?.id) {
        setError('Invalid group data');
        setIsLoadingContacts(false);
        return;
      }

      try {
        setIsLoadingContacts(true);
        const response = await axios.get(
          `${API_URL}/api/groups/${group.id}/contacts`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.data) {
          throw new Error('No data received from server');
        }

        setGroupContacts(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching group contacts:', err);
        setError(err.response?.data?.message || 'Failed to load group contacts. Please try again.');
        setGroupContacts([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchGroupContacts();
  }, [group?.id]);

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!Array.isArray(contacts)) return [];

    return contacts.filter(contact => {
      if (!contact) return false;
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [contacts, searchTerm]);

  // Separate contacts into group members and non-members
  const { groupMembers, nonMembers } = useMemo(() => {
    try {
      if (!Array.isArray(groupContacts) || !Array.isArray(filteredContacts)) {
        return { groupMembers: [], nonMembers: [] };
      }

      const groupContactIds = new Set(groupContacts.map(c => c?.id).filter(Boolean));

      return {
        groupMembers: filteredContacts.filter(c => c?.id && groupContactIds.has(c.id)),
        nonMembers: filteredContacts.filter(c => c?.id && !groupContactIds.has(c.id))
      };
    } catch (err) {
      console.error('Error separating contacts:', err);
      return { groupMembers: [], nonMembers: [] };
    }
  }, [groupContacts, filteredContacts]);

  // Contact selection handlers
  const handleToggleContact = (contactId, isGroupMember) => {
    if (isGroupMember) {
      setSelectedGroupMembers(prev =>
        prev.includes(contactId)
          ? prev.filter(id => id !== contactId)
          : [...prev, contactId]
      );
    } else {
      setSelectedAvailableContacts(prev =>
        prev.includes(contactId)
          ? prev.filter(id => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleSelectAllInGroup = () => {
    setSelectedGroupMembers(
      selectedGroupMembers.length === groupMembers.length
        ? []
        : groupMembers.map(contact => contact.id)
    );
  };

  const handleSelectAllNonMembers = () => {
    setSelectedAvailableContacts(
      selectedAvailableContacts.length === nonMembers.length
        ? []
        : nonMembers.map(contact => contact.id)
    );
  };

  // Handle adding contacts to group
  const handleAddSelected = async () => {
    if (selectedAvailableContacts.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Add contacts one by one
      for (const contactId of selectedAvailableContacts) {
        await axios.post(
          `${API_URL}/api/groups/${group.id}/contacts/${contactId}`,
          {},
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      // Refresh group contacts
      const response = await axios.get(
        `${API_URL}/api/groups/${group.id}/contacts`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setGroupContacts(response.data);
      setSelectedAvailableContacts([]);

      // Notify parent component
      await onAddContacts(selectedAvailableContacts);
    } catch (err) {
      console.error('Error adding contacts:', err);
      setError(err.response?.data?.message || 'Failed to add contacts to group. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle removing contacts from group
  const handleConfirmDelete = async () => {
    if (selectedGroupMembers.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Remove contacts one by one
      for (const contactId of selectedGroupMembers) {
        await axios.delete(
          `${API_URL}/api/groups/${group.id}/contacts/${contactId}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      // Refresh group contacts
      const response = await axios.get(
        `${API_URL}/api/groups/${group.id}/contacts`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setGroupContacts(response.data);
      setSelectedGroupMembers([]);
      setShowConfirmDelete(false);

      // Notify parent component
      await onRemoveContacts(selectedGroupMembers);
    } catch (err) {
      console.error('Error removing contacts:', err);
      setError(err.response?.data?.message || 'Failed to remove contacts from group. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while fetching initial data
  if (isLoadingContacts || parentIsLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="mt-2 text-gray-600">Loading group contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl m-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Manage Contacts in {group?.name || 'Loading...'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isProcessing}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4"
                onClick={() => setError(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isProcessing}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Contact Lists */}
          <div className="grid grid-cols-2 gap-6">
            {/* Group Members */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">
                  Group Members ({groupMembers.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAllInGroup}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                    disabled={isProcessing}
                  >
                    {selectedGroupMembers.length === groupMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedGroupMembers.length > 0 && (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      disabled={isProcessing}
                      className="flex items-center px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Remove Selected ({selectedGroupMembers.length})
                    </button>
                  )}
                </div>
              </div>
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {groupMembers.map(contact => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-3 hover:bg-gray-50 ${selectedGroupMembers.includes(contact.id) ? 'bg-indigo-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupMembers.includes(contact.id)}
                      onChange={() => handleToggleContact(contact.id, true)}
                      disabled={isProcessing}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-3"
                    />
                    <div>
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No contacts in this group
                  </div>
                )}
              </div>
            </div>

            {/* Available Contacts */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">
                  Available Contacts ({nonMembers.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAllNonMembers}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                    disabled={isProcessing}
                  >
                    {selectedAvailableContacts.length === nonMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedAvailableContacts.length > 0 && (
                    <button
                      onClick={handleAddSelected}
                      disabled={isProcessing}
                      className="flex items-center px-2 py-1 text-sm text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      {isProcessing ? 'Adding...' : `Add Selected (${selectedAvailableContacts.length})`}
                    </button>
                  )}
                </div>
              </div>
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {nonMembers.map(contact => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-3 hover:bg-gray-50 ${selectedAvailableContacts.includes(contact.id) ? 'bg-indigo-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAvailableContacts.includes(contact.id)}
                      onChange={() => handleToggleContact(contact.id, false)}
                      disabled={isProcessing}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-3"
                    />
                    <div>
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                ))}
                {nonMembers.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No available contacts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {(isProcessing || parentIsLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-3">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Removal</h3>
            </div>
            <p className="mb-4">
              Are you sure you want to remove {selectedGroupMembers.length} contact(s) from {group.name}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupContactsManager;