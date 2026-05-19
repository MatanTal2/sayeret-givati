'use client';

/**
 * Resolve a list of user UIDs to display names. Used by surfaces that store
 * `users.uid` references (e.g. `systemConfig.ammoNotificationRecipientUserIds`)
 * and need to render names without showing emails.
 *
 * Implementation: Firestore `documentId() in [...]` query, chunked at the
 * 10-doc limit. Memoised on the joined uid list — re-runs only when the set
 * actually changes.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  documentId,
  getDocs,
  query as fsQuery,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ADMIN_CONFIG } from '@/constants/admin';

export interface ResolvedUser {
  uid: string;
  displayName: string;
}

export interface UseUsersByIdsReturn {
  users: Record<string, ResolvedUser>;
  isLoading: boolean;
  error: string | null;
}

/** Firestore caps `in` queries at 10 values. */
const IN_CHUNK_SIZE = 10;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function useUsersByIds(uids: string[]): UseUsersByIdsReturn {
  // Dedup + stable key so the effect dep array doesn't re-fire on identity
  // change when content is unchanged.
  const uniqueKey = useMemo(() => {
    const cleaned = Array.from(new Set(uids.filter((u) => typeof u === 'string' && u.trim().length > 0)));
    cleaned.sort();
    return cleaned.join('|');
  }, [uids]);

  const [users, setUsers] = useState<Record<string, ResolvedUser>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uniqueKey) {
      setUsers({});
      setIsLoading(false);
      setError(null);
      return;
    }
    const ids = uniqueKey.split('|');
    let alive = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const next: Record<string, ResolvedUser> = {};
        const usersCol = collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION);
        for (const part of chunk(ids, IN_CHUNK_SIZE)) {
          const q = fsQuery(usersCol, where(documentId(), 'in', part));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const data = d.data() as { firstName?: string; lastName?: string };
            const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || d.id;
            next[d.id] = { uid: d.id, displayName };
          });
        }
        if (!alive) return;
        setUsers(next);
      } catch (e) {
        if (!alive) return;
        console.error('[useUsersByIds] resolve failed:', e);
        setError(e instanceof Error ? e.message : 'שגיאה בטעינת משתמשים');
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uniqueKey]);

  return { users, isLoading, error };
}
