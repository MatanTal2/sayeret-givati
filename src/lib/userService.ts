import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { UserRole } from '@/types/equipment';
import { CommunicationPreferences, UserType } from '@/types/user';

/**
 * Interface for user profile document in Firestore
 */
export interface UserProfile {
  uid: string; // Firebase Auth UID (matches document ID)
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Timestamp;
  phoneNumber: string;
  rank: string; // From authorized_personnel
  userType: UserType; // High-level user categorization
  role: UserRole; // Specific military role
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash: string; // Link to authorized_personnel
  permissions: string[];
  joinDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  testUser?: boolean;
  emailVerified?: boolean;
  communicationPreferences?: CommunicationPreferences;
}

/**
 * Interface for user search results
 */
export interface UserSearchResult {
  uid: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  status?: string;
}

/**
 * Search users by name or email
 * Uses a simpler approach that works without composite indexes
 */
export async function searchUsers(searchQuery: string, limitCount: number = 10): Promise<UserSearchResult[]> {
  try {
    if (searchQuery.length < 2) {
      return [];
    }

    console.log('Searching for users with query:', searchQuery);

    const usersCollection = collection(db, 'users');
    
    // Get all active users and filter client-side
    // This is less efficient but works without complex indexes
    const q = query(
      usersCollection,
      where('status', '==', 'active'),
      limit(100) // Get more users to filter from
    );

    const querySnapshot = await getDocs(q);
    const results: UserSearchResult[] = [];
    const searchLower = searchQuery.toLowerCase().trim();

    console.log(`Found ${querySnapshot.docs.length} active users to search through`);

    querySnapshot.docs.forEach(doc => {
      try {
        const userData = doc.data() as UserProfile;
        
        // Create searchable text from user data
        const searchableText = [
          userData.firstName || '',
          userData.lastName || '',
          userData.email || '',
          `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        ].join(' ').toLowerCase();

        // Check if search query matches any part of the user data
        if (searchableText.includes(searchLower)) {
          results.push({
            uid: doc.id,
            displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: userData.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            rank: userData.rank,
            status: userData.status
          });
        }
      } catch (error) {
        console.warn('Error processing user document:', doc.id, error);
      }
    });

    console.log(`Found ${results.length} matching users`);

    // If no results found and we're in development, add some mock users for testing
    if (results.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No users found, adding mock users for development');
      const mockUsers: UserSearchResult[] = [
        {
          uid: 'mock-user-1',
          displayName: 'יוסי כהן',
          email: 'yossi.cohen@example.com',
          firstName: 'יוסי',
          lastName: 'כהן',
          rank: 'רב סמל',
          status: 'active'
        },
        {
          uid: 'mock-user-2',
          displayName: 'דני לוי',
          email: 'danny.levi@example.com',
          firstName: 'דני',
          lastName: 'לוי',
          rank: 'סגן',
          status: 'active'
        },
        {
          uid: 'mock-user-3',
          displayName: 'מיכל אברהם',
          email: 'michal.abraham@example.com',
          firstName: 'מיכל',
          lastName: 'אברהם',
          rank: 'רס״ן',
          status: 'active'
        }
      ].filter(user => 
        user.displayName.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
      
      if (mockUsers.length > 0) {
        console.log(`Returning ${mockUsers.length} mock users`);
        return mockUsers.slice(0, limitCount);
      }
    }

    // Sort results by relevance
    const sortedResults = results
      .sort((a, b) => {
        // Exact name matches first
        const aExactName = a.displayName.toLowerCase() === searchLower;
        const bExactName = b.displayName.toLowerCase() === searchLower;
        
        if (aExactName && !bExactName) return -1;
        if (!aExactName && bExactName) return 1;
        
        // Then by first name starts with
        const aFirstNameMatch = (a.firstName || '').toLowerCase().startsWith(searchLower);
        const bFirstNameMatch = (b.firstName || '').toLowerCase().startsWith(searchLower);
        
        if (aFirstNameMatch && !bFirstNameMatch) return -1;
        if (!aFirstNameMatch && bFirstNameMatch) return 1;
        
        // Finally alphabetical
        return a.displayName.localeCompare(b.displayName);
      })
      .slice(0, limitCount);

    return sortedResults;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
} 