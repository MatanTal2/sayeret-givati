/**
 * Client-side reads for the phoneBook collection.
 * Mutations go through the server-side write-through pipeline.
 */
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { PhoneBookEntry } from '@/types/phoneBook';

export async function listPhoneBookEntries(): Promise<PhoneBookEntry[]> {
  const q = query(collection(db, COLLECTIONS.PHONE_BOOK), orderBy('displayName'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PhoneBookEntry);
}

/**
 * Delta read: every doc whose `updatedAt` is strictly greater than `sinceMs`.
 * Used by the cache layer to avoid re-fetching the whole directory on mount.
 * Returns docs ordered by `updatedAt` — caller merges into its existing list.
 */
export async function listPhoneBookEntriesUpdatedSince(
  sinceMs: number
): Promise<PhoneBookEntry[]> {
  const q = query(
    collection(db, COLLECTIONS.PHONE_BOOK),
    where('updatedAt', '>', Timestamp.fromMillis(sinceMs)),
    orderBy('updatedAt')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PhoneBookEntry);
}
