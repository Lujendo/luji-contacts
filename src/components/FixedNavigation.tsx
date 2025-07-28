import React from 'react';
import { User } from '../types';
import {
  Mail,
  UserCircle,
  LogOut,
  ArrowUpDown,
  History,
  Settings,
  Users,
  Plus,
  Send
} from 'lucide-react';

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
        <button
          onClick={() => onOpenPanel('contactForm')}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Add Contact"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Groups */}
        <button
          onClick={() => onOpenPanel('groupList')}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Groups"
        >
          <Users className="h-6 w-6" />
        </button>

        {/* Email */}
        <button
          onClick={() => onOpenPanel('emailForm')}
          className="relative w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Send Email"
        >
          <Send className="h-6 w-6" />
          {selectedContactsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {selectedContactsCount > 99 ? '99+' : selectedContactsCount}
            </span>
          )}
        </button>

        {/* Email History */}
        <button
          onClick={() => onOpenPanel('emailHistory')}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Email History"
        >
          <History className="h-6 w-6" />
        </button>

        {/* Import/Export */}
        <button
          onClick={() => onOpenPanel('importExport')}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Import/Export"
        >
          <ArrowUpDown className="h-6 w-6" />
        </button>
      </div>

      {/* User Menu */}
      <div className="border-t border-gray-200 p-2">
        {/* Settings */}
        <button
          onClick={() => onOpenPanel('userSettings')}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors mb-2"
          title="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>

        {/* User Profile */}
        <div className="relative group">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title={user?.username || 'User Profile'}
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <UserCircle className="h-8 w-8" />
            )}
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
