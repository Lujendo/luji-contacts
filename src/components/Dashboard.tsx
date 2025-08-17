// Part 1: Imports and Basic Setup
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contactsApi, groupsApi } from '../api';
import { useBulkDeleteContacts } from '../hooks/useContactQueries';
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
import OptimizedContactsView from './OptimizedContactsView';
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
import AnalyticsModal from './modals/AnalyticsModal';
import GroupsPageModal from './modals/GroupsPageModal';

import GroupFormModal from './modals/GroupFormModal';
import GroupEditFormModal from './modals/GroupEditFormModal';
import EmailFormModal from './modals/EmailFormModal';
import EmailHistoryModal from './modals/EmailHistoryModal';
import BulkGroupAssignModal from './modals/BulkGroupAssignModal';
import BulkGroupRemoveModal from './modals/BulkGroupRemoveModal';
import GroupContactsManagerModal from './modals/GroupContactsManagerModal';
import DuplicateDetectionModal from './modals/DuplicateDetectionModal';
// import AppearanceSettingsModal from './modals/AppearanceSettingsModal'; // Now integrated into UserSettings

// Icon imports
import {
  Loader
} from 'lucide-react';

// Dashboard state interfaces
interface DashboardState {
  // Panel visibility
  showContactForm: boolean;
  showContactDetail: boolean;
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

  // UI state
  showMergeContacts: boolean;
  showDuplicateDetection: boolean;
  
  // Data
  contacts: Contact[];
  groups: Group[];
  
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

  // UI states
  const [showMergeContacts, setShowMergeContacts] = useState<boolean>(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState<boolean>(false);
  const [contactsToMerge, setContactsToMerge] = useState<Contact[]>([]);
  const [userSettingsTab, setUserSettingsTab] = useState<'profile' | 'email' | 'subscription' | 'security' | 'appearance'>('profile');

  // New modal states
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [showGroupsPage, setShowGroupsPage] = useState<boolean>(false);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);

  // Use appearance context
  const { settings: appearanceSettings, updateSettings: updateAppearanceSettings } = useAppearance();

  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Selection and UI states
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [highlightedGroupId, setHighlightedGroupId] = useState<number | null>(null);
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

  // Note: Filtering is now handled server-side by the OptimizedContactsView component
  // This local filtering logic has been removed in favor of server-side filtering for better performance

