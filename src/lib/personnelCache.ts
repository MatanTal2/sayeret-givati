import { AuthorizedPersonnel } from '@/types/admin';

const PERSONNEL_CACHE_KEY = 'admin-personnel-data';
const PERSONNEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export interface PersonnelCacheData {
  data: AuthorizedPersonnel[];
  timestamp: number;
  lastManualRefresh?: number;
}

/**
 * Personnel cache utilities for admin system
 * Implements 1-day TTL with manual refresh capability
 */
export class PersonnelCache {
  /**
   * Get cached personnel data if valid and not expired
   */
  static getCachedData(): PersonnelCacheData | null {
    try {
      const cached = localStorage.getItem(PERSONNEL_CACHE_KEY);
      if (!cached) return null;
      
      const cacheData: PersonnelCacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired (1 day TTL)
      if (now - cacheData.timestamp > PERSONNEL_CACHE_TTL) {
        this.clearCache();
        return null;
      }
      
      return cacheData;
    } catch (error) {
      console.warn('Failed to get cached personnel data:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Set personnel data in cache with current timestamp
   */
  static setCachedData(data: AuthorizedPersonnel[], isManualRefresh: boolean = false): void {
    try {
      const now = Date.now();
      const cacheData: PersonnelCacheData = {
        data,
        timestamp: now,
        lastManualRefresh: isManualRefresh ? now : undefined
      };
      
      localStorage.setItem(PERSONNEL_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache personnel data:', error);
    }
  }

  /**
   * Clear personnel cache
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(PERSONNEL_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear personnel cache:', error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static isCacheValid(): boolean {
    const cached = this.getCachedData();
    return cached !== null;
  }

  /**
   * Get cache age in hours
   */
  static getCacheAge(): number {
    const cached = this.getCachedData();
    if (!cached) return -1;
    
    return (Date.now() - cached.timestamp) / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Get last manual refresh time
   */
  static getLastManualRefresh(): Date | null {
    const cached = this.getCachedData();
    if (!cached || !cached.lastManualRefresh) return null;
    
    return new Date(cached.lastManualRefresh);
  }
}
