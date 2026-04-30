/**
 * Client-side reads for the phoneBook collection.
 * Mutations go through the server-side write-through pipeline.
 */
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { PhoneBookEntry } from '@/types/phoneBook';

export async function listPhoneBookEntries(): Promise<PhoneBookEntry[]> {
  const q = query(collection(db, COLLECTIONS.PHONE_BOOK), orderBy('displayName'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PhoneBookEntry);
}
