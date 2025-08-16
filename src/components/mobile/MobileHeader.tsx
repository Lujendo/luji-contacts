import React, { ReactNode } from 'react';
import { ArrowLeft, Menu, Search } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  showSearchButton?: boolean;
  onSearchClick?: () => void;
  actions?: ReactNode;
  className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'Luji Contacts',
  showBackButton = false,
  onBackClick,
  showMenuButton = true,
  onMenuClick,
  showSearchButton = true,
  onSearchClick,
  actions,
  className = ''
}) => {
  return (
    <header className={`bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between min-h-[56px] ${className}`}>
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        {showBackButton ? (
          <button
            onClick={onBackClick}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        ) : showMenuButton ? (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        ) : null}
        
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {showSearchButton && (
          <button
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
        )}
        {actions}
      </div>
    </header>
  );
};

export default MobileHeader;
