'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NOTIFICATIONS } from '@/constants/text';
import { NotificationDisplayData, NotificationType } from '@/types/notifications';

interface NotificationItemProps {
  notification: NotificationDisplayData;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const router = useRouter();

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
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const target = resolveNotificationTarget(notification);
    if (target) router.push(target);
  };

  return (
    <div
      className={`
        p-4 hover:bg-gray-50 cursor-pointer transition-colors relative
        ${!notification.isRead ? 'bg-blue-50/30 border-e-2 border-blue-500' : ''}
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
        <div className="absolute top-4 end-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>
  );
}

export function resolveNotificationTarget(n: NotificationDisplayData): string | null {
  if (n.type === NotificationType.TEMPLATE_REQUEST_APPROVED) {
    return n.relatedEquipmentDocId
      ? `/equipment?resumeTemplate=${n.relatedEquipmentDocId}`
      : '/equipment';
  }
  const equipmentTypes: ReadonlySet<NotificationType> = new Set([
    NotificationType.TRANSFER_REQUEST,
    NotificationType.TRANSFER_APPROVED,
    NotificationType.TRANSFER_REJECTED,
    NotificationType.TRANSFER_COMPLETED,
    NotificationType.EQUIPMENT_STATUS_CHANGE,
    NotificationType.RETIREMENT_REQUEST_APPROVAL,
    NotificationType.RETIREMENT_APPROVED,
    NotificationType.RETIREMENT_REJECTED,
    NotificationType.REPORT_REQUESTED,
    NotificationType.FORCE_TRANSFER_EXECUTED,
    NotificationType.FORCE_SIGNER_CHANGED,
    NotificationType.EXCHANGE_REQUEST_APPROVAL,
    NotificationType.EXCHANGE_APPROVED,
    NotificationType.EXCHANGE_REJECTED,
    NotificationType.EXCHANGE_COMPLETED,
  ]);
  if (equipmentTypes.has(n.type)) return '/equipment';

  const managementTypes: ReadonlySet<NotificationType> = new Set([
    NotificationType.TEMPLATE_PROPOSED_FOR_REVIEW,
    NotificationType.NEW_TEMPLATE_REQUEST_FOR_REVIEW,
    NotificationType.TEMPLATE_REQUEST_REJECTED,
  ]);
  if (managementTypes.has(n.type)) return '/management?tab=template-management';

  if (n.type === NotificationType.AMMO_REPORT_SUBMITTED) return '/ammunition';
  if (n.type === NotificationType.AMMO_REPORT_REQUESTED) {
    return n.relatedEquipmentDocId
      ? `/ammunition?requestId=${n.relatedEquipmentDocId}`
      : '/ammunition';
  }
  if (n.type === NotificationType.AMMO_ASSIGNED_FROM_CENTRAL) return '/ammunition';

  const trainingTypes: ReadonlySet<NotificationType> = new Set([
    NotificationType.TRAINING_PLAN_SUBMITTED,
    NotificationType.TRAINING_PLAN_APPROVED,
    NotificationType.TRAINING_PLAN_REJECTED,
    NotificationType.AMMO_RESTOCK_REQUEST,
  ]);
  if (trainingTypes.has(n.type)) {
    return n.relatedEquipmentDocId
      ? `/ammunition/training?planId=${n.relatedEquipmentDocId}`
      : '/ammunition/training';
  }

  if (n.type === NotificationType.GUARD_SCHEDULE_SHARED) {
    return n.relatedGuardScheduleId
      ? `/guard-scheduler/${n.relatedGuardScheduleId}`
      : '/guard-scheduler';
  }

  if (n.type === NotificationType.SYSTEM_MESSAGE) return '/';

  return null;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case NotificationType.TRANSFER_REQUEST:
      return 'בקשת העברה';
    case NotificationType.TRANSFER_APPROVED:
      return 'אושר';
    case NotificationType.TRANSFER_REJECTED:
      return 'נדחה';
    case NotificationType.TRANSFER_COMPLETED:
      return 'הושלם';
    case NotificationType.EQUIPMENT_STATUS_CHANGE:
      return 'שינוי סטטוס';
    case NotificationType.SYSTEM_MESSAGE:
      return 'מערכת';
    case NotificationType.AMMO_REPORT_SUBMITTED:
      return 'דיווח תחמושת';
    case NotificationType.AMMO_REPORT_REQUESTED:
      return 'בקשת דיווח תחמושת';
    case NotificationType.GUARD_SCHEDULE_SHARED:
      return 'לוח שמירות';
    default:
      return 'התראה';
  }
}
