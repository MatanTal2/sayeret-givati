/**
 * Unit announcements service.
 *
 * Reads and writes use the client SDK — consistent with the current codebase state
 * (see docs/spec/firestore-refactor.md for the hybrid migration plan).
 *
 * Who can write is enforced by firestore.rules (admin / officer / commander).
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { Announcement, NewAnnouncementInput } from '@/types/announcement';

export async function getRecentAnnouncements(limitCount: number = 3): Promise<Announcement[]> {
  const q = query(
    collection(db, COLLECTIONS.ANNOUNCEMENTS),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? '',
      body: data.body ?? '',
      authorId: data.authorId ?? '',
      authorName: data.authorName ?? '',
      createdAt: (data.createdAt as Timestamp) ?? Timestamp.now(),
    };
  });
}

export async function createAnnouncement(
  input: NewAnnouncementInput,
  author: { uid: string; displayName: string }
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), {
    title: input.title.trim(),
    body: input.body.trim(),
    authorId: author.uid,
    authorName: author.displayName,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
}
