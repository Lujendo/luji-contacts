import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContactForm from './ContactForm';
import ContactDetail from './ContactDetail';
import ContactTable from './ContactTable';
import GroupList from './GroupList';
import GroupForm from './GroupForm';
import GroupEditForm from './GroupEditForm';
import EmailForm from './EmailForm';
import EmailHistory from './EmailHistory';
import DashboardImportExport from './DashboardImportExport';
import UserSettings from './UserSettings';
import BulkGroupAssign from './BulkGroupAssign';
import BulkGroupRemove from './BulkGroupRemove';
import GroupContactsManager from './GroupContactsManager';
import ResizablePanel from './ResizablePanel';
import ResizableRightPanel from './ResizableRightPanel';

import {
  UserCircle,
  LogOut,
  Plus,
  Users,
  Mail,
  Loader,
  Search,
  X,
  History,
  Settings,
  ArrowUpDown,
  UserMinus,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  // Config getter
  const getSavedSortConfig = () => {
    const saved = localStorage.getItem('contactsSortConfig');
    return saved ? JSON.parse(saved) : { key: 'created_at', direction: 'desc' };
  };

  // State declarations
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGroupEditForm, setShowGroupEditForm] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [sortConfig, setSortConfig] = useState(getSavedSortConfig());
  const [sortLoading, setSortLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importExportLoading, setImportExportLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showBulkRemove, setShowBulkRemove] = useState(false);
  const [highlightedGroupId, setHighlightedGroupId] = useState(null);
  

  // Email-related state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [selectedEmailRecipients, setSelectedEmailRecipients] = useState({
    groups: [],
    contacts: []
  });
  // Authentication effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/', { replace: true });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [navigate]);

  // Add this right after your other useEffect for authentication
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(response.data); // This will set the logged-in user data
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
}, []); // Run once when component mounts

  // Initial data fetching
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [contactsResponse, groupsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              sort: sortConfig.key,
              direction: sortConfig.direction
            }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/groups`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          // Note: Email functionality not implemented in backend yet
        ]);

        setContacts(contactsResponse.data.contacts || []);
        setFilteredContacts(contactsResponse.data.contacts || []);
        setGroups(groupsResponse.data.groups || []);
        // setEmailHistory([]); // Email functionality not implemented yet
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [sortConfig.key, sortConfig.direction]);

  // Import/Export handlers
  const handleImportComplete = useCallback(async () => {
    try {
      setImportExportLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        params: {
          sort: sortConfig.key,
          direction: sortConfig.direction
        }
      });
      setContacts(response.data);
      setFilteredContacts(response.data);
      setError(null);
      setShowImportExport(false);
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      setError('Failed to refresh contacts after import');
    } finally {
      setImportExportLoading(false);
    }
  }, [sortConfig.key, sortConfig.direction]);

  // Basic handlers
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const searchValue = value.toLowerCase();
    const filtered = contacts.filter(contact => {
      return (
        (contact.first_name + ' ' + contact.last_name).toLowerCase().includes(searchValue) ||
        (contact.email || '').toLowerCase().includes(searchValue) ||
        (contact.phone || '').toLowerCase().includes(searchValue) ||
        (contact.notes || '').toLowerCase().includes(searchValue) ||
        contact.Groups?.some(group => group.name.toLowerCase().includes(searchValue))
      );
    });
    setFilteredContacts(filtered);
  }, [contacts]);

  const handleShowEmailForm = useCallback((recipients = { groups: [], contacts: [] }) => {
    setSelectedEmailRecipients(recipients);
    setShowEmailForm(true);
  }, []);

  const handleSort = useCallback((key, direction) => {
    setSortLoading(true);
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    localStorage.setItem('contactsSortConfig', JSON.stringify(newConfig));
    setSortLoading(false);
  }, []);

  // Group Handlers
useEffect(() => {
    console.log('GroupManager State:', { 
        showGroupManager, 
        selectedGroup: selectedGroup?.id,
        isVisible: !!(showGroupManager && selectedGroup)
    });
}, [showGroupManager, selectedGroup]);

// And modify handleGroupSelect:
const handleGroupSelect = useCallback(async (groupId) => {
  console.log('handleGroupSelect called with groupId:', groupId);
  try {
    setLoading(true);
    setError(null);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`);
    console.log('Group data fetched:', response.data);
    setSelectedGroup(response.data);
    setShowGroupManager(true);
    console.log('GroupManager states updated - should be visible now', {
      showGroupManager: true,
      selectedGroup: response.data
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    setError('Failed to fetch group details');
  } finally {
    setLoading(false);
  }
}, []);

