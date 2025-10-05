/**
 * Equipment History Service
 * Handles tracking history operations with 20-record limit
 */

import { Timestamp } from 'firebase/firestore';
import { EquipmentHistoryEntry } from '@/types/equipment';

const MAX_TRACKING_HISTORY_ENTRIES = 20;

/**
 * Add a new tracking history entry while maintaining the 20-record limit
 */
export function addTrackingHistoryEntry(
  currentHistory: EquipmentHistoryEntry[],
  newEntry: Omit<EquipmentHistoryEntry, 'timestamp'>
): EquipmentHistoryEntry[] {
  const updatedHistory = [...(currentHistory || [])];
  
  // Remove oldest entry if we're at the limit
  if (updatedHistory.length >= MAX_TRACKING_HISTORY_ENTRIES) {
    updatedHistory.shift(); // Remove the first (oldest) entry
  }
  
  // Add the new entry with timestamp
  const entryWithTimestamp: EquipmentHistoryEntry = {
    ...newEntry,
    timestamp: Timestamp.now() // Use regular timestamp instead of serverTimestamp() in array
  };
  
  updatedHistory.push(entryWithTimestamp);
  
  return updatedHistory;
}

/**
 * Create a tracking history entry for equipment creation
 */
export function createEquipmentCreatedEntry(
  holderName: string,
  location: string,
  creatorUserId: string,
  notes?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'equipment_created',
    holder: holderName,
    location: location,
    notes: notes || 'Equipment created in system',
    updatedBy: creatorUserId
  };
}

/**
 * Create a tracking history entry for transfer request
 */
export function createTransferRequestedEntry(
  fromHolderName: string,
  toHolderName: string,
  location: string,
  reason: string,
  requestorUserId: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'transfer_requested',
    holder: fromHolderName,
    location: location,
    notes: `Transfer requested to ${toHolderName}: ${reason}`,
    updatedBy: requestorUserId
  };
}

/**
 * Create a tracking history entry for transfer approval
 */
export function createTransferApprovedEntry(
  newHolderName: string,
  location: string,
  approverUserId: string,
  approverName: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'transfer_approved',
    holder: newHolderName,
    location: location,
    notes: `Transfer approved by ${approverName}${note ? `: ${note}` : ''}`,
    updatedBy: approverUserId
  };
}

/**
 * Create a tracking history entry for transfer rejection
 */
export function createTransferRejectedEntry(
  originalHolderName: string,
  location: string,
  rejectorUserId: string,
  rejectorName: string,
  reason?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'transfer_rejected',
    holder: originalHolderName,
    location: location,
    notes: `Transfer rejected by ${rejectorName}${reason ? `: ${reason}` : ''}`,
    updatedBy: rejectorUserId
  };
}

/**
 * Create a tracking history entry for status update
 */
export function createStatusUpdateEntry(
  holderName: string,
  location: string,
  newStatus: string,
  updaterUserId: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'status_update',
    holder: holderName,
    location: location,
    notes: note || `Status updated to: ${newStatus}`,
    updatedBy: updaterUserId
  };
}

/**
 * Create a tracking history entry for condition update
 */
export function createConditionUpdateEntry(
  holderName: string,
  location: string,
  newCondition: string,
  updaterUserId: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'condition_update',
    holder: holderName,
    location: location,
    notes: note || `Condition updated to: ${newCondition}`,
    updatedBy: updaterUserId
  };
}

/**
 * Create a tracking history entry for location update
 */
export function createLocationUpdateEntry(
  holderName: string,
  newLocation: string,
  updaterUserId: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'location_update',
    holder: holderName,
    location: newLocation,
    notes: note || `Location updated to: ${newLocation}`,
    updatedBy: updaterUserId
  };
}

/**
 * Create a tracking history entry for maintenance start
 */
export function createMaintenanceStartEntry(
  holderName: string,
  location: string,
  updaterUserId: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'maintenance_start',
    holder: holderName,
    location: location,
    notes: note || 'Maintenance started',
    updatedBy: updaterUserId
  };
}

/**
 * Create a tracking history entry for maintenance completion
 */
export function createMaintenanceCompleteEntry(
  holderName: string,
  location: string,
  updaterUserId: string,
  note?: string
): Omit<EquipmentHistoryEntry, 'timestamp'> {
  return {
    action: 'maintenance_complete',
    holder: holderName,
    location: location,
    notes: note || 'Maintenance completed',
    updatedBy: updaterUserId
  };
}

/**
 * Get the most recent tracking history entry
 */
export function getMostRecentHistoryEntry(
  trackingHistory: EquipmentHistoryEntry[]
): EquipmentHistoryEntry | null {
  if (!trackingHistory || trackingHistory.length === 0) {
    return null;
  }
  
  return trackingHistory[trackingHistory.length - 1];
}

/**
 * Get tracking history entries by action type
 */
export function getHistoryEntriesByAction(
  trackingHistory: EquipmentHistoryEntry[],
  actionType: string
): EquipmentHistoryEntry[] {
  return trackingHistory.filter(entry => entry.action === actionType);
}

/**
 * Get tracking history entries within a date range
 */
export function getHistoryEntriesByDateRange(
  trackingHistory: EquipmentHistoryEntry[],
  startDate: Date,
  endDate: Date
): EquipmentHistoryEntry[] {
  return trackingHistory.filter(entry => {
    if (!entry.timestamp || typeof entry.timestamp.toDate !== 'function') {
      return false;
    }
    
    const entryDate = entry.timestamp.toDate();
    return entryDate >= startDate && entryDate <= endDate;
  });
}
