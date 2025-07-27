// Part 1: Imports and Basic Setup
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Component imports
import FixedNavigation from './FixedNavigation';
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
import ContactDetailPanel from './ContactDetailPanel';
import ResizableMainPanel from './ResizableMainPanel';
import GroupAssignModal from './GroupAssignModal';
import GroupRemoveModal from './GroupRemoveModal';

// Icon imports
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
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  // Panel visibility states
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);

  // Configuration states
  const getSavedSortConfig = () => {
    const saved = localStorage.getItem('contactsSortConfig');
    return saved ? JSON.parse(saved) : { key: 'created_at', direction: 'desc' };
  };

  // Core data states
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedContactIds, setSelectedContactIds] = useState([]);


  // UI state management
  const [showContactForm, setShowContactForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGroupEditForm, setShowGroupEditForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkRemove, setShowBulkRemove] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showSingleContactGroupAssign, setShowSingleContactGroupAssign] = useState(false);
  const [showSingleContactGroupRemove, setShowSingleContactGroupRemove] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(800);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortLoading, setSortLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [importExportLoading, setImportExportLoading] = useState(false);

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(getSavedSortConfig());

  // Selection states
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [highlightedGroupId, setHighlightedGroupId] = useState(null);
  const [selectedEmailRecipients, setSelectedEmailRecipients] = useState({
    groups: [],
    contacts: []
  });
  const [emailHistory, setEmailHistory] = useState([]);

  // ... continuing from Part 1

  // Authentication effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    // Set up axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Set up axios interceptor for handling 401 responses
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

    // Cleanup function
    return () => {
      axios.interceptors.response.eject(interceptor);
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [navigate]);

  // User data fetching effect
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      }
    };

    fetchUserData();
  }, []);

  // Dashboard initialization effect
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all required data in parallel
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

        // Update state with fetched data
        setContacts(contactsResponse.data.contacts || []);
        setFilteredContacts(contactsResponse.data.contacts || []);
        setGroups(groupsResponse.data.groups || []);
        // setEmailHistory([]); // Email functionality not implemented yet
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');

        // Handle specific error cases
        if (error.response?.status === 404) {
          setError('Required data not found');
        } else if (error.response?.status === 403) {
          setError('You do not have permission to access this data');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [sortConfig.key, sortConfig.direction]);

  // Handle auto-refresh of data when needed
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const [contactsResponse, groupsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
            params: {
              sort: sortConfig.key,
              direction: sortConfig.direction
            }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
        ]);

        // Update only if data has changed
        const newContacts = contactsResponse.data.contacts || [];
        const newGroups = groupsResponse.data.groups || [];

        if (JSON.stringify(contacts) !== JSON.stringify(newContacts)) {
          setContacts(newContacts);
          setFilteredContacts(prev => {
            // Preserve search/filter state while updating data
            if (searchTerm || highlightedGroupId) {
              return prev.map(contact => {
                const updatedContact = newContacts.find(c => c.id === contact.id);
                return updatedContact || contact;
              });
            }
            return newContacts;
          });
        }

        if (JSON.stringify(groups) !== JSON.stringify(newGroups)) {
          setGroups(newGroups);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
        // Don't set error state for background refresh failures
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [contacts, groups, sortConfig.key, sortConfig.direction, searchTerm, highlightedGroupId]);

  // Logout handler
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

  // Session keepalive effect
  useEffect(() => {
    const keepAliveInterval = setInterval(async () => {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/keepalive`);
      } catch (error) {
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(keepAliveInterval);
  }, [handleLogout]);

// Search Handlers
const handleSearch = useCallback((value) => {
  setSearchTerm(value);

  // Reset group highlight when searching
  if (value.trim()) {
    setHighlightedGroupId(null);
  }

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
      (contact.company || '').toLowerCase().includes(searchValue) ||
      (contact.job_title || '').toLowerCase().includes(searchValue) ||
      (contact.notes || '').toLowerCase().includes(searchValue) ||
      contact.Groups?.some(group => group.name.toLowerCase().includes(searchValue))
    );
  });
  setFilteredContacts(filtered);
}, [contacts]);

// Sort Handlers
const handleSort = useCallback(async (key, direction) => {
  try {
    setSortLoading(true);
    const newConfig = { key, direction };

    localStorage.setItem('contactsSortConfig', JSON.stringify(newConfig));
    setSortConfig(newConfig);

    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
      params: { sort: key, direction }
    });

    const newContacts = response.data.contacts || [];
    setContacts(newContacts);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.sort((a, b) => {
          const aValue = a[key] || '';
          const bValue = b[key] || '';
          return direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        });
      }
      return newContacts;
    });
  } catch (error) {
    console.error('Error sorting contacts:', error);
    setError({ type: 'error', message: 'Failed to sort contacts' });
  } finally {
    setSortLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

// Group Management Handlers
const handleGroupSelect = useCallback(async (groupId) => {
  try {
    setLoading(true);
    setError(null);

    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`);
    setSelectedGroup(response.data);
    setShowGroupManager(true);

    if (response.data.Contacts) {
      const groupContactIds = new Set(response.data.Contacts.map(c => c.id));
      setFilteredContacts(contacts.filter(contact => groupContactIds.has(contact.id)));
    }
  } catch (error) {
    console.error('Error fetching group:', error);
    setError({ type: 'error', message: 'Failed to fetch group details' });
  } finally {
    setLoading(false);
  }
}, [contacts]);

