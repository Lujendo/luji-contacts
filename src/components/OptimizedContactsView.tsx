import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Contact } from '../types';
import { Filter, SortAsc, SortDesc, Loader2, Zap, Users, Settings } from 'lucide-react';
import InfiniteContactList from './InfiniteContactList';
import PaginatedContactList from './PaginatedContactList';
import AdvancedSortingModal from './AdvancedSortingModal';
import { useDebounce } from '../hooks/useDebounce';
import {
  SortingPreferences,
  loadSortingPreferences,
  saveSortingPreferences,
  getSortDescription,
  createSortQueryParams
} from '../utils/sortingPreferences';

interface OptimizedContactsViewProps {
  onContactSelect: (contact: Contact) => void;
  onContactSelection?: (contactId: number, selected: boolean) => void;
  onBulkSelection?: (selected: boolean) => void;
  selectedContacts?: number[];
  className?: string;
  enableInfiniteScrolling?: boolean;
  enableCache?: boolean;
  showCacheStats?: boolean;
  onEditContact?: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
  onAddToGroup?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
  searchQuery?: string;
  groupId?: number;
  activeGroupName?: string;
  onClearGroupFilter?: () => void;
}

const OptimizedContactsView: React.FC<OptimizedContactsViewProps> = ({
  onContactSelect,
  onContactSelection,
  onBulkSelection,
  selectedContacts = [],
  className = '',
  enableInfiniteScrolling = true,
  enableCache = true,
  showCacheStats = false,
  onEditContact,
  onSendEmail,
  onAddToGroup,
  onViewDetails,
  searchQuery = '',
  groupId,
  activeGroupName,
  onClearGroupFilter
}) => {
  const [sortField, setSortField] = useState('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [containerHeight, setContainerHeight] = useState(600);
  const [showAdvancedSorting, setShowAdvancedSorting] = useState(false);
  const [sortingPreferences, setSortingPreferences] = useState<SortingPreferences>(() =>
    loadSortingPreferences()
  );
  const [isInfiniteScrollEnabled, setIsInfiniteScrollEnabled] = useState(() => {
    // Try to get user preference from localStorage, fallback to prop
    const saved = localStorage.getItem('contactsViewMode');
    if (saved !== null) {
      return saved === 'infinite';
    }
    return enableInfiniteScrolling;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the external search query from props - no internal search state needed
  const effectiveSearchQuery = searchQuery;

  // Optimized debounce - much faster for better UX
  const debounceDelay = useMemo(() => {
    if (effectiveSearchQuery.length <= 2) return 100; // Very fast for short queries
    if (effectiveSearchQuery.length <= 5) return 150; // Fast for moderate queries
    return 200; // Reduced from 300ms for better responsiveness
  }, [effectiveSearchQuery.length]);

  // Use debounced search for better performance
  const debouncedSearch = useDebounce(effectiveSearchQuery, debounceDelay);

  // Calculate container height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 20; // 20px bottom margin
        setContainerHeight(Math.max(400, availableHeight)); // Minimum 400px
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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

  const handleAdvancedSortingApply = useCallback((preferences: SortingPreferences) => {
    setSortingPreferences(preferences);
    saveSortingPreferences(preferences);
    // Update the basic sort state to match the primary sort
    setSortField(preferences.primary.field);
    setSortDirection(preferences.primary.direction);
  }, []);

  const handleContactClick = useCallback((contact: Contact) => {
    onContactSelect(contact);
  }, [onContactSelect]);

  const handleContactSelectionChange = useCallback((contact: Contact, selected: boolean) => {
    onContactSelection?.(contact.id, selected);
  }, [onContactSelection]);

  // Get total count and loading state from the appropriate list component
  // These will be managed by the child components (InfiniteContactList/PaginatedContactList)
  const total = 0; // Placeholder - actual count comes from child components
  const loading = false; // Placeholder - actual loading state comes from child components

  const sortOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'created_at', label: 'Date Added' }
  ];

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${className}`}>
      {/* Group Filter Header (if active) */}
      {activeGroupName && (
        <div className="flex-shrink-0 p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Showing contacts in "{activeGroupName}"
              </span>
            </div>
            <button
              onClick={onClearGroupFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Show All Contacts
            </button>
          </div>
        </div>
      )}

      {/* Contact List Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Contact Count and Stats */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading contacts...
                </div>
              ) : (
                <span>
                  {total > 0 ? `${total} contact${total !== 1 ? 's' : ''}` : 'No contacts found'}
                  {effectiveSearchQuery && ` matching "${effectiveSearchQuery}"`}
                </span>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center space-x-4">
            {/* Sort Info Display */}
            {sortField && (
              <div className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span>Sorted by {sortOptions.find(opt => opt.value === sortField)?.label}</span>
                {sortDirection === 'asc' ? (
                  <SortAsc className="w-4 h-4 ml-1" />
                ) : (
                  <SortDesc className="w-4 h-4 ml-1" />
                )}
              </div>
            )}

            {/* Advanced Sorting Button */}
            <button
              onClick={() => setShowAdvancedSorting(true)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title={`Advanced sorting - ${getSortDescription(sortingPreferences)}`}
            >
              <Settings className="w-5 h-5" />
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

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newMode = !isInfiniteScrollEnabled;
                setIsInfiniteScrollEnabled(newMode);
                // Save user preference
                localStorage.setItem('contactsViewMode', newMode ? 'infinite' : 'pagination');
              }}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isInfiniteScrollEnabled
                  ? 'bg-green-50 border-green-300 text-green-600 hover:bg-green-100'
                  : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
              }`}
              title={isInfiniteScrollEnabled ? 'Infinite Scrolling Enabled - Click for Pagination' : 'Pagination Mode - Click for Infinite Scrolling'}
            >
              <Zap className={`w-4 h-4 ${isInfiniteScrollEnabled ? '' : 'opacity-50'}`} />
              <span className="text-xs font-medium">
                {isInfiniteScrollEnabled ? 'Infinite' : 'Pagination'}
              </span>
            </button>
          </div>

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

      {/* Contact List with Infinite Scrolling Toggle */}
      <div className="flex-1 overflow-hidden">
        {isInfiniteScrollEnabled ? (
          <InfiniteContactList
            search={debouncedSearch}
            sort={sortField}
            direction={sortDirection}
            onContactClick={handleContactClick}
            onContactSelect={onContactSelection ? (contact, selected) => onContactSelection(contact.id, selected) : undefined}
            onSortChange={handleSortChange}
            selectedContacts={selectedContactsSet}
            containerHeight={containerHeight}
            enableCache={enableCache}
            showCacheStats={showCacheStats}
            groupId={groupId}
            className="h-full"
          />
        ) : (
          <PaginatedContactList
            search={debouncedSearch}
            sort={sortField}
            direction={sortDirection}
            onContactClick={handleContactClick}
            onContactSelect={onContactSelection ? handleContactSelectionChange : undefined}
            onSortChange={handleSortChange}
            selectedContacts={selectedContactsSet}
            containerHeight={containerHeight}
            enableCache={enableCache}
            showCacheStats={showCacheStats}
            onEditContact={onEditContact}
            onSendEmail={onSendEmail}
            onAddToGroup={onAddToGroup}
            onViewDetails={onViewDetails}
            groupId={groupId}
            className="h-full"
          />
        )}
      </div>

      {/* Selection Summary - Simplified without hidden buttons */}
      {selectedContacts.length > 0 && (
        <div className="flex-shrink-0 p-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-center">
            <span className="text-sm text-blue-700 font-medium">
              {selectedContacts.length} contact{selectedContacts.length === 1 ? '' : 's'} selected
            </span>
          </div>
        </div>
      )}

      {/* Advanced Sorting Modal */}
      <AdvancedSortingModal
        isOpen={showAdvancedSorting}
        onClose={() => setShowAdvancedSorting(false)}
        currentPreferences={sortingPreferences}
        onApply={handleAdvancedSortingApply}
      />
    </div>
  );
};

export default OptimizedContactsView;
