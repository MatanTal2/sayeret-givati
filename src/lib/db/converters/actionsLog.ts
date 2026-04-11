/**
 * Firestore converter for ActionsLog documents.
 * Ensures type safety between TypeScript interfaces and Firestore payloads.
 */
import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import type { ActionsLog } from '@/types/equipment';

/**
 * Client SDK converter — used for reads via client SDK
 */
export const actionsLogConverter: FirestoreDataConverter<ActionsLog> = {
  toFirestore(log: ActionsLog) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = log;
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ActionsLog {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      actionType: data.actionType,
      equipmentId: data.equipmentId,
      equipmentDocId: data.equipmentDocId,
      equipmentName: data.equipmentName,
      actorId: data.actorId,
      actorName: data.actorName,
      targetId: data.targetId,
      targetName: data.targetName,
      note: data.note,
      timestamp: data.timestamp,
    } as ActionsLog;
  },
};
