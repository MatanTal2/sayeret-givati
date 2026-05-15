/**
 * Legacy soldier-status cache. **Deprecated.** Phase 7 of the offline-first
 * migration (audit S6) drops this layer; the SW runtime cache (Phase 3) and
 * Firestore persistent cache (Phase 1) cover the same role plus they
 * survive cross-tab and cross-session.
 *
 * The exported `getCachedData` / `setCachedData` are now no-ops that always
 * report "no cache". On first call, we remove any leftover `localStorage`
 * entry from before the migration and emit a one-time telemetry breadcrumb
 * so we can confirm rollout.
 *
 * Slated for full removal 30 days after Phase 7 ships
 * (`docs/spec/offline-first.md`).
 */

import { Soldier } from '../app/types';

const LEGACY_KEY = 'sayeret-givati-soldiers-data';
const TELEMETRY_KEY = 'sayeret-givati-legacy-cache-migrated';

function cleanupLegacyOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    const migrated = localStorage.getItem(TELEMETRY_KEY);
    if (migrated) return;
    const existing = localStorage.getItem(LEGACY_KEY);
    if (existing) {
      // One-time breadcrumb. The replacement (SW runtime cache for
      // /api/soldier-status, Firestore persistent cache for everything
      // Firestore-direct) will repopulate on the next read.
      console.info('[cache] legacy_cache_migrated', { hadEntry: true });
      localStorage.removeItem(LEGACY_KEY);
    } else {
      console.info('[cache] legacy_cache_migrated', { hadEntry: false });
    }
    localStorage.setItem(TELEMETRY_KEY, String(Date.now()));
  } catch (e) {
    console.warn('[cache] legacy cleanup failed', e);
  }
}

export const getCachedData = (): { data: Soldier[]; timestamp: number } | null => {
  cleanupLegacyOnce();
  return null;
};

export const setCachedData = (_data: Soldier[], _timestamp: number): void => {
  void _data;
  void _timestamp;
  cleanupLegacyOnce();
};
