// Sidebar navigation component
import {
  UserIcon,
  UserGroupIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { User } from '../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: 'contacts' | 'groups' | 'import-export' | 'settings') => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ activeView, onViewChange, user, onLogout }: SidebarProps) {
  const navigation = [
    {
      name: 'Contacts',
      key: 'contacts' as const,
      icon: UserIcon,
      description: 'Manage your contacts'
    },
    {
      name: 'Groups',
      key: 'groups' as const,
      icon: UserGroupIcon,
      description: 'Organize contacts into groups'
    },
    {
      name: 'Import & Export',
      key: 'import-export' as const,
      icon: ArrowUpTrayIcon,
      description: 'Import and export contacts'
    },
    {
      name: 'Settings',
      key: 'settings' as const,
      icon: Cog6ToothIcon,
      description: 'Account settings'
    },
  ];

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo/Brand */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <UserIcon className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-xl font-bold text-gray-900">Luji Contacts</h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`}
              />
              <div className="text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Contact Limit Info */}
      {user?.contact_limit && user.contact_limit > 0 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Contact Limit: {user.contact_limit}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: '60%' }} // This would be calculated based on actual usage
            ></div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
