import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

interface UseUnifiedSearchProps {
  onSearchChange?: (query: string) => void;
  initialQuery?: string;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseUnifiedSearchReturn {
  query: string;
  debouncedQuery: string;
  isSearching: boolean;
  recentSearches: string[];
  setQuery: (query: string) => void;
  clearQuery: () => void;
  addToRecent: (query: string) => void;
  clearRecent: () => void;
}

/**
 * Unified search hook that provides consistent search behavior across the app
 * - Fast, responsive debouncing (50ms for short queries, 150ms for longer)
 * - Recent searches management
 * - Loading states
 * - Consistent API
 */
export const useUnifiedSearch = ({
  onSearchChange,
  initialQuery = '',
  debounceMs,
  minQueryLength = 1
}: UseUnifiedSearchProps = {}): UseUnifiedSearchReturn => {
  const [query, setQueryState] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Smart debouncing - faster for better UX
  const smartDebounceMs = useMemo(() => {
    if (debounceMs) return debounceMs;
    
    // Very fast for short queries, slightly longer for complex ones
    if (query.length <= 2) return 50;   // Almost instant for 1-2 chars
    if (query.length <= 5) return 100;  // Fast for 3-5 chars  
    return 150; // Still fast for longer queries
  }, [query.length, debounceMs]);

  const debouncedQuery = useDebounce(query, smartDebounceMs);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unifiedSearchRecent');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Handle debounced query changes
  useEffect(() => {
    if (query === debouncedQuery) {
      setIsSearching(false);
      
      // Call the search change handler
      if (onSearchChange && debouncedQuery.length >= minQueryLength) {
        onSearchChange(debouncedQuery);
      } else if (onSearchChange && debouncedQuery.length === 0) {
        // Always call for empty queries to clear results
        onSearchChange('');
      }
    }
  }, [query, debouncedQuery, onSearchChange, minQueryLength]);

  // Set query with loading state
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    
    // Set loading state if query is different from debounced
    if (newQuery !== debouncedQuery && newQuery.length >= minQueryLength) {
      setIsSearching(true);
    }
  }, [debouncedQuery, minQueryLength]);

  // Clear query
  const clearQuery = useCallback(() => {
    setQueryState('');
    setIsSearching(false);
  }, []);

  // Add to recent searches
  const addToRecent = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 8);
      
      try {
        localStorage.setItem('unifiedSearchRecent', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('unifiedSearchRecent');
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    query,
    debouncedQuery,
    isSearching,
    recentSearches,
    setQuery,
    clearQuery,
    addToRecent,
    clearRecent
  };
};
