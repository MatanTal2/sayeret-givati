/**
 * Unit media service.
 * Read-only from the client for now — admin seeds entries via the Firestore console.
 * Writes will be added when an admin upload UI ships.
 */

import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { UnitMedia } from '@/types/unitMedia';

export async function getRecentUnitMedia(limitCount: number = 4): Promise<UnitMedia[]> {
  const q = query(
    collection(db, COLLECTIONS.UNIT_MEDIA),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type === 'video' ? 'video' : 'image',
      url: data.url ?? '',
      thumbnailUrl: data.thumbnailUrl,
      caption: data.caption,
      createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
    };
  });
}
