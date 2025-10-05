'use client';

import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NOTIFICATIONS } from '@/constants/text';
import { NotificationDisplayData } from '@/types/notifications';

interface NotificationItemProps {
  notification: NotificationDisplayData;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // TODO: Navigate to related content if applicable
    // This could be implemented later to navigate to equipment or transfer details
  };

  return (
    <div
      className={`
        p-4 hover:bg-gray-50 cursor-pointer transition-colors relative
        ${!notification.isRead ? 'bg-blue-50/30 border-r-2 border-blue-500' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
          ${!notification.isRead ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <span>{notification.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={`
                text-sm font-medium truncate
                ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}
              `}>
                {notification.title}
              </h4>
              <p className={`
                text-sm mt-1 line-clamp-2
                ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}
              `}>
                {notification.message}
              </p>
              
              {/* Equipment name if available */}
              {notification.equipmentName && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {notification.equipmentName}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title={NOTIFICATIONS.MARK_AS_READ}
                  aria-label={NOTIFICATIONS.MARK_AS_READ}
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
              
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title={NOTIFICATIONS.DELETE_NOTIFICATION}
                aria-label={NOTIFICATIONS.DELETE_NOTIFICATION}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className={`
              text-xs
              ${!notification.isRead ? 'text-gray-600' : 'text-gray-400'}
            `}>
              {notification.timeAgo}
            </span>

            {/* Type indicator */}
            <span className={`
              text-xs px-2 py-0.5 rounded-full
              ${notification.color} bg-opacity-10
            `}>
              {getTypeLabel(notification.type)}
            </span>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>
  );
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'transfer_request':
      return 'בקשת העברה';
    case 'transfer_approved':
      return 'אושר';
    case 'transfer_rejected':
      return 'נדחה';
    case 'transfer_completed':
      return 'הושלם';
    case 'equipment_update':
      return 'עדכון ציוד';
    case 'equipment_status_change':
      return 'שינוי סטטוס';
    case 'system_message':
      return 'מערכת';
    case 'maintenance_due':
      return 'תחזוקה';
    case 'commander_message':
      return 'מפקד';
    case 'daily_check_reminder':
      return 'בדיקה יומית';
    default:
      return 'התראה';
  }
}
