// Safe, dependency-free caching system for contacts
// No global side effects, no circular dependencies, lazy initialization

import { Contact, ApiResponse } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ContactsCacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

/**
 * Safe cache implementation that avoids initialization issues
 * - No global side effects during module load
 * - No setInterval or window assignments
 * - Lazy initialization only when first used
 * - Fail-safe error handling
 */
class SafeContactsCache {
  private cache = new Map<string, CacheEntry<ApiResponse<Contact[]>>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 50; // Conservative size for stability
  private hitCount = 0;
  private missCount = 0;
  private initialized = false;

  // Lazy initialization - only called when cache is first used
  private ensureInitialized(): void {
    if (this.initialized) return;

    try {
      // Only initialize when actually needed
      this.initialized = true;
      console.log('SafeContactsCache initialized');
    } catch (error) {
      console.warn('Cache initialization warning:', error);
      // Continue without cache if initialization fails
    }
  }

  // Generate deterministic cache key
  private generateKey(params: Record<string, any>): string {
    try {
      // Normalize parameters for consistent caching
      const normalized = {
        search: params.search || '',
        sort: params.sort || 'first_name',
        direction: params.direction || 'asc',
        page: params.page || '1',
        limit: params.limit || '50'
      };

      // Create sorted key for consistency
      const sortedKeys = Object.keys(normalized).sort();
      const keyParts = sortedKeys.map(key => `${key}:${normalized[key]}`);
      return keyParts.join('|');
    } catch (error) {
      console.warn('Cache key generation error:', error);
      return `fallback:${Date.now()}:${Math.random()}`;
    }
  }

  // Set cache entry with error handling
  set(params: Record<string, any>, data: ApiResponse<Contact[]>, ttl?: number): void {
    try {
      this.ensureInitialized();

      const key = this.generateKey(params);
      const now = Date.now();
      const expiresAt = now + (ttl || this.defaultTTL);

      // Clean up expired entries before adding new one
      this.cleanup();

      // Implement simple LRU eviction if cache is full
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
    } catch (error) {
      console.warn('Cache set error:', error);
      // Fail silently - caching is not critical for functionality
    }
  }

  // Get cache entry with performance tracking
  get(params: Record<string, any>): ApiResponse<Contact[]> | null {
    try {
      this.ensureInitialized();

      const key = this.generateKey(params);
      const entry = this.cache.get(key);

      if (!entry) {
        this.missCount++;
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.missCount++;
        return null;
      }

      this.hitCount++;
      return entry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  // Clear all cache entries
  clear(): void {
    try {
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  // Clean up expired entries (called internally)
  private cleanup(): void {
    try {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  // Get cache statistics
  getStats(): ContactsCacheStats {
    try {
      this.cleanup();
      const totalRequests = this.hitCount + this.missCount;

      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0
      };
    } catch (error) {
      console.warn('Cache stats error:', error);
      return {
        size: 0,
        maxSize: this.maxSize,
        hitCount: 0,
        missCount: 0,
        hitRate: 0
      };
    }
  }

  // Invalidate cache entries matching pattern
  invalidate(pattern?: Partial<Record<string, string>>): void {
    try {
      if (!pattern) {
        this.clear();
        return;
      }

      const keysToDelete: string[] = [];

      for (const [key] of this.cache.entries()) {
        // Simple pattern matching - if any pattern field is in the key
        let shouldInvalidate = false;
        for (const [patternKey, patternValue] of Object.entries(pattern)) {
          if (patternValue && key.includes(`${patternKey}:${patternValue}`)) {
            shouldInvalidate = true;
            break;
          }
        }

        if (shouldInvalidate) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));
    } catch (error) {
      console.warn('Cache invalidate error:', error);
    }
  }
}

// Factory function to create cache instance (no global singleton)
export const createContactsCache = (): SafeContactsCache => {
  return new SafeContactsCache();
};
