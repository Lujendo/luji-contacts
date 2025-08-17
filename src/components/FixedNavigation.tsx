import React, { useState } from 'react';
import { User, Group } from '../types';
import {
  Mail,
  LogOut,
  ArrowUpDown,
  History,
  Settings,
  Users,
  Plus,
  Send,
  Search,
  Palette,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Edit2,
  X,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import ProfileImage from './ui/ProfileImage';

// Helper function to get user initials
const getUserInitials = (user: User | null): string => {
  if (!user) return 'U';

  const username = user.username?.trim() || '';
  const email = user.email?.trim() || '';

  if (username) {
    const parts = username.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username[0].toUpperCase();
  } else if (email) {
    return email[0].toUpperCase();
  }
  return 'U';
};

// Component props interface
interface FixedNavigationProps {
  user: User | null;
  onLogout: () => void;
  onOpenPanel: (panelName: string) => void;
  groups?: Group[];
  activeGroup?: Group | null;
  onGroupClick?: (groupId: number) => void;
  onGroupEdit?: (group: Group) => void;
  onGroupDelete?: (groupId: number) => void;
  onAddNewGroup?: () => void;
  onShowAllContacts?: () => void;
  selectedContactsCount?: number;
  onBulkDelete?: () => void;
  onSidebarToggle?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

const FixedNavigation: React.FC<FixedNavigationProps> = ({
  user,
  onLogout,
  onOpenPanel,
  groups = [],
  activeGroup,
  onGroupClick,
  onGroupEdit,
  onGroupDelete,
  onAddNewGroup,
  onShowAllContacts,
  selectedContactsCount = 0,
  onBulkDelete,
  onSidebarToggle,
  isExpanded: externalExpanded
}) => {
  const [isExpanded, setIsExpanded] = useState(externalExpanded ?? true);
  const [showGroups, setShowGroups] = useState(true);

  // Sync with external state if provided
  React.useEffect(() => {
    if (externalExpanded !== undefined) {
      setIsExpanded(externalExpanded);
    }
  }, [externalExpanded]);

  // Handle sidebar toggle
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onSidebarToggle?.(newExpanded);
  };
  return (
    <nav className={`fixed top-0 left-0 bottom-0 bg-white shadow-lg border-r border-gray-200 z-40 flex flex-col transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Logo/Brand */}
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
        <div className="flex items-center space-x-3">
          <Mail className="h-8 w-8 text-indigo-600 flex-shrink-0" />
          {isExpanded && (
            <span className="text-xl font-bold text-gray-900">Contacts</span>
          )}
        </div>
        <button
          onClick={handleToggle}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col py-4 space-y-2 overflow-y-auto">
        {/* Add Contact */}
        <div className="relative group px-2">
          <button
            onClick={() => onOpenPanel('contactForm')}
            className={`w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-start' : 'h-12 justify-center'
            }`}
          >
            <Plus className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium">Add Contact</span>}
          </button>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Add Contact
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Groups Section */}
        <div className="px-2">
          <button
            onClick={() => setShowGroups(!showGroups)}
            className={`w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-between' : 'h-12 justify-center'
            } ${showGroups ? 'text-indigo-600 bg-indigo-50' : ''}`}
          >
            <div className="flex items-center">
              <Users className="h-6 w-6 flex-shrink-0" />
              {isExpanded && <span className="ml-3 text-sm font-medium">Groups</span>}
            </div>
            {isExpanded && (
              <ChevronDown className={`h-4 w-4 transition-transform ${showGroups ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Groups List - Only show when expanded and groups section is open */}
          {isExpanded && showGroups && (
            <div className="mt-2 ml-4 space-y-1">
              {/* All Contacts */}
              <button
                onClick={onShowAllContacts}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  !activeGroup
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                All Contacts
              </button>

              {/* Individual Groups */}
              {groups.map((group) => (
                <div key={group.id} className="flex items-center group">
                  <button
                    onClick={() => onGroupClick?.(group.id)}
                    className={`flex-1 flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeGroup?.id === group.id
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-4 h-4 mr-2 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{group.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{group.contact_count || 0}</span>
                  </button>
                  <button
                    onClick={() => onGroupEdit?.(group)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                    title="Edit group"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add New Group */}
              <button
                onClick={onAddNewGroup}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Group
              </button>

              {/* Manage Groups Page */}
              <button
                onClick={() => onOpenPanel('groupsPage')}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Groups
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="relative group px-2">
          <button
            onClick={() => onOpenPanel('emailForm')}
            className={`relative w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-start' : 'h-12 justify-center'
            }`}
          >
            <Send className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium">Send Email</span>}
            {selectedContactsCount > 0 && (
              <span className={`bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                isExpanded ? 'ml-auto' : 'absolute -top-1 -right-1'
              }`}>
                {selectedContactsCount > 99 ? '99+' : selectedContactsCount}
              </span>
            )}
          </button>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Send Email
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Email History */}
        <div className="relative group px-2">
          <button
            onClick={() => onOpenPanel('emailHistory')}
            className={`w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-start' : 'h-12 justify-center'
            }`}
          >
            <History className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium">Email History</span>}
          </button>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Email History
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Import/Export */}
        <div className="relative group px-2">
          <button
            onClick={() => onOpenPanel('importExport')}
            className={`w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-start' : 'h-12 justify-center'
            }`}
          >
            <Upload className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium">Import/Export</span>}
          </button>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Import/Export
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="relative group px-2">
          <button
            onClick={() => onOpenPanel('analytics')}
            className={`w-full flex items-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ${
              isExpanded ? 'px-3 py-2 justify-start' : 'h-12 justify-center'
            }`}
          >
            <ArrowUpDown className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium">Analytics</span>}
          </button>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Analytics
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Bulk Delete - Only show when contacts are selected */}
        {selectedContactsCount > 0 && onBulkDelete && (
          <div className="group relative">
            <button
              onClick={onBulkDelete}
              className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedContactsCount > 99 ? '99+' : selectedContactsCount}
              </span>
            </button>
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Delete {selectedContactsCount} Contact{selectedContactsCount > 1 ? 's' : ''}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        )}

        {/* Find Duplicates */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('duplicateDetection')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <Search className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Find Duplicates
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* Import/Export */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('importExport')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <ArrowUpDown className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Import/Export
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </div>

      {/* User Menu */}
      <div className="border-t border-gray-200 p-2">
        {/* Settings */}
        <div className="relative group mb-2">
          <button
            onClick={() => onOpenPanel('userSettings')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Settings className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Settings
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('appearanceSettings')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <Palette className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Appearance
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* User Profile */}
        <div className="relative group">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title={user?.username || 'User Profile'}
          >
            <ProfileImage
              src={user?.profile_image_url}
              alt={user?.username || 'User Profile'}
              size="sm"
              fallbackInitials={getUserInitials(user)}
            />
          </button>

          {/* User dropdown menu */}
          <div className="absolute bottom-0 left-16 mb-0 ml-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'No email'}
              </p>
            </div>
            
            <button
              onClick={() => onOpenPanel('userSettings')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default FixedNavigation;