const handleHighlightGroupContacts = useCallback((groupId) => {
  setHighlightedGroupId(groupId === highlightedGroupId ? null : groupId);

  // Also update filtered contacts based on the group
  if (groupId && groupId !== highlightedGroupId) {
    const group = groups.find(g => g.id === groupId);
    if (group && group.Contacts) {
      const groupContactIds = new Set(group.Contacts.map(c => c.id));
      const filtered = contacts.filter(contact => groupContactIds.has(contact.id));
      setFilteredContacts(filtered);
    }
  } else {
    // If deselecting or no group, show all contacts
    setFilteredContacts(contacts);
  }
}, [contacts, groups, highlightedGroupId]);

  const handleShowAllContacts = useCallback(() => {
    setHighlightedGroupId(null);
    setFilteredContacts(contacts);
  }, [contacts]);

  // Group Handlers (Additional)
  const handleToggleGroup = useCallback((groupId) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      return newSelection;
    });
  }, []);

  const handleEditGroup = useCallback((group) => {
    setSelectedGroupForEdit(group);
    setShowGroupEditForm(true);
  }, []);

  const handleDeleteGroup = useCallback(async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      setGroupLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
      setGroups(response.data);
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
      setError(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Contact Handlers
  const handleToggleContact = useCallback((contactId) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const handleAddContact = useCallback(async (newContact) => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/contacts`, newContact);
      const contactsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`);
      setContacts(contactsResponse.data);
      setFilteredContacts(contactsResponse.data);
      setSelectedContact(response.data);
      setShowContactForm(false);
      setError(null);
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteContact = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`);
      setContacts(response.data);
      setFilteredContacts(response.data);
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      setError(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError('Failed to delete contact');
    } finally {
      setLoading(false);
    }
  }, [selectedContact]);

  const handleUpdateContact = useCallback(async (updatedContact) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/contacts/${updatedContact.id}`,
        updatedContact
      );
      const [contactsResponse, updatedContactResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${updatedContact.id}`)
      ]);
      setContacts(contactsResponse.data);
      setFilteredContacts(contactsResponse.data);
      setSelectedContact(updatedContactResponse.data);
      setError(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      setError('Failed to update contact');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddGroup = useCallback(async (newGroup) => {
    try {
      setGroupLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/groups`, newGroup);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
      setGroups(response.data);
      setShowGroupForm(false);
      setError(null);
    } catch (error) {
      console.error('Error adding group:', error);
      setError('Failed to add group');
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Group Membership Handlers
  const handleAddToGroup = useCallback(async (contactId, groupId) => {
    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`);
      const [contactResponse, groupsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
      ]);
      setSelectedContact(contactResponse.data);
      setGroups(groupsResponse.data);
      setError(null);
    } catch (error) {
      console.error('Error adding to group:', error);
      setError('Failed to add contact to group');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemoveFromGroup = useCallback(async (contactId, groupId) => {
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}/groups/${groupId}`);
      const [contactResponse, groupsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
      ]);
      setSelectedContact(contactResponse.data);
      setGroups(groupsResponse.data);
      setError(null);
    } catch (error) {
      console.error('Error removing from group:', error);
      setError('Failed to remove contact from group');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/', { replace: true });
    }
  }, [navigate]);


// Group update handler
const handleUpdateGroup = useCallback(async (groupId, updatedGroup) => {
  try {
    setGroupLoading(true);
    await axios.put(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`, updatedGroup);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
    setGroups(response.data);
    setShowGroupEditForm(false);
    setSelectedGroupForEdit(null);
    setError(null);
  } catch (error) {
    console.error('Error updating group:', error);
    setError('Failed to update group');
  } finally {
    setGroupLoading(false);
  }
}, []);

// Email sending handler
const handleSendEmail = useCallback(async (emailData) => {
  try {
    setEmailLoading(true);
    // TODO: Implement email functionality in backend
    // if (emailData.groupIds.length > 0) {
    //   await axios.post(`${import.meta.env.VITE_API_URL}/api/emails/groups`, emailData);
    // }
    // if (emailData.contactIds.length > 0) {
    //   await axios.post(`${import.meta.env.VITE_API_URL}/api/emails/contacts`, emailData);
    // }
    // const emailHistoryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/emails`);
    // setEmailHistory(emailHistoryResponse.data);
    setShowEmailForm(false);
    setError('Email functionality not yet implemented');
  } catch (error) {
    console.error('Error sending email:', error);
    setError('Failed to send email');
  } finally {
    setEmailLoading(false);
  }
}, []);