const handleHighlightGroupContacts = useCallback((groupId) => {
  const newHighlightId = groupId === highlightedGroupId ? null : groupId;
  setHighlightedGroupId(newHighlightId);

  if (newHighlightId) {
    const group = groups.find(g => g.id === newHighlightId);
    if (group?.Contacts) {
      const groupContactIds = new Set(group.Contacts.map(c => c.id));
      setFilteredContacts(contacts.filter(contact => groupContactIds.has(contact.id)));
    }
  } else {
    if (searchTerm) {
      handleSearch(searchTerm);
    } else {
      setFilteredContacts(contacts);
    }
  }
}, [contacts, groups, highlightedGroupId, searchTerm, handleSearch]);

// Contact Selection Handlers
const handleToggleContact = useCallback((contactId) => {
  setSelectedContactIds(prev =>
    prev.includes(contactId)
      ? prev.filter(id => id !== contactId)
      : [...prev, contactId]
  );
}, []);

const handleSelectContact = useCallback((contact) => {
  setSelectedContact(contact);
}, []);

// Group Membership Handlers
const handleAddToGroup = useCallback(async (contactId, groupId) => {
  try {
    setLoading(true);
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`
    );

    const [contactResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);

    setSelectedContact(contactResponse.data);
    setGroups(groupsResponse.data.groups || []);
    setError({ type: 'success', message: 'Contact added to group successfully' });
  } catch (error) {
    console.error('Error adding to group:', error);
    setError({
      type: 'error',
      message: 'Failed to add contact to group'
    });
  } finally {
    setLoading(false);
  }
}, []);

const handleRemoveFromGroup = useCallback(async (contactId, groupId) => {
  try {
    setLoading(true);
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/contacts/${contactId}/groups/${groupId}`
    );

    const [contactResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);

    setSelectedContact(contactResponse.data);
    setGroups(groupsResponse.data.groups || []);
    setError({ type: 'success', message: 'Contact removed from group successfully' });
  } catch (error) {
    console.error('Error removing from group:', error);
    setError({
      type: 'error',
      message: 'Failed to remove contact from group'
    });
  } finally {
    setLoading(false);
  }
}, []);

// Single Contact Group Assign Handler
const handleSingleContactGroupAssign = useCallback((groupId) => {
  if (selectedContact && selectedContact.id) {
    handleAddToGroup(selectedContact.id, groupId);
    setShowSingleContactGroupAssign(false);
  }
}, [selectedContact, handleAddToGroup]);

