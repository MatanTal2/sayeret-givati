'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NOTIFICATIONS, ARIA_LABELS } from '@/constants/text';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`
          relative p-2 rounded-lg transition-colors duration-200
          ${isOpen 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${hasUnread ? 'text-blue-600' : ''}
        `}
        aria-label={ARIA_LABELS.NOTIFICATION_BELL}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isLoading}
      >
        {hasUnread ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Unread badge */}
        {hasUnread && (
          <span 
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            aria-label={ARIA_LABELS.UNREAD_NOTIFICATIONS}
          >
            {NOTIFICATIONS.UNREAD_COUNT(unreadCount)}
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-1/2 transform -translate-x-1/2 mt-2 z-50"
          style={{ minWidth: '320px', maxWidth: '400px' }}
        >
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
