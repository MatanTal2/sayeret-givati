'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  cancelTransferRequest, 
  sendTransferReminder, 
  getPendingTransferRequestForEquipment 
} from '@/lib/transferRequestService';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Equipment } from '@/types/equipment';

interface PendingTransferButtonProps {
  equipment: Equipment;
  onTransferUpdate?: () => void;
  size?: 'sm' | 'md';
}

export default function PendingTransferButton({ 
  equipment, 
  onTransferUpdate,
  size = 'md' 
}: PendingTransferButtonProps) {
  const { enhancedUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Reset reminder sent state after 5 seconds
  useEffect(() => {
    if (reminderSent) {
      const timer = setTimeout(() => {
        setReminderSent(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [reminderSent]);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 200); // Small delay to prevent accidental hovers
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCancelTransfer = async () => {
    if (!enhancedUser || isLoading) return;

    const confirmed = window.confirm(
      `${TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL_TRANSFER_CONFIRM_TITLE}\n\n${TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL_TRANSFER_CONFIRM_MESSAGE}`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      // Get the pending transfer request
      const transferRequest = await getPendingTransferRequestForEquipment(equipment.id);
      
      if (!transferRequest) {
        throw new Error('No pending transfer request found');
      }

      await cancelTransferRequest(
        transferRequest.id,
        enhancedUser.uid,
        enhancedUser.displayName || enhancedUser.email || 'Unknown User'
      );

      alert(TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL_TRANSFER_SUCCESS);
      onTransferUpdate?.();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      alert(TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL_TRANSFER_ERROR);
    } finally {
      setIsLoading(false);
      setIsHovered(false);
    }
  };

  const handleRemindRecipient = async () => {
    if (!enhancedUser || isLoading || reminderSent) return;

    setIsLoading(true);
    try {
      // Get the pending transfer request
      const transferRequest = await getPendingTransferRequestForEquipment(equipment.id);
      
      if (!transferRequest) {
        throw new Error('No pending transfer request found');
      }

      await sendTransferReminder(
        transferRequest.id,
        enhancedUser.uid,
        enhancedUser.displayName || enhancedUser.email || 'Unknown User'
      );

      setReminderSent(true);
      alert(TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REMIND_RECIPIENT_SUCCESS);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert(TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REMIND_RECIPIENT_ERROR);
    } finally {
      setIsLoading(false);
      setIsHovered(false);
    }
  };

  const buttonSizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-xs';

  return (
    <div 
      ref={buttonRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Button */}
      <button
        className={`${buttonSizeClasses} bg-neutral-400 hover:bg-neutral-500 text-white rounded-md transition-colors cursor-pointer ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={isLoading}
      >
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.PENDING_TRANSFER_BUTTON}
      </button>

      {/* Hover Menu */}
      <AnimatePresence>
        {isHovered && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-50 min-w-max"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="py-1">
              {/* Cancel Transfer Button */}
              <button
                onClick={handleCancelTransfer}
                className="w-full px-3 py-2 text-xs text-left text-danger-600 hover:bg-danger-50 border-b border-neutral-100 transition-colors flex items-center gap-2"
              >
                <span className="text-danger-600">🟥</span>
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL_TRANSFER}
              </button>

              {/* Remind Recipient Button */}
              <button
                onClick={handleRemindRecipient}
                disabled={reminderSent}
                className={`w-full px-3 py-2 text-xs text-left transition-colors flex items-center gap-2 ${
                  reminderSent 
                    ? 'text-neutral-400 cursor-not-allowed' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="text-neutral-600">🔔</span>
                {reminderSent 
                  ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REMINDER_SENT
                  : TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REMIND_RECIPIENT
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