// Single Contact Group Remove Handler
const handleSingleContactGroupRemove = useCallback((groupId) => {
  if (selectedContact && selectedContact.id) {
    handleRemoveFromGroup(selectedContact.id, groupId);
    setShowSingleContactGroupRemove(false);
  }
}, [selectedContact, handleRemoveFromGroup]);

// Panel Visibility Handlers
const toggleLeftPanel = useCallback(() => {
  setLeftPanelVisible(prev => !prev);
}, []);

const toggleRightPanel = useCallback(() => {
  setRightPanelVisible(prev => !prev);
}, []);

// Double-click handler with optimizations
const handleDoubleClickContact = useCallback((contact) => {
  if (!contact || !contact.id) return;

  setSelectedContactIds([]);
  setSelectedContact(contact);
  setIsPanelOpen(true);
  setRightPanelVisible(false);
}, []);

// Bulk Selection Handlers
const handleSelectAllContacts = useCallback(() => {
  if (selectedContactIds.length === filteredContacts.length) {
    setSelectedContactIds([]);
  } else {
    setSelectedContactIds(filteredContacts.map(contact => contact.id));
  }
}, [filteredContacts, selectedContactIds]);

const clearAllSelections = useCallback(() => {
  setSelectedContactIds([]);
  setSelectedGroups([]);
}, []);

const handleShowAllContacts = useCallback(() => {
  setHighlightedGroupId(null);
  setSearchTerm('');
  setFilteredContacts(contacts);
}, [contacts]);

const handleToggleGroup = useCallback((groupId) => {
  setSelectedGroups(prev => {
    const newSelection = prev.includes(groupId)
      ? prev.filter(id => id !== groupId)
      : [...prev, groupId];
    return newSelection;
  });
}, []);

// Contact CRUD Handlers
const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddContact = useCallback(async (newContact) => {
    if (isSubmitting) {
      console.log('Submission already in progress');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);

      // Add a flag to track if this handler has already run
      if (handleAddContact.isProcessing) {
        console.log('Already processing contact addition');
        return;
      }
      handleAddContact.isProcessing = true;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts`,
        newContact
      );

      const contactsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contacts`
      );

      setContacts(contactsResponse.data.contacts || []);
      setFilteredContacts(contactsResponse.data.contacts || []);
      setSelectedContact(response.data);
      setShowContactForm(false);
      setRightPanelVisible(true);
      setError({ type: 'success', message: 'Contact added successfully' });
    } catch (error) {
      console.error('Error adding contact:', error);
      setError({
        type: 'error',
        message: error.response?.data?.message || 'Failed to add contact'
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      handleAddContact.isProcessing = false;
    }
  }, []);



const handleUpdateContact = useCallback(async (updatedContact) => {
  try {
    setLoading(true);

    const { profile_image, ...contactData } = updatedContact;
    let profileImageUrl = updatedContact.profile_image_url;

    if (profile_image) {
      const formData = new FormData();
      formData.append('profile_image', profile_image);

      const imageResponse = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/contacts/${updatedContact.id}/profile-image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      profileImageUrl = imageResponse.data.profile_image_url;
    }

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/contacts/${updatedContact.id}`,
      {
        ...contactData,
        profile_image_url: profileImageUrl
      }
    );

    const [contactsResponse, updatedContactResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts/${updatedContact.id}`)
    ]);

    setContacts(contactsResponse.data);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.map(contact =>
          contact.id === updatedContact.id ? updatedContactResponse.data : contact
        );
      }
      return contactsResponse.data;
    });
    setSelectedContact(updatedContactResponse.data);
    setError({ type: 'success', message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    setError({
      type: 'error',
      message: error.response?.data?.message || 'Failed to update contact'
    });
  } finally {
    setLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

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
      setIsPanelOpen(false);
    }

    setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    setError({ type: 'success', message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    setError({
      type: 'error',
      message: 'Failed to delete contact'
    });
  } finally {
    setLoading(false);
  }
}, [selectedContact]);

