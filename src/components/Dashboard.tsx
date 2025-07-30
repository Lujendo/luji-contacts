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
import OptimizedContactsView from './OptimizedContactsView';
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
import MergeContactsModal from './MergeContactsModal';
// import DuplicateDetectionPanel from './DuplicateDetectionPanel'; // Now using modal
// import ResizableRightPanel from './ResizableRightPanel'; // Replaced with modals
import ApplicationMenuBar from './ApplicationMenuBar';
import ContactDetailPanel from './ContactDetailPanel';
import GroupAssignModal from './GroupAssignModal';
import GroupRemoveModal from './GroupRemoveModal';
import Header from './Header';
import Footer from './Footer';
import { useAppearance } from '../contexts/AppearanceContext';

// Modal imports
import UserSettingsModal from './modals/UserSettingsModal';
import GroupListModal from './modals/GroupListModal';
import GroupFormModal from './modals/GroupFormModal';
import GroupEditFormModal from './modals/GroupEditFormModal';
import EmailFormModal from './modals/EmailFormModal';
import EmailHistoryModal from './modals/EmailHistoryModal';
import BulkGroupAssignModal from './modals/BulkGroupAssignModal';
import BulkGroupRemoveModal from './modals/BulkGroupRemoveModal';
import GroupContactsManagerModal from './modals/GroupContactsManagerModal';
import DuplicateDetectionModal from './modals/DuplicateDetectionModal';
import AppearanceSettingsModal from './modals/AppearanceSettingsModal';

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
  showMergeContacts: boolean;
  showDuplicateDetection: boolean;
  
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
  const [showMergeContacts, setShowMergeContacts] = useState<boolean>(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState<boolean>(false);
  const [contactsToMerge, setContactsToMerge] = useState<Contact[]>([]);
  const [showAppearanceSettings, setShowAppearanceSettings] = useState<boolean>(false);

  // Use appearance context
  const { settings: appearanceSettings, updateSettings: updateAppearanceSettings } = useAppearance();

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
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');

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

    // Apply comprehensive search filter across ALL fields
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => {
        // Helper function to safely check if a field contains the search term
        const contains = (field?: string) => field?.toLowerCase().includes(searchLower) || false;

        return (
          // Core identity fields
          contains(contact.first_name) ||
          contains(contact.last_name) ||
          contains(contact.nickname) ||
          contains(`${contact.first_name || ''} ${contact.last_name || ''}`.trim()) ||

          // Contact information
          contains(contact.email) ||
          contact.phone?.includes(searchTerm) ||

          // Professional information
          contains(contact.company) ||
          contains(contact.job_title) ||
          contains(contact.role) ||

          // Address fields
          contains(contact.address_street) ||
          contains(contact.address_city) ||
          contains(contact.address_state) ||
          contains(contact.address_zip) ||
          contains(contact.address_country) ||

          // Social media and web presence
          contains(contact.website) ||
          contains(contact.facebook) ||
          contains(contact.twitter) ||
          contains(contact.linkedin) ||
          contains(contact.instagram) ||
          contains(contact.youtube) ||
          contains(contact.tiktok) ||
          contains(contact.snapchat) ||
          contains(contact.discord) ||
          contains(contact.spotify) ||
          contains(contact.apple_music) ||
          contains(contact.github) ||
          contains(contact.behance) ||
          contains(contact.dribbble) ||

          // Notes field (most important for comprehensive search)
          contains(contact.notes) ||

          // Birthday field
          contains(contact.birthday)
        );
      });
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
    setShowMergeContacts(false);
    setShowDuplicateDetection(false);
    setShowAppearanceSettings(false);
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
      case 'duplicateDetection':
        setShowDuplicateDetection(true);
        break;
      case 'appearanceSettings':
        setShowAppearanceSettings(true);
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
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      {appearanceSettings.showHeader && (
        <Header
          user={user}
          onSettingsClick={() => openPanel('appearanceSettings')}
          onProfileClick={() => openPanel('userSettings')}
        />
      )}

      {/* Main Content with Sidebar - Takes remaining space */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Fixed Navigation Sidebar */}
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
            {/* Application Menu Bar */}
            <ApplicationMenuBar
              onNewContact={() => setShowContactForm(true)}
              onFindDuplicates={() => setShowDuplicateDetection(true)}
              onMergeSelected={() => setShowMergeContacts(true)}
              onImport={() => openPanel('importExport')}
              onExport={() => openPanel('importExport')}
              onManageGroups={() => openPanel('groupContactsManager')}
              onSettings={() => openPanel('userSettings')}
              onSortChange={(field, direction) => setSortConfig({ field, direction })}
              onViewModeChange={setViewMode}
              onFilterChange={() => {/* TODO: Implement filters */}}
              onSearchChange={setSearchTerm}
              selectedContactsCount={selectedContacts.length}
              currentSort={sortConfig}
              currentViewMode={viewMode}
              totalContacts={contacts.length}
              searchQuery={searchTerm}
            />

            {/* Optimized Contact View with Infinite Scrolling */}
            <div className="flex-1 overflow-hidden">
              <OptimizedContactsView
                onContactSelect={handleContactSelect}
                onContactSelection={handleContactSelection}
                onBulkSelection={handleBulkSelection}
                selectedContacts={selectedContacts}
                enableInfiniteScrolling={true}
                enableCache={true}
                showCacheStats={process.env.NODE_ENV === 'development'}
                searchQuery={searchTerm}
                onEditContact={(contact) => {
                  setSelectedContact(contact);
                  setShowContactForm(true);
                }}
                onSendEmail={(contact) => {
                  setSelectedContact(contact);
                  openPanel('emailForm');
                }}
                onAddToGroup={(contact) => {
                  setSelectedContacts([contact.id]);
                  openPanel('bulkGroupAssign');
                }}
                onViewDetails={(contact) => {
                  setSelectedContact(contact);
                  // TODO: Implement contact details view
                }}
                className="h-full"
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

      {/* Utility Modals - Now using beautiful modal dialogs instead of right panel */}

      {/* Group Management Modals */}
      <GroupListModal
        isOpen={showGroupList}
        onClose={() => setShowGroupList(false)}
        groups={groups}
        onGroupSelect={handleGroupSelect}
        onGroupEdit={(group) => {
          setSelectedGroup(group);
          setShowGroupEditForm(true);
          setShowGroupList(false);
        }}
      />

      <GroupFormModal
        isOpen={showGroupForm}
        onClose={() => setShowGroupForm(false)}
        onGroupCreated={handleGroupCreate}
      />

      {selectedGroup && (
        <GroupEditFormModal
          isOpen={showGroupEditForm}
          onClose={() => setShowGroupEditForm(false)}
          group={selectedGroup}
          onGroupUpdated={(updatedGroup) => {
            setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
            setSelectedGroup(updatedGroup);
          }}
        />
      )}

      {/* Email Modals */}
      <EmailFormModal
        isOpen={showEmailForm}
        onClose={() => setShowEmailForm(false)}
        contacts={selectedContacts.length > 0
          ? contacts.filter(c => selectedContacts.includes(c.id))
          : filteredContacts
        }
        selectedContact={selectedContact}
      />

      <EmailHistoryModal
        isOpen={showEmailHistory}
        onClose={() => setShowEmailHistory(false)}
      />


      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />

      {/* Bulk Operations Modals */}
      <BulkGroupAssignModal
        isOpen={showBulkGroupAssign}
        onClose={() => setShowBulkGroupAssign(false)}
        contactIds={selectedContacts}
        groups={groups}
        onAssignmentComplete={() => {
          // Refresh contacts to show updated group assignments
          contactsApi.getContactsLegacy().then(setContacts);
          setSelectedContacts([]);
          setShowBulkGroupAssign(false);
        }}
      />

      <BulkGroupRemoveModal
        isOpen={showBulkGroupRemove}
        onClose={() => setShowBulkGroupRemove(false)}
        contactIds={selectedContacts}
        groups={groups}
        onRemovalComplete={() => {
          // Refresh contacts to show updated group assignments
          contactsApi.getContactsLegacy().then(setContacts);
          setSelectedContacts([]);
          setShowBulkGroupRemove(false);
        }}
      />

      {/* Group Contacts Manager Modal */}
      <GroupContactsManagerModal
        isOpen={showGroupContactsManager}
        onClose={() => setShowGroupContactsManager(false)}
        groups={groups}
      />

      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateDetection}
        onClose={() => setShowDuplicateDetection(false)}
        contacts={contacts}
        onMergeContacts={(contactsToMerge) => {
          setContactsToMerge(contactsToMerge);
          setShowDuplicateDetection(false);
          setShowMergeContacts(true);
        }}
      />

      {/* Appearance Settings Modal */}
      <AppearanceSettingsModal
        isOpen={showAppearanceSettings}
        onClose={() => setShowAppearanceSettings(false)}
        onSettingsChange={updateAppearanceSettings}
      />

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

      {/* Other Modals */}
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
      </div>

      {/* Footer - Always at bottom */}
      {appearanceSettings.showFooter && (
        <Footer
          onPrivacyClick={() => {/* TODO: Handle privacy page */}}
          onTermsClick={() => {/* TODO: Handle terms page */}}
          onAboutClick={() => {/* TODO: Handle about page */}}
          onSupportClick={() => {/* TODO: Handle support page */}}
        />
      )}

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onContactCreated={handleContactCreate}
        groups={groups}
      />

      {/* Merge Contacts Modal */}
      {showMergeContacts && (
        <MergeContactsModal
          contacts={contactsToMerge.length > 0 ? contactsToMerge : contacts.filter(c => selectedContacts.includes(c.id))}
          onClose={() => {
            setShowMergeContacts(false);
            setContactsToMerge([]);
          }}
          onMergeComplete={() => {
            // Refresh contacts after merge
            contactsApi.getContactsLegacy().then(setContacts);
            setSelectedContacts([]);
            setContactsToMerge([]);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
