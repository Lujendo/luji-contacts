// Part 1: Imports and Basic Setup
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactsApi, groupsApi } from '../api';
import {
  Contact,
  Group,
  SortConfig,
  ContactEventHandler,
  GroupEventHandler
} from '../types';

// Component imports
import FixedNavigation from './FixedNavigation';
import ContactFormModal from './ContactFormModal';
import ContactTable from './ContactTable';
import GroupList from './GroupList';
import GroupForm from './GroupForm';
import GroupEditForm from './GroupEditForm';
import EmailForm from './EmailForm';
import EmailHistory from './EmailHistory';
import ImportModal from './ImportModal';
import UserSettings from './UserSettings';
import BulkGroupAssign from './BulkGroupAssign';
import BulkGroupRemove from './BulkGroupRemove';
import GroupContactsManager from './GroupContactsManager';
import ResizableRightPanel from './ResizableRightPanel';
import ContactDetailPanel from './ContactDetailPanel';
import GroupAssignModal from './GroupAssignModal';
import GroupRemoveModal from './GroupRemoveModal';

// Icon imports
import {
  Search,
  X,
  ArrowUpDown,
  Loader
} from 'lucide-react';

// Dashboard state interfaces
interface DashboardState {
  // Panel visibility
  showContactForm: boolean;
  showContactDetail: boolean;
  showGroupList: boolean;
  showGroupForm: boolean;
  showGroupEditForm: boolean;
  showEmailForm: boolean;
  showEmailHistory: boolean;
  showImportModal: boolean;
  showUserSettings: boolean;
  showBulkGroupAssign: boolean;
  showBulkGroupRemove: boolean;
  showGroupContactsManager: boolean;
  showGroupAssignModal: boolean;
  showGroupRemoveModal: boolean;
  
  // Data
  contacts: Contact[];
  groups: Group[];
  filteredContacts: Contact[];
  