// Bulk group handlers
const handleBulkGroupAssign = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    await Promise.all(
      contactIds.map(contactId =>
        axios.post(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`)
      )
    );
    const [contactsResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);
    setContacts(contactsResponse.data);
    setFilteredContacts(contactsResponse.data);
    setGroups(groupsResponse.data);
    setSelectedContactIds([]);
    setShowBulkAssign(false);
    setError(null);
  } catch (error) {
    console.error('Error assigning contacts to group:', error);
    setError('Failed to assign contacts to group');
  } finally {
    setLoading(false);
  }
}, [contacts]);

const handleBulkGroupRemove = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    await Promise.all(
      contactIds.map(contactId =>
        axios.delete(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}/groups/${groupId}`)
      )
    );
    const [contactsResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);
    setContacts(contactsResponse.data);
    setFilteredContacts(contactsResponse.data);
    setGroups(groupsResponse.data);
    setSelectedContactIds([]);
    setShowBulkRemove(false);
    setError(null);
  } catch (error) {
    console.error('Error removing contacts from group:', error);
    setError('Failed to remove contacts from group');
  } finally {
    setLoading(false);
  }
}, [contacts]);

// Bulk add/remove handlers for GroupContactsManager
const handleBulkAddToGroup = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    await Promise.all(
      contactIds.map(contactId =>
        axios.post(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`)
      )
    );
    const [groupResponse, contactsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`)
    ]);
    setSelectedGroup(groupResponse.data);
    setContacts(contactsResponse.data);
    setFilteredContacts(contactsResponse.data);
    setError(null);
  } catch (error) {
    console.error('Error adding contacts to group:', error);
    setError('Failed to add contacts to group');
  } finally {
    setLoading(false);
  }
}, []);

