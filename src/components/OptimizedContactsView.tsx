import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Contact } from '../types';
import { Search, Filter, SortAsc, SortDesc, X, Loader2, Zap } from 'lucide-react';
import InfiniteContactList from './InfiniteContactList';
import PaginatedContactList from './PaginatedContactList';
import { useDebounce } from '../hooks/useDebounce';

interface OptimizedContactsViewProps {
  onContactSelect: (contact: Contact) => void;
  onContactSelection?: (contactId: number, selected: boolean) => void;
  onBulkSelection?: (selected: boolean) => void;
  selectedContacts?: number[];
  className?: string;
  enableInfiniteScrolling?: boolean;
  enableCache?: boolean;
  showCacheStats?: boolean;
}

const OptimizedContactsView: React.FC<OptimizedContactsViewProps> = ({
  onContactSelect,
  onContactSelection,
  onBulkSelection,
  selectedContacts = [],
  className = '',
  enableInfiniteScrolling = true,
  enableCache = true,
  showCacheStats = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [containerHeight, setContainerHeight] = useState(600);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isInfiniteScrollEnabled, setIsInfiniteScrollEnabled] = useState(() => {
    // Try to get user preference from localStorage, fallback to prop
    const saved = localStorage.getItem('contactsViewMode');
    if (saved !== null) {
      return saved === 'infinite';
    }
    return enableInfiniteScrolling;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Optimized debounce - faster for short queries, slower for complex ones
  const debounceDelay = useMemo(() => {
    if (searchQuery.length <= 2) return 150; // Fast for short queries
    if (searchQuery.length <= 5) return 200; // Medium for moderate queries
    return 300; // Standard for longer queries
  }, [searchQuery.length]);

  // Use debounced search for better performance
  const debouncedSearch = useDebounce(searchQuery, debounceDelay);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentContactSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }
  }, []);

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

  const handleContactClick = useCallback((contact: Contact) => {
    onContactSelect(contact);
  }, [onContactSelect]);

  const handleContactSelectionChange = useCallback((contact: Contact, selected: boolean) => {
    onContactSelection?.(contact.id, selected);
  }, [onContactSelection]);

  // Save search to recent searches
  const saveRecentSearch = useCallback((query: string) => {
    if (query.trim().length < 2) return;

    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentContactSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle search input changes with loading state
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setSearchQuery(value);
    if (value !== debouncedSearch) {
      setIsSearching(true);
    }
    setShowSuggestions(value.length > 0);
  }, [debouncedSearch, searchQuery]);

  // Handle search input focus
  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length > 0 || recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchQuery, recentSearches]);

  // Handle search input blur (with delay to allow clicking suggestions)
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    saveRecentSearch(suggestion);
    searchInputRef.current?.blur();
  }, [saveRecentSearch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  // Track when search is complete and save to recent searches
  useEffect(() => {

    if (searchQuery === debouncedSearch) {
      setIsSearching(false);
      // Save non-empty searches to recent searches
      if (debouncedSearch.trim().length >= 2) {
        saveRecentSearch(debouncedSearch.trim());
      }
    }
  }, [searchQuery, debouncedSearch, saveRecentSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, clearSearch]);

  const sortOptions = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'created_at', label: 'Date Added' }
  ];

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Enhanced Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search across all fields: names, notes, address, social media... (Ctrl+K)"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  saveRecentSearch(searchQuery.trim());
                  setShowSuggestions(false);
                }
              }}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Right side icons */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Loading indicator */}
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              )}

              {/* Clear button */}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear search (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => applySuggestion(search)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                      >
                        <Search className="w-4 h-4 mr-2 text-gray-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}

                {/* Comprehensive Search Examples */}
                {searchQuery.length === 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
                      Search Examples
                    </div>
                    <div className="text-xs text-gray-500 px-2 py-1 mb-2">
                      Search across names, notes, address, social media, and all contact fields
                    </div>
                    {[
                      { text: 'Andrea', desc: 'Find "Andrea" in any field' },
                      { text: 'New York', desc: 'Search addresses' },
                      { text: 'linkedin.com', desc: 'Find social profiles' },
                      { text: 'meeting notes', desc: 'Search notes content' },
                      { text: '@gmail.com', desc: 'Email domains' },
                      { text: 'birthday party', desc: 'Notes and events' }
                    ].map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => applySuggestion(suggestion.text)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center">
                          <Search className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{suggestion.text}</div>
                            <div className="text-xs text-gray-500">{suggestion.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
            className="h-full"
          />
        )}
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
