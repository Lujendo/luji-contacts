import React, { useState, useCallback, useMemo } from 'react';
import { Contact } from '../types';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import VirtualizedContactList from './VirtualizedContactList';
import { useDebounce } from '../hooks/useDebounce';

interface OptimizedContactsViewProps {
  onContactSelect: (contact: Contact) => void;
  onContactSelection?: (contactId: number, selected: boolean) => void;
  onBulkSelection?: (selected: boolean) => void;
  selectedContacts?: number[];
  className?: string;
}

const OptimizedContactsView: React.FC<OptimizedContactsViewProps> = ({
  onContactSelect,
  onContactSelection,
  onBulkSelection,
  selectedContacts = [],
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Convert selectedContacts array to Set for performance
  const selectedContactsSet = useMemo(() => {
    return new Set(selectedContacts);
  }, [selectedContacts]);

  const handleSortChange = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleContactClick = useCallback((contact: Contact) => {
    onContactSelect(contact);
  }, [onContactSelect]);

  const handleContactSelectionChange = useCallback((contact: Contact, selected: boolean) => {
    onContactSelection?.(contact.id, selected);
  }, [onContactSelection]);

  const sortOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'created_at', label: 'Date Added' }
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Direction Button */}
          <button
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="w-5 h-5 text-gray-600" />
            ) : (
              <SortDesc className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-600' 
                : 'border-gray-300 hover:bg-gray-50 text-gray-600'
            }`}
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Bulk Selection */}
          {onBulkSelection && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkSelection(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select All
              </button>
              <button
                onClick={() => onBulkSelection(false)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Advanced Filters (collapsible) */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Phone
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Email
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Filter by company..."
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtualized Contact List */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedContactList
          search={debouncedSearch}
          sort={sortField}
          direction={sortDirection}
          onContactClick={handleContactClick}
          onContactSelect={onContactSelection ? handleContactSelectionChange : undefined}
          selectedContacts={selectedContactsSet}
          containerHeight={600} // This will be dynamically calculated
          itemHeight={80}
          className="h-full"
        />
      </div>

      {/* Selection Summary */}
      {selectedContacts.length > 0 && (
        <div className="flex-shrink-0 p-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedContacts.length} contact{selectedContacts.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Export Selected
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedContactsView;