const handleBulkRemoveFromGroup = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    await Promise.all(
      contactIds.map(contactId =>
        axios.delete(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`)
      )
    );
    const [groupResponse, contactsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`)
    ]);
    setSelectedGroup(groupResponse.data);
    setContacts(contactsResponse.data);
    setFilteredContacts(contactsResponse.data);
    setError(null);
  } catch (error) {
    console.error('Error removing contacts from group:', error);
    setError('Failed to remove contacts from group');
  } finally {
    setLoading(false);
  }
}, []);




  // Loading indicator
  if (loading && !sortLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Groups */}
      <ResizablePanel minWidth={200} maxWidth={400} defaultWidth={256}>
        <div className="h-full bg-white shadow-sm border-r border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center text-gray-800">
                <Users size={20} className="mr-2 text-indigo-600" />
                Groups
              </h2>
              {groupLoading && <Loader size={16} className="animate-spin text-indigo-600" />}
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setShowGroupForm(true)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 
                         rounded-md border border-gray-300 transition-colors duration-200"
              >
                <Plus size={16} className="mr-2 text-indigo-600" />
                Add New Group
              </button>
              {selectedGroups.length > 0 && (
                <button
                  onClick={() => handleShowEmailForm({
                    groups: groups.filter(g => selectedGroups.includes(g.id)),
                    contacts: []
                  })}
                  className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 
                           bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 
                           transition-colors duration-200"
                >
                  <Mail size={16} className="mr-2" />
                  Email Selected ({selectedGroups.length})
                </button>
              )}
            </div>
            <div className="mt-4">
                <GroupList
                  groups={groups}
                  selectedGroups={selectedGroups}
                  onToggleGroup={handleToggleGroup}
                  onEditGroup={handleEditGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onSelectGroup={handleGroupSelect}
                  onHighlightGroupContacts={handleHighlightGroupContacts}
                  onShowAll={handleShowAllContacts}  // Add this
                  isLoading={groupLoading}
                  activeGroup={selectedGroup}
                  highlightedGroupId={highlightedGroupId}  // Add this
                />
            </div>
          </div>
        </div>
      </ResizablePanel>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Mail size={24} className="mr-2 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-800">Contact Manager</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowImportExport(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                            bg-white border border-gray-300 rounded-md hover:bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <ArrowUpDown size={18} className="mr-2" />
                  Import/Export
                </button>
                <button
                  onClick={() => setShowEmailHistory(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                            bg-white border border-gray-300 rounded-md hover:bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <History size={18} className="mr-2" />
                  Email History
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700
                  bg-white border border-gray-300 rounded-md hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                  <Settings size={18} className="mr-2" />
                  Settings
                </button>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <UserCircle size={24} className="text-gray-500" />
                      <span className="text-sm font-medium">
                        {user?.name || user?.username || 'Loading...'}
                      </span>
                    </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 
                            bg-red-50 rounded-md hover:bg-red-100 focus:outline-none 
                            focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Contacts Section */}
        <div className="flex-1 overflow-auto p-6">
          {/* Contact Table and related components */}
          <ContactTable
            contacts={filteredContacts}
            onDelete={handleDeleteContact}
            onSelectContact={setSelectedContact}
            selectedContactId={selectedContact?.id}
            selectedContactIds={selectedContactIds}
            onToggleSelection={handleToggleContact}
            sortConfig={sortConfig}
            onSort={handleSort}
            sortLoading={sortLoading}
            highlightedGroupId={highlightedGroupId}
            onDoubleClickContact={handleDoubleClickContact}
          />
        </div>
      </div>

      <ContactDetailPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        contact={selectedContact}
      />
    


      {/* Right Sidebar - Contact Details */}
      <ResizableRightPanel minWidth={300} maxWidth={600} defaultWidth={384}>
        <div className="h-full bg-white shadow-sm border-l border-gray-200">
          {selectedContact ? (
            <ContactDetail
              contact={selectedContact}
              allGroups={groups}
              onUpdateContact={handleUpdateContact}
              onAddToGroup={handleAddToGroup}
              onRemoveFromGroup={handleRemoveFromGroup}
            />
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a contact to view details
            </div>
          )}
        </div>
      </ResizableRightPanel>

      {/* Modals */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <ArrowUpDown size={24} className="mr-2 text-indigo-600" />
                Import & Export Contacts
              </h2>
              <button
                onClick={() => setShowImportExport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <DashboardImportExport
              onImportComplete={handleImportComplete}
              onError={setError}
              onClose={() => setShowImportExport(false)}
              isLoading={importExportLoading}
            />
          </div>
        </div>
      )}

      {/* Other Modals */}
      {showContactForm && (
        <ContactForm
          onClose={() => setShowContactForm(false)}
          onContactAdded={handleAddContact}
        />
      )}

      {showGroupForm && (
        <GroupForm
          onClose={() => setShowGroupForm(false)}
          onGroupAdded={handleAddGroup}
          isLoading={groupLoading}
        />
      )}

    
{showContactForm && (
  <ContactForm
    onClose={() => setShowContactForm(false)}
    onContactAdded={handleAddContact}
  />
)}

{showGroupForm && (
  <GroupForm
    onClose={() => setShowGroupForm(false)}
    onGroupAdded={handleAddGroup}
    isLoading={groupLoading}
  />
      )}

      {showSettings && (
        <UserSettings
          user={user}
          onClose={() => setShowSettings(false)}
          onError={setError}
        />
      )}

{/* Add GroupContactsManager here */}
{showGroupManager && selectedGroup && (
  <GroupContactsManager
    group={selectedGroup}
    contacts={contacts}
    onAddContacts={(contactIds) => handleBulkAddToGroup(selectedGroup.id, contactIds)}
    onRemoveContacts={(contactIds) => handleBulkRemoveFromGroup(selectedGroup.id, contactIds)}
    isLoading={loading}
    onClose={() => {
      setShowGroupManager(false);
      setSelectedGroup(null);
      // Refresh groups
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
        .then(response => setGroups(response.data))
        .catch(error => {
          console.error('Error refreshing groups:', error);
          setError('Failed to refresh groups');
        });
    }}
  />
)}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border-l-4 border-red-500 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;