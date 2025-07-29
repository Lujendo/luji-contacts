// Simple, safe caching system without circular dependencies
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 50; // Smaller cache size for safety

  // Generate simple cache key
  private generateKey(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const keyParts = sortedKeys.map(key => `${key}:${params[key] || ''}`);
    return keyParts.join('|');
  }

  // Set cache entry
  set(params: Record<string, any>, data: T, ttl?: number): void {
    try {
      const key = this.generateKey(params);
      const now = Date.now();
      const expiresAt = now + (ttl || this.defaultTTL);

      // Clean up expired entries before adding new one
      this.cleanup();

      // If cache is full, remove oldest entry
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
      // Fail silently - caching is not critical
    }
  }

  // Get cache entry
  get(params: Record<string, any>): T | null {
    try {
      const key = this.generateKey(params);
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
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; maxSize: number } {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Create singleton instance
export const contactsCache = new SimpleCache();
