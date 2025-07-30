import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { contactsApi } from '../api';
import { Contact, PaginationInfo, ApiResponse } from '../types';
import { createContactsCache } from '../utils/simpleCache';

interface UseInfiniteContactsOptions {
  limit?: number;
  search?: string;
  sort?: string;
  direction?: string;
  enabled?: boolean;
  enableCache?: boolean;
  groupId?: number;
}

interface UseInfiniteContactsResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  total: number;
  pagination: PaginationInfo | null;
  cacheStats: () => any;
}

export const useInfiniteContacts = (
  options: UseInfiniteContactsOptions = {}
): UseInfiniteContactsResult => {
  const {
    limit = 50,
    search = '',
    sort = '',
    direction = '',
    enabled = true,
    enableCache = true,
    groupId
  } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Track current page and prevent duplicate requests
  const currentPageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const searchRef = useRef(search);

  // Create cache instance using factory (no global singleton)
  const cache = useMemo(() => {
    return enableCache ? createContactsCache() : null;
  }, [enableCache]);

  // Reset when search or group changes
  useEffect(() => {
    const hasSearchChanged = searchRef.current !== search;

    if (hasSearchChanged) {
      searchRef.current = search;
      currentPageRef.current = 1;
      setContacts([]);
      setHasMore(true);
      setError(null);
      if (enabled) {
        loadContacts(1, true);
      }
    }
  }, [search, sort, direction, enabled, groupId]);

  // Initial load
  useEffect(() => {
    if (enabled && contacts.length === 0 && !isLoadingRef.current) {
      loadContacts(1, true);
    }
  }, [enabled]);

  const loadContacts = useCallback(async (page: number, reset: boolean = false) => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        search: search || undefined,
        sort: sort || undefined,
        direction: direction || undefined,
        group: groupId ? groupId.toString() : undefined
      };

      // Try cache first if enabled
      let response: ApiResponse<Contact[]> | null = null;

      if (cache && !reset) {
        response = cache.get(queryParams);
        if (response) {
          console.log('Cache hit for page', page);
        }
      }

      // Fetch from API if not cached
      if (!response) {
        console.log('Fetching from API for page', page);
        response = await contactsApi.getContacts(queryParams);

        // Cache the response if cache is enabled
        if (cache && response.success) {
          cache.set(queryParams, response);
        }
      }

      if (response.success && response.data) {
        const newContacts = Array.isArray(response.data) ? response.data : [];
        const paginationInfo = response.pagination;

        setContacts(prev => {
          const currentContacts = Array.isArray(prev) ? prev : [];
          return reset ? newContacts : [...currentContacts, ...newContacts];
        });

        setPagination(paginationInfo || null);
        setTotal(response.total || 0);
        setHasMore(paginationInfo?.hasNext || false);
        currentPageRef.current = page;
      } else {
        throw new Error(response.error || 'Failed to load contacts');
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(errorMessage);
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [limit, search, sort, direction, groupId, cache]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    await loadContacts(currentPageRef.current + 1, false);
  }, [hasMore, loadContacts]);

  const refresh = useCallback(async () => {
    // Clear cache on refresh
    if (cache) {
      cache.clear();
    }

    currentPageRef.current = 1;
    setHasMore(true);
    await loadContacts(1, true);
  }, [loadContacts, cache]);

  const cacheStats = useCallback(() => {
    return cache ? cache.getStats() : null;
  }, [cache]);

  return {
    contacts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    pagination,
    cacheStats
  };
};


