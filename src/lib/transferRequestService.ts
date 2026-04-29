/**
 * Transfer Request Service
 * Handles all operations for the transferRequests collection
 * Integrates with actionsLog and equipment tracking history
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import {
  TransferRequest,
  TransferStatus,
  Equipment,
} from '@/types/equipment';
import {
  createTransferRequestedEntry,
} from './equipmentHistoryService';
import { COLLECTIONS } from '@/lib/db/collections';

const TRANSFER_REQUESTS_COLLECTION = COLLECTIONS.TRANSFER_REQUESTS;
const EQUIPMENT_COLLECTION = COLLECTIONS.EQUIPMENT;

/**
 * Create a new transfer request
 */
export async function createTransferRequest(
  equipmentDocId: string,
  toUserId: string,
  toUserName: string,
  reason: string,
  fromUserId: string,
  fromUserName: string,
  note?: string
): Promise<string> {
  try {
    // Read equipment to build tracking history entry (client SDK read)
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentDocId);
    const equipmentDoc = await getDoc(equipmentRef);

    if (!equipmentDoc.exists()) {
      throw new Error('Equipment not found');
    }

    const equipment = { id: equipmentDoc.id, ...equipmentDoc.data() } as Equipment;

    const historyEntry = createTransferRequestedEntry(
      fromUserName, toUserName, equipment.location, reason, fromUserId
    );

    // Create transfer request via server API route (firebase-admin transaction)
    const response = await apiFetch('/api/transfer-requests', {
      method: 'POST',
      body: JSON.stringify({
        equipmentDocId, toUserId, toUserName, reason, fromUserId, fromUserName,
        ...(note ? { note } : {}),
        trackingHistoryEntry: historyEntry,
        currentTrackingHistory: equipment.trackingHistory || [],
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create transfer request');

    const transferRequestId = result.id;

    // Notifications are now created server-side in the transfer request API route

    return transferRequestId;
  } catch (error) {
    console.error('Error creating transfer request:', error);
    throw new Error('Failed to create transfer request');
  }
}

/**
 * Approve a transfer request
 */
export async function approveTransferRequest(
  transferRequestId: string,
  approverUserId: string,
  approverUserName: string,
  approvalNote?: string
): Promise<void> {
  try {
    // Approve via server API route (firebase-admin transaction)
    const response = await apiFetch('/api/transfer-requests/approve', {
      method: 'POST',
      body: JSON.stringify({
        transferRequestId, approverUserName,
        ...(approvalNote ? { approvalNote } : {}),
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to approve transfer request');

    // Notifications are now created server-side in the approve API route
  } catch (error) {
    console.error('Error approving transfer request:', error);
    throw new Error('Failed to approve transfer request');
  }
}

/**
 * Reject a transfer request
 */
export async function rejectTransferRequest(
  transferRequestId: string,
  rejectorUserId: string,
  rejectorUserName: string,
  rejectionReason?: string
): Promise<void> {
  try {
    // Reject via server API route (firebase-admin transaction)
    const response = await apiFetch('/api/transfer-requests/reject', {
      method: 'POST',
      body: JSON.stringify({
        transferRequestId, rejectorUserName,
        ...(rejectionReason ? { rejectionReason } : {}),
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to reject transfer request');

    // Notifications are now created server-side in the reject API route
  } catch (error) {
    console.error('Error rejecting transfer request:', error);
    throw new Error('Failed to reject transfer request');
  }
}

/**
 * Get transfer requests for a specific equipment item
 */
export async function getEquipmentTransferRequests(equipmentDocId: string): Promise<TransferRequest[]> {
  try {
    const q = query(
      collection(db, TRANSFER_REQUESTS_COLLECTION),
      where('equipmentDocId', '==', equipmentDocId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TransferRequest));
  } catch (error) {
    console.error('Error fetching equipment transfer requests:', error);
    throw new Error('Failed to fetch equipment transfer requests');
  }
}

/**
 * Get pending transfer requests for a user (as recipient)
 */
export async function getPendingTransferRequestsForUser(userId: string): Promise<TransferRequest[]> {
  try {
    const q = query(
      collection(db, TRANSFER_REQUESTS_COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', TransferStatus.PENDING),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TransferRequest));
  } catch (error) {
    console.error('Error fetching pending transfer requests for user:', error);
    throw new Error('Failed to fetch pending transfer requests');
  }
}

/**
 * Get all pending transfer requests (for admins)
 */
export async function getAllPendingTransferRequests(): Promise<TransferRequest[]> {
  try {
    const q = query(
      collection(db, TRANSFER_REQUESTS_COLLECTION),
      where('status', '==', TransferStatus.PENDING),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TransferRequest));
  } catch (error) {
    console.error('Error fetching all pending transfer requests:', error);
    throw new Error('Failed to fetch all pending transfer requests');
  }
}
