'use client';

import React from 'react';
import { X, CheckCheck, RefreshCw } from 'lucide-react';
import { useNotifications, useNotificationDisplay } from '@/contexts/NotificationContext';
import { NOTIFICATIONS, ARIA_LABELS } from '@/constants/text';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications();
  
  const { displayNotifications } = useNotificationDisplay();

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {NOTIFICATIONS.TITLE}
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title={NOTIFICATIONS.MARK_ALL_READ}
              aria-label={NOTIFICATIONS.MARK_ALL_READ}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            title={NOTIFICATIONS.REFRESH_NOTIFICATIONS}
            aria-label={NOTIFICATIONS.REFRESH_NOTIFICATIONS}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            aria-label={ARIA_LABELS.CLOSE_MODAL}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>{NOTIFICATIONS.LOADING}</p>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <h4 className="font-medium text-gray-900 mb-1">
              {NOTIFICATIONS.EMPTY_TITLE}
            </h4>
            <p className="text-sm">
              {NOTIFICATIONS.EMPTY_MESSAGE}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {displayNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {displayNotifications.length} {displayNotifications.length === 1 ? 'התראה' : 'התראות'}
          </p>
        </div>
      )}
    </div>
  );
}
