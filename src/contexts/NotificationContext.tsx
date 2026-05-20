'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Unsubscribe,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/contexts/AuthContext';
import {
  Notification,
  NotificationContextType,
  NotificationType,
  UseNotificationsReturn
} from '@/types/notifications';
import { NotificationService } from '@/utils/notifications'; // kept for client-side reads only

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Setup real-time listener
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeListener = onSnapshot(
      q,
      (snapshot) => {
        const notificationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        
        setNotifications(notificationData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => unsubscribeListener);

    // Cleanup function
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [user?.uid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Mark single notification as read (via server API route)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiFetch('/api/notifications/read', {
        method: 'PUT',
        body: JSON.stringify({ notificationId }),
      });
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read (via server API route)
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await apiFetch('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.uid]);

  // Delete notification (via server API route)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await apiFetch('/api/notifications', {
        method: 'DELETE',
        body: JSON.stringify({ id: notificationId }),
      });
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Refresh notifications (force reload)
  const refreshNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // The real-time listener will automatically update the data
      // This function is mainly for manual refresh if needed
      const freshNotifications = await NotificationService.getUserNotifications(user.uid);
      setNotifications(freshNotifications);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notifications
export function useNotifications(): UseNotificationsReturn {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}

// Helper hook for notification display data
export function useNotificationDisplay() {
  const { notifications } = useNotifications();

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case NotificationType.TRANSFER_REQUEST:
        return '📤';
      case NotificationType.TRANSFER_APPROVED:
        return '✅';
      case NotificationType.TRANSFER_REJECTED:
        return '❌';
      case NotificationType.TRANSFER_COMPLETED:
        return '🔄';
      case NotificationType.EQUIPMENT_STATUS_CHANGE:
        return '📊';
      case NotificationType.SYSTEM_MESSAGE:
        return '📢';
      case NotificationType.TEMPLATE_REQUEST_APPROVED:
        return '✅';
      case NotificationType.TEMPLATE_REQUEST_REJECTED:
        return '❌';
      case NotificationType.TEMPLATE_PROPOSED_FOR_REVIEW:
        return '📝';
      case NotificationType.NEW_TEMPLATE_REQUEST_FOR_REVIEW:
        return '🆕';
      case NotificationType.RETIREMENT_REQUEST_APPROVAL:
        return '📦';
      case NotificationType.RETIREMENT_APPROVED:
        return '✅';
      case NotificationType.RETIREMENT_REJECTED:
        return '❌';
      case NotificationType.REPORT_REQUESTED:
        return '📋';
      case NotificationType.FORCE_TRANSFER_EXECUTED:
      case NotificationType.FORCE_SIGNER_CHANGED:
        return '⚡';
      case NotificationType.EXCHANGE_REQUEST_APPROVAL:
        return '🔁';
      case NotificationType.EXCHANGE_APPROVED:
        return '✅';
      case NotificationType.EXCHANGE_REJECTED:
        return '❌';
      case NotificationType.EXCHANGE_COMPLETED:
        return '✔️';
      case NotificationType.GUARD_SCHEDULE_SHARED:
        return '🕐';
      case NotificationType.AMMO_REPORT_REQUESTED:
        return '📋';
      case NotificationType.AMMO_REPORT_SUBMITTED:
        return '🎯';
      case NotificationType.AMMO_RESTOCK_REQUEST:
        return '📦';
      case NotificationType.AMMO_ASSIGNED_FROM_CENTRAL:
        return '🎯';
      case NotificationType.TRAINING_PLAN_SUBMITTED:
        return '📝';
      case NotificationType.TRAINING_PLAN_APPROVED:
        return '✅';
      case NotificationType.TRAINING_PLAN_REJECTED:
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case NotificationType.TRANSFER_REQUEST:
        return 'text-blue-600';
      case NotificationType.TRANSFER_APPROVED:
        return 'text-green-600';
      case NotificationType.TRANSFER_REJECTED:
        return 'text-red-600';
      case NotificationType.TRANSFER_COMPLETED:
        return 'text-purple-600';
      case NotificationType.EQUIPMENT_STATUS_CHANGE:
        return 'text-indigo-600';
      case NotificationType.SYSTEM_MESSAGE:
        return 'text-gray-600';
      case NotificationType.TEMPLATE_REQUEST_APPROVED:
        return 'text-success-600';
      case NotificationType.TEMPLATE_REQUEST_REJECTED:
        return 'text-danger-600';
      case NotificationType.TEMPLATE_PROPOSED_FOR_REVIEW:
        return 'text-info-600';
      case NotificationType.NEW_TEMPLATE_REQUEST_FOR_REVIEW:
        return 'text-info-700';
      case NotificationType.RETIREMENT_REQUEST_APPROVAL:
        return 'text-warning-700';
      case NotificationType.RETIREMENT_APPROVED:
        return 'text-success-700';
      case NotificationType.RETIREMENT_REJECTED:
        return 'text-danger-700';
      case NotificationType.REPORT_REQUESTED:
        return 'text-primary-600';
      case NotificationType.FORCE_TRANSFER_EXECUTED:
      case NotificationType.FORCE_SIGNER_CHANGED:
        return 'text-orange-600';
      case NotificationType.EXCHANGE_REQUEST_APPROVAL:
        return 'text-warning-600';
      case NotificationType.EXCHANGE_APPROVED:
        return 'text-success-600';
      case NotificationType.EXCHANGE_REJECTED:
        return 'text-danger-600';
      case NotificationType.EXCHANGE_COMPLETED:
        return 'text-success-700';
      case NotificationType.GUARD_SCHEDULE_SHARED:
        return 'text-info-600';
      case NotificationType.AMMO_REPORT_REQUESTED:
        return 'text-primary-600';
      case NotificationType.AMMO_REPORT_SUBMITTED:
        return 'text-success-600';
      case NotificationType.AMMO_RESTOCK_REQUEST:
        return 'text-warning-600';
      case NotificationType.AMMO_ASSIGNED_FROM_CENTRAL:
        return 'text-info-700';
      case NotificationType.TRAINING_PLAN_SUBMITTED:
        return 'text-info-600';
      case NotificationType.TRAINING_PLAN_APPROVED:
        return 'text-success-600';
      case NotificationType.TRAINING_PLAN_REJECTED:
        return 'text-danger-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTimeAgo = (timestamp: Timestamp | Date | string | number | null | undefined): string => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'עכשיו';
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
    
    return date.toLocaleDateString('he-IL');
  };

  const displayNotifications = notifications.map(notification => {
    let createdAtDate: Date;
    
    // Handle Firestore Timestamp
    if (notification.createdAt instanceof Timestamp) {
      createdAtDate = notification.createdAt.toDate();
    } 
    // Handle Date object (fallback for data inconsistencies)
    else if (notification.createdAt && typeof notification.createdAt === 'object' && 'getTime' in notification.createdAt) {
      createdAtDate = notification.createdAt as Date;
    } 
    // Handle other formats (string, number, etc.) - defensive programming
    else {
      try {
        createdAtDate = new Date(notification.createdAt as unknown as string | number | Date);
      } catch {
        // Fallback to current date if parsing fails
        createdAtDate = new Date();
      }
    }

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: createdAtDate,
      timeAgo: getTimeAgo(notification.createdAt),
      icon: getNotificationIcon(notification.type),
      color: getNotificationColor(notification.type),
      equipmentName: notification.equipmentName,
      relatedEquipmentDocId: notification.relatedEquipmentDocId,
      relatedTransferId: notification.relatedTransferId,
    };
  });

  return {
    displayNotifications,
    getNotificationIcon,
    getNotificationColor,
    getTimeAgo
  };
}
