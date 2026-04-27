/**
 * localStorage-backed tracker for recent route visits.
 * Per-device, no backend cost. Powers the home "Recent activity" widget.
 */

const STORAGE_KEY = 'recent_routes';
const MAX_ENTRIES = 10;

export interface RecentRouteEntry {
  href: string;
  title: string;
  icon?: string;
  visitedAt: number;
}

function canAccessStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function getRecentRoutes(): RecentRouteEntry[] {
  if (!canAccessStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentRouteEntry =>
        e && typeof e.href === 'string' && typeof e.title === 'string' && typeof e.visitedAt === 'number'
    );
  } catch {
    return [];
  }
}

export function trackRouteVisit(entry: Omit<RecentRouteEntry, 'visitedAt'>): void {
  if (!canAccessStorage()) return;
  // Never track home — it's always one tap away via the logo/hamburger.
  if (entry.href === '/' || !entry.href) return;
  try {
    const existing = getRecentRoutes().filter((e) => e.href !== entry.href);
    const next: RecentRouteEntry[] = [{ ...entry, visitedAt: Date.now() }, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearRecentRoutes(): void {
  if (!canAccessStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
