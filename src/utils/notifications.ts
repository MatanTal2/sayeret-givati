import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Notification, 
  NotificationType, 
  CreateNotificationData, 
  NotificationServiceResult,
  BatchNotificationData,
  NotificationFilters 
} from '@/types/notifications';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Centralized Notification Helper
 * Creates and manages notifications in Firestore
 */
export class NotificationService {
  
  /**
   * Create a single notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    data: CreateNotificationData
  ): Promise<NotificationServiceResult> {
    try {
      const notificationRef = collection(db, NOTIFICATIONS_COLLECTION);
      const docRef = await addDoc(notificationRef, {
        userId,
        type,
        title: data.title,
        message: data.message,
        relatedEquipmentId: data.relatedEquipmentId || null,
        relatedEquipmentDocId: data.relatedEquipmentDocId || null,
        relatedTransferId: data.relatedTransferId || null,
        equipmentName: data.equipmentName || null,
        isRead: false,
        createdAt: serverTimestamp(),
        readAt: null
      });

      return {
        success: true,
        message: 'Notification created successfully',
        notificationId: docRef.id
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: 'Failed to create notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create notifications for multiple users (batch operation)
   */
  static async createBatchNotifications(
    batchData: BatchNotificationData
  ): Promise<NotificationServiceResult> {
    try {
      const promises = batchData.userIds.map(userId => 
        this.createNotification(userId, batchData.type, batchData.data)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      return {
        success: successful > 0,
        message: `Created ${successful} out of ${batchData.userIds.length} notifications`
      };
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      return {
        success: false,
        message: 'Failed to create batch notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<NotificationServiceResult> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<NotificationServiceResult> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        })
      );

      await Promise.all(promises);

      return {
        success: true,
        message: `Marked ${snapshot.docs.length} notifications as read`
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<NotificationServiceResult> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await deleteDoc(notificationRef);

      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: 'Failed to delete notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get notifications for a user with filters
   */
  static async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      // Apply filters
      if (filters.isRead !== undefined) {
        q = query(q, where('isRead', '==', filters.isRead));
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Cleanup old notifications (keep only last 100 per user)
   */
  static async cleanupOldNotifications(userId: string): Promise<NotificationServiceResult> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(150) // Get more than 100 to identify old ones
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 100) {
        const toDelete = snapshot.docs.slice(100); // Keep first 100, delete rest
        const deletePromises = toDelete.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        return {
          success: true,
          message: `Cleaned up ${toDelete.length} old notifications`
        };
      }

      return {
        success: true,
        message: 'No cleanup needed'
      };
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return {
        success: false,
        message: 'Failed to cleanup notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Notification Templates for Common Use Cases
 */
export class NotificationTemplates {
  
  static transferRequest(fromUserName: string, equipmentName: string): CreateNotificationData {
    return {
      title: 'בקשת העברה חדשה',
      message: `${fromUserName} העביר לך את הציוד ${equipmentName}`,
      equipmentName
    };
  }

  static transferApproved(toUserName: string, equipmentName: string): CreateNotificationData {
    return {
      title: 'בקשת העברה אושרה',
      message: `${toUserName} אישר את העברת הציוד ${equipmentName}`,
      equipmentName
    };
  }

  static transferRejected(toUserName: string, equipmentName: string): CreateNotificationData {
    return {
      title: 'בקשת העברה נדחתה',
      message: `${toUserName} דחה את העברת הציוד ${equipmentName}`,
      equipmentName
    };
  }

  static transferCompleted(equipmentName: string): CreateNotificationData {
    return {
      title: 'העברת ציוד הושלמה',
      message: `העברת הציוד ${equipmentName} הושלמה בהצלחה`,
      equipmentName
    };
  }

  static equipmentStatusChanged(equipmentName: string, newStatus: string): CreateNotificationData {
    return {
      title: 'סטטוס ציוד עודכן',
      message: `סטטוס הציוד ${equipmentName} עודכן ל: ${newStatus}`,
      equipmentName
    };
  }

  static maintenanceDue(equipmentName: string): CreateNotificationData {
    return {
      title: 'תחזוקה נדרשת',
      message: `הציוד ${equipmentName} דורש תחזוקה`,
      equipmentName
    };
  }

  static dailyCheckReminder(equipmentName: string): CreateNotificationData {
    return {
      title: 'תזכורת בדיקה יומית',
      message: `נדרש לבצע בדיקה יומית עבור ${equipmentName}`,
      equipmentName
    };
  }

  static systemMessage(title: string, message: string): CreateNotificationData {
    return {
      title,
      message
    };
  }
}

/**
 * Helper functions for common notification operations
 */

// Transfer-related notifications
export async function notifyTransferRequest(
  toUserId: string,
  fromUserName: string,
  equipmentName: string,
  equipmentId?: string,
  equipmentDocId?: string,
  transferId?: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.transferRequest(fromUserName, equipmentName);
  data.relatedEquipmentId = equipmentId;
  data.relatedEquipmentDocId = equipmentDocId;
  data.relatedTransferId = transferId;
  
  return NotificationService.createNotification(
    toUserId,
    NotificationType.TRANSFER_REQUEST,
    data
  );
}

export async function notifyTransferApproved(
  fromUserId: string,
  toUserName: string,
  equipmentName: string,
  equipmentId?: string,
  equipmentDocId?: string,
  transferId?: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.transferApproved(toUserName, equipmentName);
  data.relatedEquipmentId = equipmentId;
  data.relatedEquipmentDocId = equipmentDocId;
  data.relatedTransferId = transferId;
  
  return NotificationService.createNotification(
    fromUserId,
    NotificationType.TRANSFER_APPROVED,
    data
  );
}

export async function notifyTransferRejected(
  fromUserId: string,
  toUserName: string,
  equipmentName: string,
  equipmentId?: string,
  equipmentDocId?: string,
  transferId?: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.transferRejected(toUserName, equipmentName);
  data.relatedEquipmentId = equipmentId;
  data.relatedEquipmentDocId = equipmentDocId;
  data.relatedTransferId = transferId;
  
  return NotificationService.createNotification(
    fromUserId,
    NotificationType.TRANSFER_REJECTED,
    data
  );
}

export async function notifyTransferCompleted(
  userIds: string[],
  equipmentName: string,
  equipmentId?: string,
  equipmentDocId?: string,
  transferId?: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.transferCompleted(equipmentName);
  data.relatedEquipmentId = equipmentId;
  data.relatedEquipmentDocId = equipmentDocId;
  data.relatedTransferId = transferId;
  
  return NotificationService.createBatchNotifications({
    userIds,
    type: NotificationType.TRANSFER_COMPLETED,
    data
  });
}

export async function notifyTransferReminder(
  toUserId: string,
  fromUserName: string,
  equipmentName: string,
  equipmentId?: string,
  equipmentDocId?: string,
  transferId?: string
): Promise<NotificationServiceResult> {
  const data: CreateNotificationData = {
    title: 'תזכורת - בקשת העברת ציוד',
    message: `${fromUserName} שלח לך תזכורת לגבי בקשת העברת הציוד ${equipmentName}`,
    ...(equipmentId && { relatedEquipmentId: equipmentId }),
    ...(equipmentDocId && { relatedEquipmentDocId: equipmentDocId }),
    ...(transferId && { relatedTransferId: transferId })
  };
  
  return NotificationService.createNotification(
    toUserId,
    NotificationType.TRANSFER_REQUEST, // Reuse the same type as original request
    data
  );
}

// Equipment-related notifications
export async function notifyEquipmentStatusChange(
  userId: string,
  equipmentName: string,
  newStatus: string,
  equipmentId?: string,
  equipmentDocId?: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.equipmentStatusChanged(equipmentName, newStatus);
  data.relatedEquipmentId = equipmentId;
  data.relatedEquipmentDocId = equipmentDocId;
  
  return NotificationService.createNotification(
    userId,
    NotificationType.EQUIPMENT_STATUS_CHANGE,
    data
  );
}

// System notifications
export async function notifySystemMessage(
  userIds: string[],
  title: string,
  message: string
): Promise<NotificationServiceResult> {
  const data = NotificationTemplates.systemMessage(title, message);
  
  return NotificationService.createBatchNotifications({
    userIds,
    type: NotificationType.SYSTEM_MESSAGE,
    data
  });
}
