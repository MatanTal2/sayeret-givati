import { Soldier } from '../app/types';

const CACHE_KEY = 'sayeret-givati-soldiers-data';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return { data, timestamp };
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const setCachedData = (data: Soldier[], timestamp: number) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}; 