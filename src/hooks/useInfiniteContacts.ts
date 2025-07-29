import { useState, useEffect, useCallback, useRef } from 'react';
import { contactsApi } from '../api';
import { Contact, PaginationInfo } from '../types';
// Temporarily removed cache import to fix initialization issue
// import { contactsCache } from '../utils/contactsCache';

interface UseInfiniteContactsOptions {
  limit?: number;
  search?: string;
  sort?: string;
  direction?: string;
  enabled?: boolean;
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
}

export const useInfiniteContacts = (
  options: UseInfiniteContactsOptions = {}
): UseInfiniteContactsResult => {
  const {
    limit = 50,
    search = '',
    sort = '',
    direction = '',
    enabled = true
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

  // Reset when search changes
  useEffect(() => {
    if (searchRef.current !== search) {

      searchRef.current = search;
      currentPageRef.current = 1;
      setContacts([]);
      setHasMore(true);
      setError(null);
      if (enabled) {
        loadContacts(1, true);
      }
    }
  }, [search, enabled, loadContacts]);

  // Initial load
  useEffect(() => {
    if (enabled && contacts.length === 0) {
      loadContacts(1, true);
    }
  }, [enabled]);

  const loadContacts = useCallback(async (page: number, reset: boolean = false) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const queryParams = {
        page: page.toString(),
        limit: limit.toString(),
        search: search || undefined,
        sort: sort || undefined,
        direction: direction || undefined
      };

      // Temporarily disable cache to debug initialization issue
      // const cachedResponse = contactsCache.getWithStats(queryParams);
      // if (cachedResponse && !reset) {
      //   const newContacts = Array.isArray(cachedResponse.data) ? cachedResponse.data : [];
      //   const paginationInfo = cachedResponse.pagination;

      //   setContacts(prev => reset ? newContacts : [...(Array.isArray(prev) ? prev : []), ...newContacts]);
      //   setPagination(paginationInfo || null);
      //   setTotal(cachedResponse.total || 0);
      //   setHasMore(paginationInfo?.hasNext || false);

      //   currentPageRef.current = page;
      //   setLoading(false);
      //   isLoadingRef.current = false;
      //   return;
      // }



      // Fetch from API
      const response = await contactsApi.getContacts(queryParams);

      if (response.success && response.data) {
        // Temporarily disable cache
        // contactsCache.set(queryParams, response);

        const newContacts = Array.isArray(response.data) ? response.data : [];
        const paginationInfo = response.pagination;

        setContacts(prev => reset ? newContacts : [...(Array.isArray(prev) ? prev : []), ...newContacts]);
        setPagination(paginationInfo || null);
        setTotal(response.total || 0);
        setHasMore(paginationInfo?.hasNext || false);

        currentPageRef.current = page;
      } else {
        throw new Error('Failed to load contacts');
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [limit, search, sort, direction]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    await loadContacts(currentPageRef.current + 1, false);
  }, [hasMore, loadContacts]);

  const refresh = useCallback(async () => {
    currentPageRef.current = 1;
    setHasMore(true);
    await loadContacts(1, true);
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    pagination
  };
};

// Hook for intersection observer to trigger infinite loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};
