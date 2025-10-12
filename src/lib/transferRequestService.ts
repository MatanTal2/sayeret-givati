/**
 * Transfer Request Service
 * Handles all operations for the transferRequests collection
 * Integrates with actionsLog and equipment tracking history
 */

import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  TransferRequest, 
  TransferStatus, 
  TransferStatusHistoryEntry,
  Equipment,
  EquipmentStatus
} from '@/types/equipment';
import { createActionLog, ActionLogHelpers } from './actionsLogService';
import { 
  addTrackingHistoryEntry, 
  createTransferRequestedEntry,
  createTransferApprovedEntry,
  createTransferRejectedEntry,
  createTransferCancelledEntry
} from './equipmentHistoryService';
import { 
  notifyTransferRequest,
  notifyTransferApproved,
  notifyTransferRejected,
  notifyTransferCompleted,
  notifyTransferReminder
} from '@/utils/notifications';

const TRANSFER_REQUESTS_COLLECTION = 'transferRequests';
const EQUIPMENT_COLLECTION = 'equipment';

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
    return await runTransaction(db, async (transaction) => {
      // Get equipment document
      const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentDocId);
      const equipmentDoc = await transaction.get(equipmentRef);
      
      if (!equipmentDoc.exists()) {
        throw new Error('Equipment not found');
      }

      const equipment = { id: equipmentDoc.id, ...equipmentDoc.data() } as Equipment;

      // Create transfer request
      const now = Timestamp.now();
      const transferRequestData: Omit<TransferRequest, 'id'> = {
        equipmentId: equipment.id,
        equipmentDocId: equipmentDocId,
        equipmentName: equipment.productName,
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        reason,
        note,
        status: TransferStatus.PENDING,
        statusHistory: [{
          status: TransferStatus.PENDING,
          timestamp: now, // Use regular timestamp instead of serverTimestamp() in array
          updatedBy: fromUserId,
          updatedByName: fromUserName,
          note: 'Transfer request created'
        }],
        createdAt: serverTimestamp() as Timestamp
      };

      // Add transfer request document
      const transferRequestRef = await addDoc(collection(db, TRANSFER_REQUESTS_COLLECTION), transferRequestData);

      // Update equipment status and tracking history
      const newHistoryEntry = createTransferRequestedEntry(
        fromUserName,
        toUserName,
        equipment.location,
        reason,
        fromUserId
      );

      const updatedTrackingHistory = addTrackingHistoryEntry(
        equipment.trackingHistory || [],
        newHistoryEntry
      );

      transaction.update(equipmentRef, {
        status: EquipmentStatus.PENDING_TRANSFER,
        trackingHistory: updatedTrackingHistory,
        updatedAt: serverTimestamp()
      });

      // Send notification to recipient after transaction completes
      const transferRequestId = transferRequestRef.id;
      
      // Note: We'll send the notification outside the transaction to avoid blocking
      // the transaction on external service calls
      setTimeout(async () => {
        try {
          await notifyTransferRequest(
            toUserId,
            fromUserName,
            equipment.productName,
            equipment.id,
            equipmentDocId,
            transferRequestId
          );
        } catch (error) {
          console.error('Error sending transfer request notification:', error);
          // Don't throw - notification failure shouldn't break the transfer request
        }
      }, 100);

      return transferRequestId;
    });
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
    await runTransaction(db, async (transaction) => {
      // Get transfer request
      const transferRequestRef = doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId);
      const transferRequestDoc = await transaction.get(transferRequestRef);
      
      if (!transferRequestDoc.exists()) {
        throw new Error('Transfer request not found');
      }

      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;

      if (transferRequest.status !== TransferStatus.PENDING) {
        throw new Error('Transfer request is not pending');
      }

      // Get equipment document
      const equipmentRef = doc(db, EQUIPMENT_COLLECTION, transferRequest.equipmentDocId);
      const equipmentDoc = await transaction.get(equipmentRef);
      
      if (!equipmentDoc.exists()) {
        throw new Error('Equipment not found');
      }

      const equipment = { id: equipmentDoc.id, ...equipmentDoc.data() } as Equipment;

      // Update transfer request status
      const now = Timestamp.now();
      const newStatusEntry: TransferStatusHistoryEntry = {
        status: TransferStatus.APPROVED,
        timestamp: now, // Use regular timestamp instead of serverTimestamp() in array
        updatedBy: approverUserId,
        updatedByName: approverUserName,
        note: approvalNote
      };

      transaction.update(transferRequestRef, {
        status: TransferStatus.APPROVED,
        statusHistory: [...transferRequest.statusHistory, newStatusEntry]
      });

      // Update equipment - transfer to new holder
      const newHistoryEntry = createTransferApprovedEntry(
        transferRequest.toUserName,
        equipment.location, // Keep current location unless specified otherwise
        approverUserId,
        approverUserName,
        approvalNote
      );

      const updatedTrackingHistory = addTrackingHistoryEntry(
        equipment.trackingHistory || [],
        newHistoryEntry
      );

      transaction.update(equipmentRef, {
        currentHolder: transferRequest.toUserId,
        currentHolderName: transferRequest.toUserName,
        status: EquipmentStatus.AVAILABLE, // Reset to available after successful transfer
        trackingHistory: updatedTrackingHistory,
        updatedAt: serverTimestamp()
      });
    });

    // Create action log entry (outside transaction to avoid conflicts)
    const transferRequestDoc = await getDoc(doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId));
    if (transferRequestDoc.exists()) {
      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;
      
      await createActionLog(ActionLogHelpers.transferApproved(
        transferRequest.equipmentId,
        transferRequest.equipmentDocId,
        transferRequest.equipmentName,
        approverUserId,
        approverUserName,
        transferRequest.toUserId,
        transferRequest.toUserName,
        approvalNote
      ));

      // Send notifications
      try {
        // Notify the original requester that their request was approved
        await notifyTransferApproved(
          transferRequest.fromUserId,
          approverUserName,
          transferRequest.equipmentName,
          transferRequest.equipmentId,
          transferRequest.equipmentDocId,
          transferRequestId
        );

        // Notify both parties that the transfer is completed
        await notifyTransferCompleted(
          [transferRequest.fromUserId, transferRequest.toUserId],
          transferRequest.equipmentName,
          transferRequest.equipmentId,
          transferRequest.equipmentDocId,
          transferRequestId
        );
      } catch (error) {
        console.error('Error sending transfer approval notifications:', error);
        // Don't throw - notification failure shouldn't break the approval
      }
    }
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
    await runTransaction(db, async (transaction) => {
      // Get transfer request
      const transferRequestRef = doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId);
      const transferRequestDoc = await transaction.get(transferRequestRef);
      
      if (!transferRequestDoc.exists()) {
        throw new Error('Transfer request not found');
      }

      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;

      if (transferRequest.status !== TransferStatus.PENDING) {
        throw new Error('Transfer request is not pending');
      }

      // Get equipment document
      const equipmentRef = doc(db, EQUIPMENT_COLLECTION, transferRequest.equipmentDocId);
      const equipmentDoc = await transaction.get(equipmentRef);
      
      if (!equipmentDoc.exists()) {
        throw new Error('Equipment not found');
      }

      const equipment = { id: equipmentDoc.id, ...equipmentDoc.data() } as Equipment;

      // Update transfer request status
      const now = Timestamp.now();
      const newStatusEntry: TransferStatusHistoryEntry = {
        status: TransferStatus.REJECTED,
        timestamp: now, // Use regular timestamp instead of serverTimestamp() in array
        updatedBy: rejectorUserId,
        updatedByName: rejectorUserName,
        note: rejectionReason
      };

      transaction.update(transferRequestRef, {
        status: TransferStatus.REJECTED,
        statusHistory: [...transferRequest.statusHistory, newStatusEntry]
      });

      // Update equipment - revert status back to available
      const newHistoryEntry = createTransferRejectedEntry(
        transferRequest.fromUserName,
        equipment.location,
        rejectorUserId,
        rejectorUserName,
        rejectionReason
      );

      const updatedTrackingHistory = addTrackingHistoryEntry(
        equipment.trackingHistory || [],
        newHistoryEntry
      );

      transaction.update(equipmentRef, {
        status: EquipmentStatus.AVAILABLE, // Reset to available after rejection
        trackingHistory: updatedTrackingHistory,
        updatedAt: serverTimestamp()
      });
    });

    // Create action log entry (outside transaction to avoid conflicts)
    const transferRequestDoc = await getDoc(doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId));
    if (transferRequestDoc.exists()) {
      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;
      
      await createActionLog(ActionLogHelpers.transferRejected(
        transferRequest.equipmentId,
        transferRequest.equipmentDocId,
        transferRequest.equipmentName,
        rejectorUserId,
        rejectorUserName,
        transferRequest.fromUserId,
        transferRequest.fromUserName,
        rejectionReason
      ));

      // Send notification to the original requester
      try {
        await notifyTransferRejected(
          transferRequest.fromUserId,
          rejectorUserName,
          transferRequest.equipmentName,
          transferRequest.equipmentId,
          transferRequest.equipmentDocId,
          transferRequestId
        );
      } catch (error) {
        console.error('Error sending transfer rejection notification:', error);
        // Don't throw - notification failure shouldn't break the rejection
      }
    }
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