  // UI state
  selectedContact: Contact | null;
  selectedGroup: Group | null;
  selectedContacts: number[];
  searchTerm: string;
  sortConfig: SortConfig;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Panel visibility states
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [showContactDetail, setShowContactDetail] = useState<boolean>(false);
  const [showGroupList, setShowGroupList] = useState<boolean>(false);
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [showGroupEditForm, setShowGroupEditForm] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [showEmailHistory, setShowEmailHistory] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
  const [showBulkGroupAssign, setShowBulkGroupAssign] = useState<boolean>(false);
  const [showBulkGroupRemove, setShowBulkGroupRemove] = useState<boolean>(false);
  const [showGroupContactsManager, setShowGroupContactsManager] = useState<boolean>(false);
  const [showGroupAssignModal, setShowGroupAssignModal] = useState<boolean>(false);
  const [showGroupRemoveModal, setShowGroupRemoveModal] = useState<boolean>(false);

  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  
  // Selection and UI states
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'first_name', direction: 'asc' });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [contactsData, groupsData] = await Promise.all([
          contactsApi.getContactsLegacy(),
          groupsApi.getGroups()
        ]);

        setContacts(contactsData);
        setGroups(groupsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Filter and sort contacts
  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.first_name?.toLowerCase().includes(searchLower) ||
        contact.last_name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field as keyof Contact] || '';
      const bValue = b[sortConfig.field as keyof Contact] || '';
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, sortConfig]);

  // Event handlers
  const handleContactSelect: ContactEventHandler = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetail(true);
  }, []);

  const handleGroupSelect: GroupEventHandler = useCallback((group: Group) => {
    setSelectedGroup(group);
    setShowGroupContactsManager(true);
  }, []);

  const handleContactUpdate = useCallback(async (updatedContact: Contact): Promise<void> => {
    try {
      const updated = await contactsApi.updateContact(updatedContact.id, updatedContact);
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedContact(updated);
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to update contact');
    }
  }, []);

  const handleContactDelete = useCallback(async (contactId: number): Promise<void> => {
    try {
      await contactsApi.deleteContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setSelectedContact(null);
      setShowContactDetail(false);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete contact');
    }
  }, []);

  const handleContactCreate = useCallback(async (contactData: Contact): Promise<void> => {
    try {
      const newContact = await contactsApi.createContact(contactData);
      setContacts(prev => [...prev, newContact]);
      setShowContactForm(false);
    } catch (error) {
      console.error('Error creating contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to create contact');
    }
  }, []);

  const handleGroupCreate = useCallback(async (groupData: Group): Promise<void> => {
    try {
      const newGroup = await groupsApi.createGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      setShowGroupForm(false);
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error instanceof Error ? error.message : 'Failed to create group');
    }
  }, []);

  const handleLogout = useCallback((): void => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((field: string): void => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleContactSelection = useCallback((contactId: number, selected: boolean): void => {
    setSelectedContacts(prev => 
      selected 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  }, []);

  const handleBulkSelection = useCallback((selected: boolean): void => {
    setSelectedContacts(selected ? filteredContacts.map(c => c.id) : []);
  }, [filteredContacts]);

  // Panel management functions
  const closeAllPanels = useCallback((): void => {
    setShowContactForm(false);
    setShowContactDetail(false);
    setShowGroupList(false);
    setShowGroupForm(false);
    setShowGroupEditForm(false);
    setShowEmailForm(false);
    setShowEmailHistory(false);
    setShowImportModal(false);
    setShowUserSettings(false);
    setShowBulkGroupAssign(false);
    setShowBulkGroupRemove(false);
    setShowGroupContactsManager(false);
    setShowGroupAssignModal(false);
    setShowGroupRemoveModal(false);
  }, []);

  const openPanel = useCallback((panelName: string): void => {
    closeAllPanels();
    
    switch (panelName) {
      case 'contactForm':
        setShowContactForm(true);
        break;
      case 'groupList':
        setShowGroupList(true);
        break;
      case 'groupForm':
        setShowGroupForm(true);
        break;
      case 'emailForm':
        setShowEmailForm(true);
        break;
      case 'emailHistory':
        setShowEmailHistory(true);
        break;
      case 'importExport':
        setShowImportModal(true);
        break;
      case 'userSettings':
        setShowUserSettings(true);
        break;
      case 'bulkGroupAssign':
        setShowBulkGroupAssign(true);
        break;
      case 'bulkGroupRemove':
        setShowBulkGroupRemove(true);
        break;
      default:
        break;
    }
  }, [closeAllPanels]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Fixed Navigation */}
      <FixedNavigation
        user={user}
        onLogout={handleLogout}
        onOpenPanel={openPanel}
        selectedContactsCount={selectedContacts.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden ml-16">
        {/* Main Contact List */}
        <div className="h-full bg-white">
          <div className="h-full flex flex-col">
            {/* Search and Controls */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSortChange('first_name')}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Sort</span>
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedContacts.length > 0 && (
                <div className="mt-3 flex items-center justify-between bg-indigo-50 p-3 rounded-md">
                  <span className="text-sm text-indigo-700">
                    {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openPanel('bulkGroupAssign')}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Assign to Group
                    </button>
                    <button
                      onClick={() => openPanel('bulkGroupRemove')}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Remove from Group
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Table */}
            <div className="flex-1 overflow-auto">
              <ContactTable
                contacts={filteredContacts}
                selectedContacts={selectedContacts}
                onSelectContact={handleContactSelect}
                onContactSelection={handleContactSelection}
                onBulkSelection={handleBulkSelection}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {showContactDetail && selectedContact && (
        <ContactDetailPanel
          contact={selectedContact}
          groups={groups}
          onClose={() => setShowContactDetail(false)}
          onContactUpdate={handleContactUpdate}
          onContactDelete={handleContactDelete}
        />
      )}

      {/* Right Panel - Forms Only (No Contact Details) */}
      <ResizableRightPanel isVisible={
        showGroupList ||
        showGroupForm || showGroupEditForm || showEmailForm ||
        showEmailHistory || showUserSettings ||
        showBulkGroupAssign || showBulkGroupRemove || showGroupContactsManager
      }>

          {showGroupList && (
            <GroupList
              groups={groups}
              onClose={() => setShowGroupList(false)}
              onGroupSelect={handleGroupSelect}
              onGroupEdit={(group) => {
                setSelectedGroup(group);
                setShowGroupEditForm(true);
                setShowGroupList(false);
              }}
            />
          )}

          {showGroupForm && (
            <GroupForm
              onClose={() => setShowGroupForm(false)}
              onGroupCreated={handleGroupCreate}
            />
          )}

          {showGroupEditForm && selectedGroup && (
            <GroupEditForm
              group={selectedGroup}
              onClose={() => setShowGroupEditForm(false)}
              onGroupUpdated={(updatedGroup) => {
                setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
                setSelectedGroup(updatedGroup);
              }}
            />
          )}

          {showEmailForm && (
            <EmailForm
              contacts={selectedContacts.length > 0
                ? contacts.filter(c => selectedContacts.includes(c.id))
                : filteredContacts
              }
              onClose={() => setShowEmailForm(false)}
            />
          )}

          {showEmailHistory && (
            <EmailHistory
              onClose={() => setShowEmailHistory(false)}
            />
          )}



          {showUserSettings && (
            <UserSettings
              onClose={() => setShowUserSettings(false)}
            />
          )}

          {showBulkGroupAssign && (
            <BulkGroupAssign
              contactIds={selectedContacts}
              groups={groups}
              onClose={() => setShowBulkGroupAssign(false)}
              onAssignmentComplete={() => {
                // Refresh contacts to show updated group assignments
                contactsApi.getContactsLegacy().then(setContacts);
                setSelectedContacts([]);
              }}
            />
          )}

          {showBulkGroupRemove && (
            <BulkGroupRemove
              contactIds={selectedContacts}
              groups={groups}
              onClose={() => setShowBulkGroupRemove(false)}
              onRemovalComplete={() => {
                // Refresh contacts to show updated group assignments
                contactsApi.getContactsLegacy().then(setContacts);
                setSelectedContacts([]);
              }}
            />
          )}

          {showGroupContactsManager && selectedGroup && (
            <GroupContactsManager
              group={selectedGroup}
              contacts={contacts}
              onClose={() => setShowGroupContactsManager(false)}
              onGroupUpdated={(updatedGroup) => {
                setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
                setSelectedGroup(updatedGroup);
              }}
            />
          )}
        </ResizableRightPanel>

      {/* Modals */}
      {showGroupAssignModal && (
        <GroupAssignModal
          contactIds={selectedContacts}
          groups={groups}
          onClose={() => setShowGroupAssignModal(false)}
          onAssignmentComplete={() => {
            contactsApi.getContactsLegacy().then(setContacts);
            setSelectedContacts([]);
            setShowGroupAssignModal(false);
          }}
        />
      )}

      {showGroupRemoveModal && (
        <GroupRemoveModal
          contactIds={selectedContacts}
          groups={groups}
          onRemove={async (groupId: number, contactIds?: number[]) => {
            // Handle group removal logic here
            console.log('Remove contacts from group:', groupId, contactIds);
          }}
          onClose={() => setShowGroupRemoveModal(false)}
          onRemovalComplete={() => {
            contactsApi.getContactsLegacy().then(setContacts);
            setSelectedContacts([]);
            setShowGroupRemoveModal(false);
          }}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onContactsImported={async (importedContacts) => {
          // Refresh the entire contact list from server to avoid duplication issues
          try {
            // Small delay to ensure all imports are processed
            await new Promise(resolve => setTimeout(resolve, 500));
            const refreshedContacts = await contactsApi.getContactsLegacy();
            setContacts(refreshedContacts);
            console.log(`Successfully refreshed contact list after importing ${importedContacts.length} contacts`);
          } catch (error) {
            console.error('Error refreshing contacts after import:', error);
            // Fallback to the previous approach if refresh fails
            setContacts(prev => [...prev, ...importedContacts]);
          }
        }}
      />

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onContactCreated={handleContactCreate}
        groups={groups}
      />
    </div>
  );
};

export default Dashboard;
