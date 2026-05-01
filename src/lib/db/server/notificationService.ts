/**
 * Server-side Notification Service (firebase-admin)
 * Handles all writes to the notifications collection.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEquipmentId?: string;
  relatedEquipmentDocId?: string;
  relatedTransferId?: string;
  relatedGuardScheduleId?: string;
  equipmentName?: string;
}

export async function serverCreateNotification(data: NotificationInput): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection(COLLECTIONS.NOTIFICATIONS).add({
    ...data,
    isRead: false,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function serverCreateBatchNotifications(
  notifications: NotificationInput[]
): Promise<string[]> {
  const ids: string[] = [];
  // Use Promise.allSettled to not fail entire batch on one error
  const results = await Promise.allSettled(
    notifications.map(n => serverCreateNotification(n))
  );
  for (const result of results) {
    if (result.status === 'fulfilled') ids.push(result.value);
  }
  return ids;
}

export async function serverMarkAsRead(notificationId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
    isRead: true,
    readAt: FieldValue.serverTimestamp(),
  });
}

export async function serverMarkAllAsRead(userId: string): Promise<void> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isRead: true,
      readAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function serverDeleteNotification(notificationId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).delete();
}
