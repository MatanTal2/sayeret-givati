/**
 * Actions Log Service
 * Handles all operations for the global actionsLog collection
 * Provides centralized audit logging for all equipment-related actions
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActionsLog, ActionType } from '@/types/equipment';

const ACTIONS_LOG_COLLECTION = 'actionsLog';

/**
 * Create a new action log entry
 */
export async function createActionLog(actionData: Omit<ActionsLog, 'id' | 'timestamp'>): Promise<string> {
  try {
    const actionLogData = {
      ...actionData,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ACTIONS_LOG_COLLECTION), actionLogData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating action log:', error);
    throw new Error('Failed to create action log entry');
  }
}

/**
 * Get action logs for a specific equipment item
 */
export async function getEquipmentActionLogs(
  equipmentDocId: string, 
  limitCount: number = 50
): Promise<ActionsLog[]> {
  try {
    const q = query(
      collection(db, ACTIONS_LOG_COLLECTION),
      where('equipmentDocId', '==', equipmentDocId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActionsLog));
  } catch (error) {
    console.error('Error fetching equipment action logs:', error);
    throw new Error('Failed to fetch equipment action logs');
  }
}

/**
 * Get action logs by action type
 */
export async function getActionLogsByType(
  actionType: ActionType, 
  limitCount: number = 100
): Promise<ActionsLog[]> {
  try {
    const q = query(
      collection(db, ACTIONS_LOG_COLLECTION),
      where('actionType', '==', actionType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActionsLog));
  } catch (error) {
    console.error('Error fetching action logs by type:', error);
    throw new Error('Failed to fetch action logs by type');
  }
}

/**
 * Get action logs by actor (user)
 */
export async function getActionLogsByActor(
  actorId: string, 
  limitCount: number = 100
): Promise<ActionsLog[]> {
  try {
    const q = query(
      collection(db, ACTIONS_LOG_COLLECTION),
      where('actorId', '==', actorId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActionsLog));
  } catch (error) {
    console.error('Error fetching action logs by actor:', error);
    throw new Error('Failed to fetch action logs by actor');
  }
}

/**
 * Get recent action logs (for dashboard/overview)
 */
export async function getRecentActionLogs(limitCount: number = 50): Promise<ActionsLog[]> {
  try {
    const q = query(
      collection(db, ACTIONS_LOG_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActionsLog));
  } catch (error) {
    console.error('Error fetching recent action logs:', error);
    throw new Error('Failed to fetch recent action logs');
  }
}

/**
 * Get action logs within a date range
 */
export async function getActionLogsByDateRange(
  startDate: Date,
  endDate: Date,
  limitCount: number = 200
): Promise<ActionsLog[]> {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      collection(db, ACTIONS_LOG_COLLECTION),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActionsLog));
  } catch (error) {
    console.error('Error fetching action logs by date range:', error);
    throw new Error('Failed to fetch action logs by date range');
  }
}

/**
 * Helper function to create standardized action log entries
 */
export const ActionLogHelpers = {
  /**
   * Create transfer request action log
   */
  transferRequested: (
    equipmentId: string,
    equipmentDocId: string,
    equipmentName: string,
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string,
    reason: string
  ): Omit<ActionsLog, 'id' | 'timestamp'> => ({
    actionType: ActionType.TRANSFER_REQUESTED,
    equipmentId,
    equipmentDocId,
    equipmentName,
    actorId: fromUserId,
    actorName: fromUserName,
    targetId: toUserId,
    targetName: toUserName,
    note: reason
  }),

  /**
   * Create transfer approval action log
   */
  transferApproved: (
    equipmentId: string,
    equipmentDocId: string,
    equipmentName: string,
    approverUserId: string,
    approverUserName: string,
    toUserId: string,
    toUserName: string,
    note?: string
  ): Omit<ActionsLog, 'id' | 'timestamp'> => ({
    actionType: ActionType.TRANSFER_APPROVED,
    equipmentId,
    equipmentDocId,
    equipmentName,
    actorId: approverUserId,
    actorName: approverUserName,
    targetId: toUserId,
    targetName: toUserName,
    note
  }),

  /**
   * Create transfer rejection action log
   */
  transferRejected: (
    equipmentId: string,
    equipmentDocId: string,
    equipmentName: string,
    rejectorUserId: string,
    rejectorUserName: string,
    fromUserId: string,
    fromUserName: string,
    reason?: string
  ): Omit<ActionsLog, 'id' | 'timestamp'> => ({
    actionType: ActionType.TRANSFER_REJECTED,
    equipmentId,
    equipmentDocId,
    equipmentName,
    actorId: rejectorUserId,
    actorName: rejectorUserName,
    targetId: fromUserId,
    targetName: fromUserName,
    note: reason
  }),

  /**
   * Create equipment creation action log
   */
  equipmentCreated: (
    equipmentId: string,
    equipmentDocId: string,
    equipmentName: string,
    creatorUserId: string,
    creatorUserName: string
  ): Omit<ActionsLog, 'id' | 'timestamp'> => ({
    actionType: ActionType.EQUIPMENT_CREATED,
    equipmentId,
    equipmentDocId,
    equipmentName,
    actorId: creatorUserId,
    actorName: creatorUserName
  }),

  /**
   * Create status update action log
   */
  statusUpdate: (
    equipmentId: string,
    equipmentDocId: string,
    equipmentName: string,
    updaterUserId: string,
    updaterUserName: string,
    newStatus: string,
    note?: string
  ): Omit<ActionsLog, 'id' | 'timestamp'> => ({
    actionType: ActionType.STATUS_UPDATE,
    equipmentId,
    equipmentDocId,
    equipmentName,
    actorId: updaterUserId,
    actorName: updaterUserName,
    note: note || `Status updated to: ${newStatus}`
  })
};
