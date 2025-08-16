import React from 'react';
import { Users, Settings, User } from 'lucide-react';

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onSettingsClick,
  onProfileClick,
  className = ''
}) => {
  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">
                Luji Contacts
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Professional Contact Management
              </p>
            </div>
          </div>

          {/* Center - Optional Navigation or Search */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-1">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                Contacts
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                Groups
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                Analytics
              </button>
            </nav>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-3">
            {/* Settings Button */}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* User Profile */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">
                    {user.name || 'User'}
                  </span>
                  {user.email && (
                    <span className="text-xs text-gray-500">
                      {user.email}
                    </span>
                  )}
                </div>
                <button
                  onClick={onProfileClick}
                  className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                  title="User Profile"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
