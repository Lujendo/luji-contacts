import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { contactsApi } from '../api';
import { Contact, PaginationInfo, ApiResponse } from '../types';
import { createContactsCache } from '../utils/simpleCache';

interface UseOptimizedPaginationOptions {
  pageSize?: number;
  search?: string;
  sort?: string;
  direction?: string;
  enabled?: boolean;
  enableCache?: boolean;
  prefetchAdjacent?: boolean;
}

interface UseOptimizedPaginationResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  goToFirstPage: () => Promise<void>;
  goToLastPage: () => Promise<void>;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  cacheStats: () => any;
}

/**
 * High-performance pagination hook with caching, prefetching, and optimistic updates
 */
export const useOptimizedPagination = (
  options: UseOptimizedPaginationOptions = {}
): UseOptimizedPaginationResult => {
  const {
    pageSize: initialPageSize = 25,
    search = '',
    sort = '',
    direction = '',
    enabled = true,
    enableCache = true,
    prefetchAdjacent = true
  } = options;

  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Refs for tracking state
  const isLoadingRef = useRef(false);
  const searchRef = useRef(search);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Create cache instance
  const cache = useMemo(() => {
    return enableCache ? createContactsCache() : null;
  }, [enableCache]);

  // Calculate derived values
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  // Reset to first page when search/sort changes
  useEffect(() => {
    const hasSearchChanged = searchRef.current !== search;
    
    if (hasSearchChanged) {
      searchRef.current = search;
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        // If already on page 1, trigger load manually
        loadPage(1);
      }
    }
  }, [search, sort, direction]);

  // Load page data with caching and error handling
  const loadPage = useCallback(async (page: number, showLoading: boolean = true) => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      return null;
    }

    try {
      isLoadingRef.current = true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const queryParams = {
        page: page.toString(),
        limit: pageSize.toString(),
        search: search || undefined,
        sort: sort || undefined,
        direction: direction || undefined
      };

      // Try cache first if enabled
      let response: ApiResponse<Contact[]> | null = null;
      
      if (cache) {
        response = cache.get(queryParams);
        if (response) {
          console.log(`📦 Cache hit for page ${page}`);
        }
      }

      // Fetch from API if not cached
      if (!response) {
        console.log(`🌐 Fetching page ${page} from API`);
        response = await contactsApi.getContacts(queryParams);
        
        // Cache the response if cache is enabled
        if (cache && response.success) {
          cache.set(queryParams, response);
        }
      }

      if (response.success && response.data) {
        const newContacts = Array.isArray(response.data) ? response.data : [];
        
        // Only update state if this is the current page request
        if (page === currentPage || !showLoading) {
          setContacts(newContacts);
          setTotal(response.total || 0);
        }
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to load contacts');
      }
    } catch (err) {
      console.error('Error loading page:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
      if (showLoading) {
        setError(errorMessage);
      }
      return null;
    } finally {
      isLoadingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [pageSize, search, sort, direction, cache, currentPage]);

  // Prefetch adjacent pages for instant navigation
  const prefetchAdjacentPages = useCallback(async (centerPage: number) => {
    if (!prefetchAdjacent || !cache) return;

    // Clear any existing prefetch timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Prefetch after a short delay to avoid interfering with current request
    prefetchTimeoutRef.current = setTimeout(async () => {
      const pagesToPrefetch = [];
      
      // Prefetch previous page
      if (centerPage > 1) {
        pagesToPrefetch.push(centerPage - 1);
      }
      
      // Prefetch next page
      if (centerPage < totalPages) {
        pagesToPrefetch.push(centerPage + 1);
      }

      // Prefetch pages in background
      for (const page of pagesToPrefetch) {
        const queryParams = {
          page: page.toString(),
          limit: pageSize.toString(),
          search: search || undefined,
          sort: sort || undefined,
          direction: direction || undefined
        };

        // Only prefetch if not already cached
        if (!cache.get(queryParams)) {
          console.log(`🔄 Prefetching page ${page}`);
          try {
            const response = await contactsApi.getContacts(queryParams);
            if (response.success) {
              cache.set(queryParams, response);
            }
          } catch (err) {
            // Silently fail prefetch - not critical
            console.log(`Failed to prefetch page ${page}:`, err);
          }
        }
      }
    }, 100);
  }, [prefetchAdjacent, cache, totalPages, pageSize, search, sort, direction]);

  // Load contacts when page or dependencies change
  useEffect(() => {
    if (enabled) {
      loadPage(currentPage).then(() => {
        // Prefetch adjacent pages after successful load
        prefetchAdjacentPages(currentPage);
      });
    }
  }, [currentPage, pageSize, enabled, loadPage, prefetchAdjacentPages]);

  // Navigation functions with optimistic updates
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    // Optimistic update - change page immediately
    setCurrentPage(page);
    
    // Load data (will be instant if cached)
    await loadPage(page);
  }, [totalPages, currentPage, loadPage]);

  const goToNextPage = useCallback(async () => {
    if (hasNextPage) {
      await goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const goToPreviousPage = useCallback(async () => {
    if (hasPreviousPage) {
      await goToPage(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, goToPage]);

  const goToFirstPage = useCallback(async () => {
    await goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(async () => {
    await goToPage(totalPages);
  }, [totalPages, goToPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const refresh = useCallback(async () => {
    // Clear cache on refresh
    if (cache) {
      cache.clear();
    }
    
    await loadPage(currentPage);
  }, [loadPage, currentPage, cache]);

  const cacheStats = useCallback(() => {
    return cache ? cache.getStats() : null;
  }, [cache]);

  // Cleanup prefetch timeout on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    contacts,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    refresh,
    cacheStats
  };
};