// Email Handlers
const handleShowEmailForm = useCallback((recipients = { groups: [], contacts: [] }) => {
  setSelectedEmailRecipients(recipients);
  setShowEmailForm(true);
}, []);

const handleSendEmail = useCallback(async (emailData) => {
  try {
    setEmailLoading(true);
    setError(null);

    // TODO: Implement email functionality in backend
    // await Promise.all([
    //   emailData.groupIds.length > 0 &&
    //     axios.post(`${import.meta.env.VITE_API_URL}/api/emails/groups`, emailData),
    //   emailData.contactIds.length > 0 &&
    //     axios.post(`${import.meta.env.VITE_API_URL}/api/emails/contacts`, emailData)
    // ].filter(Boolean));

    // const emailHistoryResponse = await axios.get(
    //   `${import.meta.env.VITE_API_URL}/api/emails`
    // );
    // setEmailHistory(emailHistoryResponse.data);

    setShowEmailForm(false);
    setError({ type: 'success', message: 'Email functionality not yet implemented' });
  } catch (error) {
    console.error('Error sending email:', error);
    setError({
      type: 'error',
      message: error.response?.data?.message || 'Failed to send email'
    });
  } finally {
    setEmailLoading(false);
  }
}, []);

// Contact Panel Handlers
const handleContactPanelOpen = useCallback((contact) => {
  setSelectedContact(contact);
  setIsPanelOpen(true);
  setRightPanelVisible(false);
}, []);

const handleContactPanelClose = useCallback(() => {
  setIsPanelOpen(false);
  setRightPanelVisible(true);
}, []);



