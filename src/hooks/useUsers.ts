'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { FirestoreUserProfile } from '@/types/user';
import { UserRole } from '@/types/equipment';
import { ADMIN_CONFIG } from '@/constants/admin';

export interface UserForEmail {
  uid: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  team: string;
  role: string;
  rank: string;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
}

export interface UseUsersReturn {
  users: UserForEmail[];
  loading: boolean;
  error: string | null;
  fetchUsers: (forceRefresh?: boolean) => Promise<void>;
}

function mapAndFilter(docs: Array<{ data(): FirestoreUserProfile }>): UserForEmail[] {
  return docs
    .map((d) => {
      const data = d.data() as FirestoreUserProfile;
      return {
        uid: data.uid,
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        team: getTeamFromRole(data.role),
        role: getRoleDisplayName(data.role),
        rank: data.rank || 'לא מוגדר',
        status: data.status || 'active',
      } as UserForEmail;
    })
    .filter((user) => user.status === 'active')
    .sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName, 'he');
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName, 'he');
    });
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<UserForEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listener-based. The previous hook had naive `users.length > 0` caching
  // that broke after deletes. With onSnapshot the list stays correct under
  // adds/removes/updates without explicit refetch, and persistent IndexedDB
  // cache paints the initial state synchronously.
  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = onSnapshot(
      collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION),
      (snap) => {
        setUsers(mapAndFilter(snap.docs));
        setLoading(false);
      },
      (err) => {
        console.error('Users snapshot error:', err);
        setError('שגיאה בטעינת רשימת המשתמשים');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Force-resync escape hatch — kept for API parity. Listener owns state in
  // normal flow.
  const fetchUsers = useCallback(async (_forceRefresh: boolean = false) => {
    void _forceRefresh;
    try {
      const snapshot = await getDocs(collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION));
      setUsers(mapAndFilter(snapshot.docs));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('שגיאה בטעינת רשימת המשתמשים');
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}

function getTeamFromRole(role: UserRole): string {
  switch (role) {
    case UserRole.COMMANDER:
    case UserRole.OFFICER:
      return 'מטה';
    case UserRole.EQUIPMENT_MANAGER:
      return 'לוגיסטיקה';
    case UserRole.SERGEANT:
    case UserRole.SQUAD_LEADER:
      return 'מפקדים';
    case UserRole.TEAM_LEADER:
      return 'מפקדי צוות';
    case UserRole.SOLDIER:
    default:
      return 'כללי';
  }
}

function getRoleDisplayName(role: UserRole): string {
  const roleDisplayMap: Record<UserRole, string> = {
    [UserRole.SOLDIER]: 'חייל',
    [UserRole.TEAM_LEADER]: 'מפקד צוות',
    [UserRole.SQUAD_LEADER]: 'מפקד כיתה',
    [UserRole.SERGEANT]: 'סמל',
    [UserRole.OFFICER]: 'קצין',
    [UserRole.COMMANDER]: 'מפקד',
    [UserRole.EQUIPMENT_MANAGER]: 'מנהל ציוד',
  };

  return roleDisplayMap[role] || role.toString();
}
