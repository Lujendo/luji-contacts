import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Search, 
  Merge, 
  Upload, 
  Download, 
  Users, 
  Settings, 
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Grid,
  List,
  MoreHorizontal
} from 'lucide-react';

interface DropdownItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface DropdownMenuProps {
  title: string;
  items: DropdownItem[];
  className?: string;
}

interface ApplicationMenuBarProps {
  onNewContact: () => void;
  onFindDuplicates: () => void;
  onMergeSelected: () => void;
  onImport: () => void;
  onExport: () => void;
  onManageGroups: () => void;
  onSettings: () => void;
  onSortChange: (field: string, direction: string) => void;
  onViewModeChange: (mode: 'table' | 'grid' | 'list') => void;
  onFilterChange: (filters: any) => void;
  selectedContactsCount: number;
  currentSort: { field: string; direction: string };
  currentViewMode: 'table' | 'grid' | 'list';
  totalContacts: number;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ title, items, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.action();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {title}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
        >
          {items.map((item, index) => (
            <div key={index}>
              {item.separator && <div className="border-t border-gray-100 my-1" />}
              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors duration-150 ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="text-xs text-gray-400">{item.shortcut}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ApplicationMenuBar: React.FC<ApplicationMenuBarProps> = ({
  onNewContact,
  onFindDuplicates,
  onMergeSelected,
  onImport,
  onExport,
  onManageGroups,
  onSettings,
  onSortChange,
  onViewModeChange,
  onFilterChange,
  selectedContactsCount,
  currentSort,
  currentViewMode,
  totalContacts
}) => {
  // File menu items
  const fileMenuItems: DropdownItem[] = [
    {
      label: 'New Contact',
      icon: Plus,
      action: onNewContact,
      shortcut: 'Ctrl+N'
    },
    {
      label: 'Import Contacts',
      icon: Upload,
      action: onImport,
      separator: true
    },
    {
      label: 'Export Contacts',
      icon: Download,
      action: onExport
    }
  ];

  // Edit menu items
  const editMenuItems: DropdownItem[] = [
    {
      label: 'Find Duplicates',
      icon: Search,
      action: onFindDuplicates
    },
    {
      label: `Merge Selected (${selectedContactsCount})`,
      icon: Merge,
      action: onMergeSelected,
      disabled: selectedContactsCount !== 2,
      separator: true
    },
    {
      label: 'Select All',
      action: () => {/* TODO: Implement select all */},
      shortcut: 'Ctrl+A'
    },
    {
      label: 'Deselect All',
      action: () => {/* TODO: Implement deselect all */},
      disabled: selectedContactsCount === 0
    }
  ];

  // View menu items
  const viewMenuItems: DropdownItem[] = [
    {
      label: 'Table View',
      icon: List,
      action: () => onViewModeChange('table')
    },
    {
      label: 'Grid View',
      icon: Grid,
      action: () => onViewModeChange('grid')
    },
    {
      label: 'List View',
      icon: Eye,
      action: () => onViewModeChange('list'),
      separator: true
    },
    {
      label: 'Sort by Name',
      icon: currentSort.field === 'first_name' && currentSort.direction === 'asc' ? SortAsc : SortDesc,
      action: () => onSortChange('first_name', currentSort.field === 'first_name' && currentSort.direction === 'asc' ? 'desc' : 'asc')
    },
    {
      label: 'Sort by Email',
      icon: currentSort.field === 'email' && currentSort.direction === 'asc' ? SortAsc : SortDesc,
      action: () => onSortChange('email', currentSort.field === 'email' && currentSort.direction === 'asc' ? 'desc' : 'asc')
    },
    {
      label: 'Sort by Company',
      icon: currentSort.field === 'company' && currentSort.direction === 'asc' ? SortAsc : SortDesc,
      action: () => onSortChange('company', currentSort.field === 'company' && currentSort.direction === 'asc' ? 'desc' : 'asc')
    },
    {
      label: 'Sort by Date Added',
      icon: currentSort.field === 'created_at' && currentSort.direction === 'asc' ? SortAsc : SortDesc,
      action: () => onSortChange('created_at', currentSort.field === 'created_at' && currentSort.direction === 'asc' ? 'desc' : 'asc'),
      separator: true
    },
    {
      label: 'Show Filters',
      icon: Filter,
      action: () => {/* TODO: Implement filters */}
    }
  ];

  // Tools menu items
  const toolsMenuItems: DropdownItem[] = [
    {
      label: 'Manage Groups',
      icon: Users,
      action: onManageGroups
    },
    {
      label: 'Find Duplicates',
      icon: Search,
      action: onFindDuplicates,
      separator: true
    },
    {
      label: 'Bulk Operations',
      icon: MoreHorizontal,
      action: () => {/* TODO: Implement bulk operations panel */},
      disabled: selectedContactsCount === 0
    }
  ];

  // Settings menu items
  const settingsMenuItems: DropdownItem[] = [
    {
      label: 'Preferences',
      icon: Settings,
      action: onSettings
    },
    {
      label: 'Import/Export Settings',
      action: () => {/* TODO: Implement import/export settings */},
      separator: true
    },
    {
      label: 'About',
      action: () => {/* TODO: Implement about dialog */}
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Menu Bar */}
        <div className="flex items-center space-x-1">
          <DropdownMenu title="File" items={fileMenuItems} />
          <DropdownMenu title="Edit" items={editMenuItems} />
          <DropdownMenu title="View" items={viewMenuItems} />
          <DropdownMenu title="Tools" items={toolsMenuItems} />
          <DropdownMenu title="Settings" items={settingsMenuItems} />
        </div>

        {/* Status Bar */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {selectedContactsCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
              {selectedContactsCount} selected
            </span>
          )}
          <span>
            {totalContacts} contact{totalContacts !== 1 ? 's' : ''}
          </span>
          <span className="capitalize">
            {currentViewMode} view
          </span>
          <span>
            Sorted by {currentSort.field} ({currentSort.direction})
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationMenuBar;