// Bulk Group Assignment Handlers
const handleBulkGroupAssign = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    setError(null);

    await Promise.all(
      contactIds.map(contactId =>
        axios.post(
          `${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`
        )
      )
    );

    const [contactsResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);

    setContacts(contactsResponse.data);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.map(contact => {
          const updatedContact = contactsResponse.data.find(c => c.id === contact.id);
          return updatedContact || contact;
        });
      }
      return contactsResponse.data;
    });
    setGroups(groupsResponse.data);
    setSelectedContactIds([]);
    setShowBulkAssign(false);
    setError({ type: 'success', message: `${contactIds.length} contacts added to group successfully` });
  } catch (error) {
    console.error('Error assigning contacts to group:', error);
    setError({ type: 'error', message: 'Failed to assign contacts to group' });
  } finally {
    setLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

const handleBulkGroupRemove = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    setError(null);

    await Promise.all(
      contactIds.map(contactId =>
        axios.delete(
          `${import.meta.env.VITE_API_URL}/api/contacts/${contactId}/groups/${groupId}`
        )
      )
    );

    const [contactsResponse, groupsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups`)
    ]);

    setContacts(contactsResponse.data);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.map(contact => {
          const updatedContact = contactsResponse.data.find(c => c.id === contact.id);
          return updatedContact || contact;
        });
      }
      return contactsResponse.data;
    });
    setGroups(groupsResponse.data);
    setSelectedContactIds([]);
    setShowBulkRemove(false);
    setError({ type: 'success', message: `${contactIds.length} contacts removed from group successfully` });
  } catch (error) {
    console.error('Error removing contacts from group:', error);
    setError({ type: 'error', message: 'Failed to remove contacts from group' });
  } finally {
    setLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

// Import/Export Handlers
const handleImportComplete = useCallback(async () => {
  try {
    setImportExportLoading(true);
    setError(null);

    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
      params: {
        sort: sortConfig.key,
        direction: sortConfig.direction
      }
    });

    setContacts(response.data);
    setFilteredContacts(response.data);
    setShowImportExport(false);
    setError({ type: 'success', message: 'Contacts imported successfully' });
  } catch (error) {
    console.error('Error refreshing contacts:', error);
    setError({ type: 'error', message: 'Failed to refresh contacts after import' });
  } finally {
    setImportExportLoading(false);
  }
}, [sortConfig.key, sortConfig.direction]);

// Group Contacts Manager Handlers
const handleBulkAddToGroup = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    setError(null);

    await Promise.all(
      contactIds.map(contactId =>
        axios.post(
          `${import.meta.env.VITE_API_URL}/api/groups/${groupId}/contacts/${contactId}`
        )
      )
    );

    const [groupResponse, contactsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`)
    ]);

    setSelectedGroup(groupResponse.data);
    setContacts(contactsResponse.data);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.map(contact => {
          const updatedContact = contactsResponse.data.find(c => c.id === contact.id);
          return updatedContact || contact;
        });
      }
      return contactsResponse.data;
    });
    setError({ type: 'success', message: 'Contacts successfully added to group' });
  } catch (error) {
    console.error('Error adding contacts to group:', error);
    setError({ type: 'error', message: 'Failed to add contacts to group' });
  } finally {
    setLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

const handleBulkRemoveFromGroup = useCallback(async (groupId, contactIds) => {
  try {
    setLoading(true);
    setError(null);

    await Promise.all(
      contactIds.map(contactId =>
        axios.delete(
          `${import.meta.env.VITE_API_URL}/api/contacts/${contactId}/groups/${groupId}`
        )
      )
    );

    const [groupResponse, contactsResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`)
    ]);

    setSelectedGroup(groupResponse.data);
    setContacts(contactsResponse.data);
    setFilteredContacts(prev => {
      if (searchTerm || highlightedGroupId) {
        return prev.map(contact => {
          const updatedContact = contactsResponse.data.find(c => c.id === contact.id);
          return updatedContact || contact;
        });
      }
      return contactsResponse.data;
    });
    setError({ type: 'success', message: 'Contacts successfully removed from group' });
  } catch (error) {
    console.error('Error removing contacts from group:', error);
    setError({ type: 'error', message: 'Failed to remove contacts from group' });
  } finally {
    setLoading(false);
  }
}, [searchTerm, highlightedGroupId]);

const handleEditGroup = useCallback(async (group) => {
  try {
    setGroupLoading(true);
    setSelectedGroupForEdit(group);
    setShowGroupEditForm(true);
  } catch (error) {
    console.error('Error editing group:', error);
    setError({ type: 'error', message: 'Failed to edit group' });
  } finally {
    setGroupLoading(false);
  }
}, []);

const handleDeleteGroup = useCallback(async (groupId) => {
  if (!window.confirm('Are you sure you want to delete this group?')) return;

  try {
    setGroupLoading(true);
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
    setGroups(response.data);
    setSelectedGroups(prev => prev.filter(id => id !== groupId));
    setError({ type: 'success', message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    setError({ type: 'error', message: 'Failed to delete group' });
  } finally {
    setGroupLoading(false);
  }
}, []);

const handleAddGroup = useCallback(async (newGroup) => {
  try {
    setGroupLoading(true);
    await axios.post(`${import.meta.env.VITE_API_URL}/api/groups`, newGroup);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
    setGroups(response.data);
    setShowGroupForm(false);
    setError({ type: 'success', message: 'Group added successfully' });
  } catch (error) {
    console.error('Error adding group:', error);
    setError({ type: 'error', message: 'Failed to add group' });
  } finally {
    setGroupLoading(false);
  }
}, []);

const handleUpdateGroup = useCallback(async (groupId, updatedGroup) => {
  try {
    setGroupLoading(true);
    await axios.put(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}`, updatedGroup);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`);
    setGroups(response.data);
    setShowGroupEditForm(false);
    setSelectedGroupForEdit(null);
    setError({ type: 'success', message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    setError({ type: 'error', message: 'Failed to update group' });
  } finally {
    setGroupLoading(false);
  }
}, []);

// Helper render methods
const renderGroupsPanel = () => (
  <div className="h-full bg-white shadow-sm border-r border-gray-200 overflow-hidden">
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center text-gray-800">
            <Users size={20} className="mr-2 text-indigo-600" />
            Groups
          </h2>
          {groupLoading && <Loader size={16} className="animate-spin text-indigo-600" />}
                </div>
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
                     bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
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
          onShowAll={handleShowAllContacts}
          isLoading={groupLoading}
          activeGroup={selectedGroup}
          highlightedGroupId={highlightedGroupId}
          showGroupEditForm={showGroupEditForm}
          selectedGroupForEdit={selectedGroupForEdit}
          setShowGroupEditForm={setShowGroupEditForm}
          setSelectedGroupForEdit={setSelectedGroupForEdit}
          handleUpdateGroup={handleUpdateGroup}
        />
      </div>
    </div>
  </div>
);

const renderMainContent = () => (
  <div className="flex-1 h-full flex flex-col">  {/* This ensures full height and column layout */}
    {/* Fixed header stays at top */}
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Contacts</h2>
        <button
          onClick={() => setShowContactForm(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          <Plus size={16} className="mr-2" />
          New Contact
        </button>
      </div>
    </div>

    {/* Selection bar also stays fixed at top */}
    {selectedContactIds.length > 0 && (
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedContactIds.length} contacts selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkAssign(true)}
              className="flex items-center px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              <Plus size={14} className="mr-1.5" />
              Add to Group
            </button>
            <button
              onClick={() => setShowBulkRemove(true)}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              <UserMinus size={14} className="mr-1.5" />
              Remove from Group
            </button>
          </div>
        </div>
      </div>
    )}

    {/* This is the scrollable container */}
    <div className="flex-1 min-h-0 overflow-auto">
      <ContactTable
        contacts={filteredContacts}
        onDelete={handleDeleteContact}
        onSelectContact={handleSelectContact}
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
);

const renderContactDetailsPanel = () => (
  <div className="h-full bg-white shadow-sm border-l border-gray-200">
    <div className="h-full">
      {selectedContact ? (
        <>
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Contact Details</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSingleContactGroupAssign(true)}
                className="flex items-center px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                <Plus size={14} className="mr-1.5" />
                Add to Group
              </button>
              {selectedContact.Groups && selectedContact.Groups.length > 0 && (
                <button
                  onClick={() => setShowSingleContactGroupRemove(true)}
                  className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                >
                  <UserMinus size={14} className="mr-1.5" />
                  Remove from Group
                </button>
              )}
            </div>
          </div>
          <ContactDetail
            contact={selectedContact}
            allGroups={groups}
            onUpdateContact={handleUpdateContact}
            onAddToGroup={handleAddToGroup}
            onRemoveFromGroup={handleRemoveFromGroup}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <span>Select a contact to view details</span>
        </div>
      )}
    </div>
  </div>
);

// Main render method
if (loading && !sortLoading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
    </div>
  );
}

return (
  <div className="flex flex-col h-screen bg-gray-50">
    {/* Fixed Navigation at top */}
    <FixedNavigation
      className="z-50"
      user={user}
      searchTerm={searchTerm}
      handleSearch={handleSearch}
      handleLogout={handleLogout}
      setShowImportExport={setShowImportExport}
      setShowEmailHistory={setShowEmailHistory}
      setShowSettings={setShowSettings}
    />

    {/* Main Container for all panels */}
    <div className="flex-1 relative">
      {/* Panels Container - with fixed top padding for navigation */}
      <div className="absolute inset-0 pt-16 flex">
        {/* Left Panel */}
        <ResizablePanel
          minWidth={280}
          maxWidth={400}
          defaultWidth={320}
          side="left"
          isVisible={leftPanelVisible}
          onToggle={toggleLeftPanel}
        >
          {renderGroupsPanel()}
        </ResizablePanel>

        {/* Central Panel - fills available space */}
        <div className="flex-1 min-w-0">
          {renderMainContent()}
        </div>

        {/* Right Panel */}
        <ResizableRightPanel
          minWidth={500}
          maxWidth={1200}
          defaultWidth={800}
          isVisible={rightPanelVisible}
          onToggle={toggleRightPanel}
        >
          {renderContactDetailsPanel()}
        </ResizableRightPanel>
      </div>
    </div>

    {/* Modals */}
    {showImportExport && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
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
      </div>
    )}

    {showContactForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <ContactForm
              onClose={() => {
                setShowContactForm(false);
                handleAddContact.isProcessing = false;
                setIsSubmitting(false);
                setLoading(false);
              }}
              onContactAdded={async (contact) => {
                if (!handleAddContact.isProcessing) {
                  await handleAddContact(contact);
                }
              }}
              isSubmitting={isSubmitting || loading || handleAddContact.isProcessing}
            />
          </div>
        </div>
      </div>
    )}

    {showGroupForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <GroupForm
              onClose={() => setShowGroupForm(false)}
              onGroupAdded={handleAddGroup}
              isLoading={groupLoading}
            />
          </div>
        </div>
      </div>
    )}

    {showGroupEditForm && selectedGroupForEdit && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <GroupEditForm
              group={selectedGroupForEdit}
              onClose={() => {
                setShowGroupEditForm(false);
                setSelectedGroupForEdit(null);
              }}
              onGroupUpdated={handleUpdateGroup}
              isLoading={groupLoading}
            />
          </div>
        </div>
      </div>
    )}

    {showBulkAssign && Array.isArray(groups) && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <BulkGroupAssign
              contactIds={selectedContactIds || []}
              groups={groups}
              onAssign={handleBulkGroupAssign}
              onClose={() => setShowBulkAssign(false)}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    )}

    {showBulkRemove && Array.isArray(groups) && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <BulkGroupRemove
              contactIds={selectedContactIds || []}
              groups={groups}
              onRemove={handleBulkGroupRemove}
              onClose={() => setShowBulkRemove(false)}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    )}

    {showSingleContactGroupAssign && selectedContact && (
      <GroupAssignModal
        groups={groups.filter(group =>
          !selectedContact.Groups ||
          !selectedContact.Groups.some(g => g.id === group.id)
        )}
        onAssign={handleSingleContactGroupAssign}
        onClose={() => setShowSingleContactGroupAssign(false)}
      />
    )}

    {showSingleContactGroupRemove && selectedContact && selectedContact.Groups && selectedContact.Groups.length > 0 && (
      <GroupRemoveModal
        groups={selectedContact.Groups}
        onRemove={handleSingleContactGroupRemove}
        onClose={() => setShowSingleContactGroupRemove(false)}
      />
    )}

    {showEmailForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
            <EmailForm
              recipients={selectedEmailRecipients}
              onClose={() => setShowEmailForm(false)}
              onSend={handleSendEmail}
              isLoading={emailLoading}
            />
          </div>
        </div>
      </div>
    )}

    {showEmailHistory && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
            <EmailHistory
              emails={emailHistory}
              onClose={() => setShowEmailHistory(false)}
            />
          </div>
        </div>
      </div>
    )}

    {showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <UserSettings
              user={user}
              onClose={() => setShowSettings(false)}
              onError={setError}
            />
          </div>
        </div>
      </div>
    )}

    {/* Notifications */}
    {error && (
      <div
        className={`fixed bottom-4 right-4 max-w-md z-[70] ${
          error.type === 'success' ? 'bg-green-50' : 'bg-red-50'
        } rounded-lg shadow-lg border-l-4 ${
          error.type === 'success' ? 'border-green-500' : 'border-red-500'
        } p-4`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {error.type === 'success' ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <X className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              error.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {error.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p className={`mt-1 text-sm ${
              error.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {error.message || error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            className={`ml-auto pl-3 ${
              error.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    )}

    {/* Loading Overlay */}
    {loading && !sortLoading && (
      <div className="fixed inset-0 bg-white bg-opacity-75 z-[80] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
          <span className="mt-4 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    )}
  </div>
);

};

export default Dashboard;
