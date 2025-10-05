/**
 * Test utilities for the notification system
 * These functions can be used to test notifications in development
 */

import { NotificationService, NotificationTemplates } from './notifications';
import { NotificationType } from '@/types/notifications';

/**
 * Create a test notification for the current user
 */
export async function createTestNotification(userId: string) {
  const testData = NotificationTemplates.systemMessage(
    'בדיקת מערכת התראות',
    'זוהי הודעת בדיקה למערכת ההתראות החדשה. אם אתה רואה את זה, המערכת עובדת כראוי!'
  );

  return await NotificationService.createNotification(
    userId,
    NotificationType.SYSTEM_MESSAGE,
    testData
  );
}

/**
 * Create a test transfer request notification
 */
export async function createTestTransferNotification(userId: string) {
  const testData = NotificationTemplates.transferRequest(
    'מתן טל (בדיקה)',
    'רובה M4A1 - בדיקה'
  );
  testData.relatedEquipmentId = 'TEST-M4-001';
  testData.relatedEquipmentDocId = 'TEST-DOC-001';
  testData.relatedTransferId = 'TEST-TRANSFER-001';

  return await NotificationService.createNotification(
    userId,
    NotificationType.TRANSFER_REQUEST,
    testData
  );
}

/**
 * Create multiple test notifications for testing
 */
export async function createMultipleTestNotifications(userId: string, count: number = 3) {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    const testData = NotificationTemplates.systemMessage(
      `הודעת בדיקה ${i + 1}`,
      `זוהי הודעת בדיקה מספר ${i + 1} למערכת ההתראות.`
    );

    promises.push(
      NotificationService.createNotification(
        userId,
        NotificationType.SYSTEM_MESSAGE,
        testData
      )
    );
  }

  return await Promise.all(promises);
}

/**
 * Clean up test notifications
 */
export async function cleanupTestNotifications(userId: string) {
  try {
    const notifications = await NotificationService.getUserNotifications(userId);
    const testNotifications = notifications.filter(n => 
      n.title.includes('בדיקה') || 
      n.message.includes('בדיקה') ||
      n.equipmentName?.includes('בדיקה')
    );

    const deletePromises = testNotifications.map(n => 
      NotificationService.deleteNotification(n.id)
    );

    await Promise.all(deletePromises);
    
    return {
      success: true,
      message: `Cleaned up ${testNotifications.length} test notifications`
    };
  } catch (error) {
    console.error('Error cleaning up test notifications:', error);
    return {
      success: false,
      message: 'Failed to cleanup test notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
