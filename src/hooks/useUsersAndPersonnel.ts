'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { FirestoreUserProfile } from '@/types/user';
import { AuthorizedPersonnel } from '@/types/admin';
import { UserRole } from '@/types/equipment';
import { ADMIN_CONFIG } from '@/constants/admin';

/**
 * Merged view of `users` ∪ `authorized_personnel` for the admin UsersTab.
 *
 * The two collections share `militaryPersonalNumberHash`:
 *  - `authorized_personnel` doc ID is the hash.
 *  - `users.militaryPersonalNumberHash` is the same value.
 *
 * Registered rows draw their canonical fields from `users` and fall back
 * to `authorized_personnel` only when a users-side value is missing
 * (e.g. phone is sometimes only on the personnel doc).
 *
 * Unregistered rows come solely from `authorized_personnel` — `uid` and
 * `email` may be `null`.
 *
 * Other callers that need email-able / registered-only rows (EmailTab,
 * CustomUserSelectionModal, ammunition page) keep using `useUsers`; this
 * hook is intentionally separate so they don't accidentally email
 * unregistered personnel.
 */
export interface UserWithRegistration {
  hash: string;
  uid: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  rank: string;
  role: UserRole;
  roleDisplay: string;
  team: string;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  registered: boolean;
}

export interface UseUsersAndPersonnelReturn {
  rows: UserWithRegistration[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ROLE_DISPLAY: Record<UserRole, string> = {
  [UserRole.SOLDIER]: 'חייל',
  [UserRole.TEAM_LEADER]: 'מפקד צוות',
  [UserRole.SQUAD_LEADER]: 'מפקד כיתה',
  [UserRole.SERGEANT]: 'סמל',
  [UserRole.OFFICER]: 'קצין',
  [UserRole.COMMANDER]: 'מפקד',
  [UserRole.EQUIPMENT_MANAGER]: 'מנהל ציוד',
};

const TEAM_FROM_ROLE: Record<UserRole, string> = {
  [UserRole.SOLDIER]: 'כללי',
  [UserRole.TEAM_LEADER]: 'מפקדי צוות',
  [UserRole.SQUAD_LEADER]: 'מפקדים',
  [UserRole.SERGEANT]: 'מפקדים',
  [UserRole.OFFICER]: 'מטה',
  [UserRole.COMMANDER]: 'מטה',
  [UserRole.EQUIPMENT_MANAGER]: 'לוגיסטיקה',
};

function roleDisplay(role: UserRole | undefined): string {
  if (!role) return ROLE_DISPLAY[UserRole.SOLDIER];
  return ROLE_DISPLAY[role] ?? String(role);
}

function teamFromRole(role: UserRole | undefined): string {
  if (!role) return TEAM_FROM_ROLE[UserRole.SOLDIER];
  return TEAM_FROM_ROLE[role] ?? 'כללי';
}

export function useUsersAndPersonnel(): UseUsersAndPersonnelReturn {
  const [rows, setRows] = useState<UserWithRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersCol = collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION);
      const personnelCol = collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION);

      const [usersSnap, personnelSnap] = await Promise.all([
        getDocs(query(usersCol)),
        getDocs(query(personnelCol)),
      ]);

      const usersByHash = new Map<string, FirestoreUserProfile>();
      usersSnap.docs.forEach((d) => {
        const data = d.data() as FirestoreUserProfile;
        if (data.militaryPersonalNumberHash) {
          usersByHash.set(data.militaryPersonalNumberHash, data);
        }
      });

      const seenHashes = new Set<string>();
      const merged: UserWithRegistration[] = [];

      personnelSnap.docs.forEach((d) => {
        const personnel = { id: d.id, ...(d.data() as AuthorizedPersonnel) };
        const hash = personnel.militaryPersonalNumberHash || d.id;
        const userDoc = usersByHash.get(hash);
        seenHashes.add(hash);

        const registered = !!userDoc && personnel.registered !== false;
        const role: UserRole = (userDoc?.role as UserRole | undefined)
          ?? personnel.approvedRole
          ?? UserRole.SOLDIER;

        merged.push({
          hash,
          uid: userDoc?.uid ?? null,
          fullName: `${userDoc?.firstName ?? personnel.firstName} ${userDoc?.lastName ?? personnel.lastName}`.trim(),
          firstName: userDoc?.firstName ?? personnel.firstName ?? '',
          lastName: userDoc?.lastName ?? personnel.lastName ?? '',
          email: userDoc?.email ?? personnel.email ?? null,
          phoneNumber: userDoc?.phoneNumber || personnel.phoneNumber || '',
          rank: userDoc?.rank || personnel.rank || 'לא מוגדר',
          role,
          roleDisplay: roleDisplay(role),
          team: teamFromRole(role),
          status: userDoc?.status ?? personnel.status ?? 'active',
          registered,
        });
      });

      usersSnap.docs.forEach((d) => {
        const data = d.data() as FirestoreUserProfile;
        const hash = data.militaryPersonalNumberHash;
        if (!hash || seenHashes.has(hash)) return;
        const role: UserRole = (data.role as UserRole) ?? UserRole.SOLDIER;
        merged.push({
          hash,
          uid: data.uid,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber || '',
          rank: data.rank || 'לא מוגדר',
          role,
          roleDisplay: roleDisplay(role),
          team: teamFromRole(role),
          status: data.status ?? 'active',
          registered: true,
        });
      });

      merged.sort((a, b) => {
        if (a.registered !== b.registered) return a.registered ? -1 : 1;
        const last = a.lastName.localeCompare(b.lastName, 'he');
        if (last !== 0) return last;
        return a.firstName.localeCompare(b.firstName, 'he');
      });

      setRows(merged);
    } catch (err) {
      console.error('[useUsersAndPersonnel] fetch failed', err);
      setError('שגיאה בטעינת רשימת המשתמשים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}