/**
 * Get pending transfer request for a specific equipment item
 */
export async function getPendingTransferRequestForEquipment(equipmentDocId: string): Promise<TransferRequest | null> {
  try {
    const q = query(
      collection(db, TRANSFER_REQUESTS_COLLECTION),
      where('equipmentDocId', '==', equipmentDocId),
      where('status', '==', TransferStatus.PENDING),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0]; // Get the most recent pending request
    return {
      id: doc.id,
      ...doc.data()
    } as TransferRequest;
  } catch (error) {
    console.error('Error fetching pending transfer request for equipment:', error);
    throw new Error('Failed to fetch pending transfer request');
  }
}

/**
 * Cancel a transfer request (by the original requester)
 */
export async function cancelTransferRequest(
  transferRequestId: string,
  cancellerUserId: string,
  cancellerUserName: string,
  cancellationReason?: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get transfer request
      const transferRequestRef = doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId);
      const transferRequestDoc = await transaction.get(transferRequestRef);
      
      if (!transferRequestDoc.exists()) {
        throw new Error('Transfer request not found');
      }

      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;

      if (transferRequest.status !== TransferStatus.PENDING) {
        throw new Error('Transfer request is not pending');
      }

      // Only allow the original requester to cancel
      if (transferRequest.fromUserId !== cancellerUserId) {
        throw new Error('Only the original requester can cancel the transfer');
      }

      // Get equipment document
      const equipmentRef = doc(db, EQUIPMENT_COLLECTION, transferRequest.equipmentDocId);
      const equipmentDoc = await transaction.get(equipmentRef);
      
      if (!equipmentDoc.exists()) {
        throw new Error('Equipment not found');
      }

      const equipment = { id: equipmentDoc.id, ...equipmentDoc.data() } as Equipment;

      // Update transfer request status
      const now = Timestamp.now();
      const newStatusEntry: TransferStatusHistoryEntry = {
        status: TransferStatus.CANCELLED,
        timestamp: now,
        updatedBy: cancellerUserId,
        updatedByName: cancellerUserName,
        note: cancellationReason || 'Transfer cancelled by requester'
      };

      transaction.update(transferRequestRef, {
        status: TransferStatus.CANCELLED,
        statusHistory: [...transferRequest.statusHistory, newStatusEntry]
      });

      // Update equipment - revert status back to available
      const newHistoryEntry = createTransferCancelledEntry(
        transferRequest.fromUserName,
        equipment.location,
        cancellerUserId,
        cancellationReason || 'Transfer cancelled by requester'
      );

      const updatedTrackingHistory = addTrackingHistoryEntry(
        equipment.trackingHistory || [],
        newHistoryEntry
      );

      transaction.update(equipmentRef, {
        status: EquipmentStatus.AVAILABLE, // Reset to available after cancellation
        trackingHistory: updatedTrackingHistory,
        updatedAt: serverTimestamp()
      });
    });

    // Create action log entry (outside transaction to avoid conflicts)
    const transferRequestDoc = await getDoc(doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId));
    if (transferRequestDoc.exists()) {
      const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;
      
      await createActionLog(ActionLogHelpers.transferCancelled(
        transferRequest.equipmentId,
        transferRequest.equipmentDocId,
        transferRequest.equipmentName,
        cancellerUserId,
        cancellerUserName,
        transferRequest.toUserId,
        transferRequest.toUserName,
        cancellationReason
      ));
    }
  } catch (error) {
    console.error('Error cancelling transfer request:', error);
    throw new Error('Failed to cancel transfer request');
  }
}

/**
 * Send a reminder notification for a pending transfer request
 */
export async function sendTransferReminder(
  transferRequestId: string,
  reminderId: string,
  reminderName: string
): Promise<void> {
  try {
    // Get transfer request
    const transferRequestRef = doc(db, TRANSFER_REQUESTS_COLLECTION, transferRequestId);
    const transferRequestDoc = await getDoc(transferRequestRef);
    
    if (!transferRequestDoc.exists()) {
      throw new Error('Transfer request not found');
    }

    const transferRequest = { id: transferRequestDoc.id, ...transferRequestDoc.data() } as TransferRequest;

    if (transferRequest.status !== TransferStatus.PENDING) {
      throw new Error('Transfer request is not pending');
    }

    // Only allow the original requester to send reminders
    if (transferRequest.fromUserId !== reminderId) {
      throw new Error('Only the original requester can send reminders');
    }

    // Send reminder notification
    await notifyTransferReminder(
      transferRequest.toUserId,
      reminderName,
      transferRequest.equipmentName,
      transferRequest.equipmentId,
      transferRequest.equipmentDocId,
      transferRequestId
    );
  } catch (error) {
    console.error('Error sending transfer reminder:', error);
    throw new Error('Failed to send transfer reminder');
  }
}