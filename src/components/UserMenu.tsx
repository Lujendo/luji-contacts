import React from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, CreditCard, LogOut } from 'lucide-react';

// Component props interface
interface UserMenuProps {
  onLogout: () => void;
  onSettingsClick?: (tab?: string) => void;
  onProfileClick?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  onLogout, 
  onSettingsClick,
  onProfileClick 
}) => {
  const handleSettingsClick = (tab?: string): void => {
    if (onSettingsClick) {
      onSettingsClick(tab);
    }
  };

  const handleProfileClick = (): void => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
      {/* Profile */}
      {onProfileClick ? (
        <button
          onClick={handleProfileClick}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </button>
      ) : (
        <Link 
          to="/profile" 
          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </Link>
      )}

      {/* Settings */}
      {onSettingsClick && (
        <button
          onClick={() => handleSettingsClick('profile')}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </button>
      )}

      {/* Subscription */}
      {onSettingsClick && (
        <button
          onClick={() => handleSettingsClick('subscription')}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Subscription
        </button>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 my-1" />

      {/* Logout */}
      <button 
        onClick={onLogout}
        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </button>
    </div>
  );
};

export default UserMenu;
