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
import { useAuth } from '@/contexts/AuthContext';
import { 
  Notification, 
  NotificationContextType, 
  UseNotificationsReturn 
} from '@/types/notifications';
import { NotificationService } from '@/utils/notifications';

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

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await NotificationService.markAllAsRead(user.uid);
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.uid]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
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
      case 'transfer_request':
        return '📤';
      case 'transfer_approved':
        return '✅';
      case 'transfer_rejected':
        return '❌';
      case 'transfer_completed':
        return '🔄';
      case 'equipment_update':
        return '🔧';
      case 'equipment_status_change':
        return '📊';
      case 'system_message':
        return '📢';
      case 'maintenance_due':
        return '⚠️';
      case 'commander_message':
        return '👨‍✈️';
      case 'daily_check_reminder':
        return '📋';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'transfer_request':
        return 'text-blue-600';
      case 'transfer_approved':
        return 'text-green-600';
      case 'transfer_rejected':
        return 'text-red-600';
      case 'transfer_completed':
        return 'text-purple-600';
      case 'equipment_update':
        return 'text-orange-600';
      case 'equipment_status_change':
        return 'text-indigo-600';
      case 'system_message':
        return 'text-gray-600';
      case 'maintenance_due':
        return 'text-yellow-600';
      case 'commander_message':
        return 'text-blue-800';
      case 'daily_check_reminder':
        return 'text-teal-600';
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
    if (notification.createdAt instanceof Timestamp) {
      createdAtDate = notification.createdAt.toDate();
    } else if (notification.createdAt && typeof notification.createdAt === 'object' && 'getTime' in notification.createdAt) {
      // Handle case where createdAt is already a Date object
      createdAtDate = notification.createdAt as Date;
    } else {
      // Handle case where createdAt is a string or number
      createdAtDate = new Date(notification.createdAt as any);
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
      equipmentName: notification.equipmentName
    };
  });

  return {
    displayNotifications,
    getNotificationIcon,
    getNotificationColor,
    getTimeAgo
  };
}