  // Event handlers
  const handleContactSelect: ContactEventHandler = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetail(true);
  }, []);

  const handleGroupSelect: GroupEventHandler = useCallback((group: Group) => {
    console.log('handleGroupSelect called with group:', group);
    if (!group) {
      console.error('handleGroupSelect: group is null or undefined');
      return;
    }
    setSelectedGroup(group);
    setShowGroupContactsManager(true);
  }, []);

  const handleGroupHighlight = useCallback((groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // If clicking the same group that's already active, toggle it off
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        setHighlightedGroupId(null);
        console.log('Clearing group filter');
      } else {
        setActiveGroup(group);
        setHighlightedGroupId(groupId);
        console.log('Filtering by group:', group.name, `(${group.contact_count || 0} contacts)`);
      }
    }
  }, [groups, activeGroup]);

  const handleShowAllContacts = useCallback(() => {
    setActiveGroup(null);
    setHighlightedGroupId(null);
    console.log('Showing all contacts');
  }, []);



  const handleGroupDelete = useCallback(async (groupId: number) => {
    try {
      await groupsApi.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));

      // Clear active group if it was deleted
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        setHighlightedGroupId(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }, [activeGroup]);

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
      console.log('Dashboard: Deleting contact with ID:', contactId);
      await contactsApi.deleteContact(contactId);
      console.log('Dashboard: Contact deleted successfully:', contactId);

      // Remove from contacts list
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setSelectedContact(null);
      setShowContactDetail(false);
    } catch (error) {
      console.error('Error deleting contact:', error);

      // If contact doesn't exist (404), remove it from the list anyway
      if (error instanceof Error && error.message.includes('Contact not found')) {
        console.log('Contact not found in database, removing from local list');
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setSelectedContact(null);
        setShowContactDetail(false);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to delete contact');
      }
    }
  }, []);

  const handleContactCreate = useCallback(async (contactData: any): Promise<void> => {
    try {
      console.log('Dashboard: Creating contact with data:', contactData);
      const newContact = await contactsApi.createContact(contactData);
      console.log('Dashboard: Contact created successfully:', newContact.id);

      // Update contacts list
      setContacts(prev => {
        // Check if contact already exists to prevent duplicates
        const exists = prev.some(c => c.id === newContact.id);
        if (exists) {
          console.log('Contact already exists in list, not adding duplicate');
          return prev;
        }
        return [...prev, newContact];
      });

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
    setSelectedContacts(selected ? contacts.map(c => c.id) : []);
  }, [contacts]);

  // React Query hook for bulk deletion
  const bulkDeleteMutation = useBulkDeleteContacts();

  const handleBulkDelete = useCallback((): void => {
    if (selectedContacts.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    // Use React Query mutation for optimistic updates and error handling
    bulkDeleteMutation.mutate(selectedContacts, {
      onSuccess: () => {
        // Remove deleted contacts from local state
        setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
        // Clear selection
        setSelectedContacts([]);
      },
      onError: (error) => {
        console.error('Bulk delete error:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete contacts');
      }
    });
  }, [selectedContacts, bulkDeleteMutation]);

  // Panel management functions
  const closeAllPanels = useCallback((): void => {
    setShowContactForm(false);
    setShowContactDetail(false);
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
    setShowAnalytics(false);
    setShowGroupsPage(false);
    setUserSettingsTab('profile');
  }, []);

  const openPanel = useCallback((panelName: string): void => {
    closeAllPanels();
    
    switch (panelName) {
      case 'contactForm':
        setShowContactForm(true);
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
        setShowUserSettings(true);
        setUserSettingsTab('appearance');
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
      case 'analytics':
        setShowAnalytics(true);
        break;
      case 'groupsPage':
        setShowGroupsPage(true);
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

      {/* Enhanced Fixed Navigation Sidebar with Groups */}
      <FixedNavigation
        user={user}
        onLogout={handleLogout}
        onOpenPanel={openPanel}
        groups={groups}
        activeGroup={activeGroup}
        onGroupClick={handleGroupHighlight}
        onGroupEdit={(group) => {
          setSelectedGroup(group);
          setShowGroupContactsManager(true);
        }}
        onGroupDelete={handleGroupDelete}
        onAddNewGroup={() => setShowGroupForm(true)}
        onShowAllContacts={handleShowAllContacts}
        selectedContactsCount={selectedContacts.length}
        onBulkDelete={handleBulkDelete}
        onSidebarToggle={setSidebarExpanded}
        isExpanded={sidebarExpanded}
      />

      {/* Main Content - Takes remaining space, offset by enhanced nav */}
      <div className={`flex flex-1 min-h-0 overflow-hidden transition-all duration-300 ${
        sidebarExpanded ? 'ml-64' : 'ml-16'
      }`}>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
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
              onManageGroups={() => {/* Groups now managed via sidebar */}}
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
                groupId={activeGroup?.id}
                activeGroupName={activeGroup?.name}
                onClearGroupFilter={handleShowAllContacts}
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
          : contacts
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
        onClose={() => {
          setShowUserSettings(false);
          setUserSettingsTab('profile');
        }}
        initialTab={userSettingsTab}
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
        selectedGroup={selectedGroup}
        contacts={contacts}
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

      {/* Appearance Settings now integrated into User Settings Modal */}

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
        onClose={() => {
          setShowContactForm(false);
          setSelectedContact(null); // Clear selected contact when closing
        }}
        onContactCreated={handleContactCreate}
        onContactUpdated={(updatedContact) => {
          // Update the contact in the list
          setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
          setSelectedContact(null);
        }}
        groups={groups}
        contact={selectedContact} // Pass the selected contact for editing
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

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          contacts={contacts}
          groups={groups}
        />
      )}

      {/* Groups Page Modal */}
      {showGroupsPage && (
        <GroupsPageModal
          isOpen={showGroupsPage}
          onClose={() => setShowGroupsPage(false)}
          groups={groups}
          contacts={contacts}
          onGroupEdit={(group) => {
            setSelectedGroup(group);
            setShowGroupContactsManager(true);
          }}
          onGroupDelete={handleGroupDelete}
          onAddNewGroup={() => setShowGroupForm(true)}
          onGroupClick={handleGroupHighlight}
          activeGroup={activeGroup}
        />
      )}
    </div>
  );
};

export default Dashboard;
