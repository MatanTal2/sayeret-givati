'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import type { Soldier } from '@/app/types';
import type { RosterEntry, SoldierStatus } from '@/types/soldierStatus';

interface ApiResponse {
  success: boolean;
  soldiers?: RosterEntry[];
  error?: string;
}

function rosterToSoldier(entry: RosterEntry): Soldier {
  const fullName = `${entry.firstName} ${entry.lastName}`.trim();
  return {
    id: entry.id,
    firstName: entry.firstName,
    lastName: entry.lastName,
    name: fullName,
    platoon: entry.platoon || 'מסייעת',
    status: entry.status,
    customStatus: entry.customStatus,
    isSelected: false,
    isRegistered: entry.isRegistered ?? false,
    phoneNumber: entry.phoneNumber,
  };
}

/**
 * Loads + mutates the soldier-status roster against `/api/soldier-status`.
 *
 * Roster is the join of `users` ∪ `authorized_personnel` plus the optional
 * status overlay; adding a soldier happens in the admin panel, not here.
 *
 * Caching: the Service Worker runtime cache (offline-first Phase 3) covers
 * `/api/soldier-status` for offline / fast paint. The legacy in-hook
 * localStorage cache was retired in Phase 7 (PR #129); the SW + Firestore
 * persistent cache layers are now authoritative.
 */
export function useSoldierStatus() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [originalSoldiers, setOriginalSoldiers] = useState<Soldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingChanges, setIsUpdatingChanges] = useState(false);

  const fetchSoldiers = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      if (forceRefresh) setIsRefreshing(true);

      const response = await apiFetch('/api/soldier-status');
      const result: ApiResponse = await response.json().catch(() => ({ success: false }));
      if (!response.ok || !result.success || !Array.isArray(result.soldiers)) {
        throw new Error(result.error || `שגיאת שרת: ${response.status}`);
      }

      const soldiersData = result.soldiers.map(rosterToSoldier);
      setLastUpdated(new Date());
      setSoldiers(soldiersData);
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiersData)));
    } catch (err) {
      console.error('Error fetching soldiers:', err);
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה בטעינת הנתונים');
    } finally {
      setLoading(false);
      if (forceRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSoldiers();
  }, [fetchSoldiers]);

  /**
   * Push every changed soldier's status to the server. Each change is a
   * separate PUT — small roster, low traffic, no batch endpoint needed.
   */
  const pushChangedStatuses = useCallback(async (changed: Soldier[]) => {
    if (changed.length === 0) return;
    setIsUpdatingChanges(true);
    try {
      for (const soldier of changed) {
        const body: Record<string, string> = { status: soldier.status as SoldierStatus };
        if (soldier.status === 'אחר' && soldier.customStatus) {
          body.customStatus = soldier.customStatus;
        }
        const response = await apiFetch(`/api/soldier-status/${encodeURIComponent(soldier.id)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || `שגיאה בעדכון ${soldier.name}`);
        }
      }
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiers)));
    } finally {
      setIsUpdatingChanges(false);
    }
  }, [soldiers]);

  return {
    soldiers,
    setSoldiers,
    originalSoldiers,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    isUpdatingChanges,
    fetchSoldiers,
    pushChangedStatuses,
  };
}
