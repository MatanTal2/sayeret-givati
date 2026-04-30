import type { Timestamp } from 'firebase/firestore';
import type { UserType } from './user';

/**
 * Source feed for a phoneBook document. The collection is downstream:
 * registered users + authorized_personnel are the two write-through sources.
 * `external` is reserved for Phase 2 (suppliers, range officers, etc.).
 */
export type PhoneBookSource = 'users' | 'authorized_personnel' | 'external';

export interface PhoneBookEntry {
  id: string;
  source: PhoneBookSource;
  /** Firebase Auth UID — set once the person registers. */
  userId?: string;
  /**
   * For people on the army roster, this is `militaryPersonalNumberHash` — same
   * value used as the doc id when the entry came from `users` /
   * `authorized_personnel`. For external entries this is omitted.
   */
  militaryPersonalNumberHash?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  teamId?: string;
  userType?: UserType;
  photoURL?: string;
  isRegistered: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
