import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Search, X, Loader2, Clock, Trash2 } from 'lucide-react';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';

interface UnifiedSearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  className?: string;
  showRecentSearches?: boolean;
  autoFocus?: boolean;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  onSearchChange,
  placeholder = "Search contacts by name, email, phone, company, notes...",
  initialQuery = '',
  className = '',
  showRecentSearches = true,
  autoFocus = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const {
    query,
    debouncedQuery,
    isSearching,
    recentSearches,
    setQuery,
    clearQuery,
    addToRecent,
    clearRecent
  } = useUnifiedSearch({
    onSearchChange,
    initialQuery
  });

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearQuery();
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearQuery]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
    setFocusedIndex(-1);
  }, [setQuery, recentSearches.length]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (query.length > 0 || recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  }, [query.length, recentSearches.length]);

  // Handle input blur with delay for clicking suggestions
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }, 150);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    addToRecent(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [setQuery, addToRecent]);

  // Handle keyboard navigation in suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || recentSearches.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < recentSearches.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < recentSearches.length) {
          handleSuggestionSelect(recentSearches[focusedIndex]);
        } else if (query.trim()) {
          addToRecent(query.trim());
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  }, [showSuggestions, recentSearches, focusedIndex, handleSuggestionSelect, query, addToRecent]);

  // Handle clear button
  const handleClear = useCallback(() => {
    clearQuery();
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [clearQuery]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Loading indicator */}
          {isSearching && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}

          {/* Clear button */}
          {query && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        {!query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            ⌘K
          </div>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showSuggestions && showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Recent searches
            </div>
            <button
              onClick={clearRecent}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center"
              title="Clear recent searches"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </button>
          </div>

          {/* Recent search items */}
          {recentSearches.map((search, index) => (
            <button
              key={search}
              onClick={() => handleSuggestionSelect(search)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                index === focusedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="truncate">{search}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
