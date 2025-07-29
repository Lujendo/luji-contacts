import { useState, useEffect, useCallback, useRef } from 'react';
import { contactsApi } from '../api';
import { Contact } from '../types';
import { contactsCache } from '../utils/simpleCache';

interface UseInfiniteScrollOptions {
  search?: string;
  sort?: string;
  direction?: string;
  pageSize?: number;
  enabled?: boolean;
}

interface UseInfiniteScrollResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  total: number;
}

export const useInfiniteScroll = (options: UseInfiniteScrollOptions): UseInfiniteScrollResult => {
  const {
    search = '',
    sort = 'first_name',
    direction = 'asc',
    pageSize = 50,
    enabled = true
  } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs to track current state
  const isLoadingRef = useRef(false);
  const searchRef = useRef(search);
  const sortRef = useRef(sort);
  const directionRef = useRef(direction);

  // Load contacts function
  const loadContacts = useCallback(async (page: number, reset: boolean = false) => {
    if (isLoadingRef.current || !enabled) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const queryParams = {
        page: page.toString(),
        limit: pageSize.toString(),
        search: search || undefined,
        sort: sort || undefined,
        direction: direction || undefined
      };

      // Check cache first (only for first page to avoid complexity)
      let response;
      if (page === 1) {
        const cached = contactsCache.get(queryParams);
        if (cached && !reset) {
          response = cached;
        }
      }

      // Fetch from API if not cached
      if (!response) {
        const apiResponse = await contactsApi.getContacts(queryParams);
        if (!apiResponse.success || !apiResponse.data) {
          throw new Error('Failed to load contacts');
        }
        response = apiResponse;

        // Cache first page only
        if (page === 1) {
          contactsCache.set(queryParams, response);
        }
      }

      const newContacts = Array.isArray(response.data) ? response.data : [];
      const paginationInfo = response.pagination;

      if (reset || page === 1) {
        setContacts(newContacts);
      } else {
        setContacts(prev => [...prev, ...newContacts]);
      }

      setTotal(response.total || 0);
      setHasMore(paginationInfo?.hasNext || false);
      setCurrentPage(page);

    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [search, sort, direction, pageSize, enabled]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadContacts(currentPage + 1, false);
  }, [hasMore, loading, currentPage, loadContacts]);

  // Refresh function
  const refresh = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    contactsCache.clear(); // Clear cache on refresh
    loadContacts(1, true);
  }, [loadContacts]);

  // Reset when search/sort changes
  useEffect(() => {
    const searchChanged = searchRef.current !== search;
    const sortChanged = sortRef.current !== sort;
    const directionChanged = directionRef.current !== direction;

    if (searchChanged || sortChanged || directionChanged) {
      searchRef.current = search;
      sortRef.current = sort;
      directionRef.current = direction;

      setCurrentPage(1);
      setHasMore(true);
      setContacts([]);
      contactsCache.clear(); // Clear cache when parameters change
      
      if (enabled) {
        loadContacts(1, true);
      }
    }
  }, [search, sort, direction, enabled, loadContacts]);

  // Initial load
  useEffect(() => {
    if (enabled && contacts.length === 0 && !loading) {
      loadContacts(1, true);
    }
  }, [enabled, contacts.length, loading, loadContacts]);

  return {
    contacts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total
  };
};
