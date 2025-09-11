'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
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

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<UserForEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (forceRefresh: boolean = false) => {
    // Skip fetch if we already have users and not forcing refresh
    if (!forceRefresh && users.length > 0) {
      console.log('🔍 Using cached users data...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching users from Firestore...');
      
      const usersCollection = collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION);
      // Remove orderBy to avoid requiring composite index - we'll sort on frontend
      const q = query(usersCollection);
      
      const querySnapshot = await getDocs(q);
      
      const fetchedUsers: UserForEmail[] = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreUserProfile;
          
          // Map the data to our simplified interface
          return {
            uid: data.uid,
            email: data.email,
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            firstName: data.firstName,
            lastName: data.lastName,
            team: getTeamFromRole(data.role), // Map role to team display
            role: getRoleDisplayName(data.role),
            rank: data.rank || 'לא מוגדר',
            status: data.status || 'active'
          };
        })
        .filter(user => user.status === 'active') // Only show active users
        .sort((a, b) => {
          // Sort by lastName first, then firstName (Hebrew locale)
          const lastNameCompare = a.lastName.localeCompare(b.lastName, 'he');
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.firstName.localeCompare(b.firstName, 'he');
        });
      
      console.log(`✅ Fetched ${fetchedUsers.length} active users`);
      setUsers(fetchedUsers);
      
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError('שגיאה בטעינת רשימת המשתמשים');
    } finally {
      setLoading(false);
    }
  }, [users.length]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers
  };
}

// Helper function to map role to team display
function getTeamFromRole(role: UserRole): string {
  // For now, we'll derive team from role - this can be enhanced later
  // to include actual team assignments from user profile
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

// Helper function to get role display name
function getRoleDisplayName(role: UserRole): string {
  const roleDisplayMap: Record<UserRole, string> = {
    [UserRole.SOLDIER]: 'חייל',
    [UserRole.TEAM_LEADER]: 'מפקד צוות',
    [UserRole.SQUAD_LEADER]: 'מפקד כיתה',
    [UserRole.SERGEANT]: 'סמל',
    [UserRole.OFFICER]: 'קצין',
    [UserRole.COMMANDER]: 'מפקד',
    [UserRole.EQUIPMENT_MANAGER]: 'מנהל ציוד'
  };
  
  return roleDisplayMap[role] || role.toString();
}
