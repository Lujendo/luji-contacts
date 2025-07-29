import { Contact, ApiResponse } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ContactsQueryKey {
  search?: string;
  sort?: string;
  direction?: string;
  page?: string;
  limit?: string;
}

class ContactsCache {
  private cache = new Map<string, CacheEntry<ApiResponse<Contact[]>>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100; // Maximum number of cached entries

  private generateKey(queryKey: ContactsQueryKey): string {
    const normalized = {
      search: queryKey.search || '',
      sort: queryKey.sort || 'first_name',
      direction: queryKey.direction || 'asc',
      page: queryKey.page || '1',
      limit: queryKey.limit || '50'
    };
    const key = JSON.stringify(normalized);

    return key;
  }

  get(queryKey: ContactsQueryKey): ApiResponse<Contact[]> | null {
    const key = this.generateKey(queryKey);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(queryKey: ContactsQueryKey, data: ApiResponse<Contact[]>, ttl?: number): void {
    const key = this.generateKey(queryKey);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  invalidate(pattern?: Partial<ContactsQueryKey>): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    // Invalidate entries matching pattern
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      try {
        const queryKey = JSON.parse(key) as ContactsQueryKey;
        let shouldInvalidate = false;

        // Check if any pattern field matches
        for (const [patternKey, patternValue] of Object.entries(pattern)) {
          if (patternValue !== undefined && queryKey[patternKey as keyof ContactsQueryKey] === patternValue) {
            shouldInvalidate = true;
            break;
          }
        }

        if (shouldInvalidate) {
          keysToDelete.push(key);
        }
      } catch (error) {
        // Invalid key format, remove it
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Invalidate cache when contacts are modified
  invalidateContactMutations(): void {
    // Clear all cache since contact modifications affect all queries
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  // Performance tracking
  private hitCount = 0;
  private missCount = 0;

  private recordHit(): void {
    this.hitCount++;
  }

  private recordMiss(): void {
    this.missCount++;
  }

  // Enhanced get method with performance tracking
  getWithStats(queryKey: ContactsQueryKey): ApiResponse<Contact[]> | null {
    const result = this.get(queryKey);
    if (result) {
      this.recordHit();
    } else {
      this.recordMiss();
    }
    return result;
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Preload common queries
  async preloadCommonQueries(apiCall: (params: ContactsQueryKey) => Promise<ApiResponse<Contact[]>>): Promise<void> {
    const commonQueries: ContactsQueryKey[] = [
      { page: '1', limit: '50' }, // First page
      { page: '1', limit: '50', sort: 'first_name', direction: 'asc' },
      { page: '1', limit: '50', sort: 'last_name', direction: 'asc' },
      { page: '1', limit: '50', sort: 'created_at', direction: 'desc' }
    ];

    const promises = commonQueries.map(async (query) => {
      try {
        const data = await apiCall(query);
        this.set(query, data);
      } catch (error) {
        console.warn('Failed to preload query:', query, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Create singleton instance
export const contactsCache = new ContactsCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  contactsCache.cleanup();
}, 5 * 60 * 1000);

// Export cache for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).contactsCache = contactsCache;
}
