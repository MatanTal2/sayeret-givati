/**
 * Useful links service.
 *
 * Read-only from the client — admin seeds entries via the Firestore console
 * until an admin CRUD UI ships.
 */

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { UsefulLink } from '@/types/usefulLink';

export async function getUsefulLinks(): Promise<UsefulLink[]> {
  const q = query(collection(db, COLLECTIONS.USEFUL_LINKS), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      label: data.label ?? '',
      url: data.url ?? '#',
      icon: data.icon,
      order: data.order,
      isExternal: data.isExternal ?? true,
    };
  });
}
