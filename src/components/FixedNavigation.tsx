import React from 'react';
import { User } from '../types';
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
  Palette
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
  selectedContactsCount?: number;
}

const FixedNavigation: React.FC<FixedNavigationProps> = ({ 
  user, 
  onLogout, 
  onOpenPanel,
  selectedContactsCount = 0
}) => {
  return (
    <nav className="fixed top-0 left-0 bottom-0 w-16 bg-white shadow-lg border-r border-gray-200 z-40 flex flex-col">
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Mail className="h-8 w-8 text-indigo-600" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-2">
        {/* Add Contact */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('contactForm')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Add Contact
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* Groups */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('groupList')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Users className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Groups
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* Email */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('emailForm')}
            className="relative w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Send className="h-6 w-6" />
            {selectedContactsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedContactsCount > 99 ? '99+' : selectedContactsCount}
              </span>
            )}
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Send Email
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

        {/* Email History */}
        <div className="relative group">
          <button
            onClick={() => onOpenPanel('emailHistory')}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <History className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
            Email History
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>

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
