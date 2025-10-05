// Equipment Utility Functions
// Generic, reusable functions for equipment management

import { 
  Equipment, 
  EquipmentHistoryEntry, 
  EquipmentAction, 
  EquipmentStatus, 
  EquipmentCondition,
  ApprovalType,
  UserRole,
  EquipmentPermission,
  EquipmentUserContext,
  EquipmentFilter,
  EquipmentSort
} from '../types/equipment';
import { Timestamp, serverTimestamp } from 'firebase/firestore';

/**
 * Creates a new equipment history entry
 * Generic function that can be used for any equipment action
 */
export function createHistoryEntry(
  action: EquipmentAction,
  holder: string, // User UID
  updatedBy: string, // User UID
  location: string,
  notes?: string,
  approval?: {
    approvedBy: string;
    approvalType: ApprovalType;
    phoneLast4?: string;
    emergencyOverride?: {
      overrideBy: string;
      overrideReason: string;
      originalHolder: string;
      justification: string;
    };
  },
  holderName?: string, // Display name (optional for UI performance)
  updatedByName?: string // Display name (optional for UI performance)
): EquipmentHistoryEntry {
  // Use current date for history entries since serverTimestamp() can't be used in arrays
  const now = Timestamp.fromDate(new Date());
  
  return {
    holder,
    holderName,
    fromDate: now,
    action,
    updatedBy,
    updatedByName,
    location,
    notes,
    timestamp: now,
    approval: approval ? {
      approvedBy: approval.approvedBy,
      approvedAt: now,
      approvalType: approval.approvalType,
      phoneLast4: approval.phoneLast4,
      emergencyOverride: approval.emergencyOverride ? {
        ...approval.emergencyOverride,
        overrideAt: now
      } : undefined
    } : undefined
  };
}

/**
 * Creates a new equipment item with proper initialization
 */
export function createNewEquipment(
  id: string,
  productName: string,
  category: string,
  assignedUnit: string,
  location: string,
  condition: EquipmentCondition,
  signedBy: string,
  signedById: string,
  notes?: string
): Equipment {
  const serverNow = serverTimestamp() as Timestamp;
  
  return {
    id,
    equipmentType: 'generic', // Default type for legacy function
    productName,
    category,
    acquisitionDate: serverNow,
    dateSigned: serverNow,
    lastSeen: serverNow,
    signedBy,
    currentHolder: signedBy,
    currentHolderId: signedById,
    assignedUnit,
    status: EquipmentStatus.AVAILABLE,
    location,
    condition,
    notes,
    lastReportUpdate: serverNow,
    trackingHistory: [
      createHistoryEntry(
        EquipmentAction.INITIAL_SIGN_IN,
        signedById,
        signedById,
        location,
        notes,
        { approvedBy: signedById, approvalType: ApprovalType.NO_APPROVAL_REQUIRED },
        signedBy, // holderName
        signedBy  // updatedByName
      )
    ],
    createdAt: serverNow,
    updatedAt: serverNow
  };
}

/**
 * Updates equipment with new holder and creates history entry
 * Generic transfer function
 */
export function transferEquipment(
  equipment: Equipment,
  newHolder: string, // Display name
  newHolderId: string, // User UID
  updatedBy: string, // User UID
  approvalDetails: {
    approvedBy: string;
    approvalType: ApprovalType;
    phoneLast4?: string;
    emergencyOverride?: {
      overrideBy: string;
      overrideReason: string;
      originalHolder: string;
      justification: string;
    };
  },
  newUnit?: string,
  newLocation?: string,
  notes?: string,
  updatedByName?: string // Display name (optional)
): Equipment {
  const now = Timestamp.fromDate(new Date());
  
  // Close previous history entry
  const updatedHistory = [...equipment.trackingHistory];
  const lastEntry = updatedHistory[updatedHistory.length - 1];
  if (lastEntry && !lastEntry.toDate) {
    lastEntry.toDate = now;
  }
  
  // Add new history entry
  const newHistoryEntry = createHistoryEntry(
    approvalDetails.emergencyOverride ? EquipmentAction.EMERGENCY_TRANSFER : EquipmentAction.TRANSFER,
    newHolderId,
    updatedBy,
    newLocation || equipment.location,
    notes,
    approvalDetails,
    newHolder, // holderName
    updatedByName // updatedByName
  );
  
  updatedHistory.push(newHistoryEntry);
  
  return {
    ...equipment,
    currentHolder: newHolder,
    currentHolderId: newHolderId,
    assignedUnit: newUnit || equipment.assignedUnit,
    location: newLocation || equipment.location,
    trackingHistory: updatedHistory,
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Updates equipment status and creates history entry
 */
export function updateEquipmentStatus(
  equipment: Equipment,
  newStatus: EquipmentStatus,
  updatedBy: string,
  notes?: string,
  updatedByName?: string
): Equipment {
  const historyEntry = createHistoryEntry(
    EquipmentAction.STATUS_UPDATE,
    equipment.currentHolderId,
    updatedBy,
    equipment.location,
    `Status changed to: ${newStatus}${notes ? ` - ${notes}` : ''}`,
    undefined, // no approval needed for status updates
    equipment.currentHolder, // holderName
    updatedByName // updatedByName
  );
  
  return {
    ...equipment,
    status: newStatus,
    trackingHistory: [...equipment.trackingHistory, historyEntry],
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Updates equipment condition and creates history entry
 */
export function updateEquipmentCondition(
  equipment: Equipment,
  newCondition: EquipmentCondition,
  updatedBy: string,
  notes?: string,
  updatedByName?: string
): Equipment {
  const historyEntry = createHistoryEntry(
    EquipmentAction.CONDITION_UPDATE,
    equipment.currentHolderId,
    updatedBy,
    equipment.location,
    `Condition changed to: ${newCondition}${notes ? ` - ${notes}` : ''}`,
    undefined, // no approval needed for condition updates
    equipment.currentHolder, // holderName
    updatedByName // updatedByName
  );
  
  return {
    ...equipment,
    condition: newCondition,
    trackingHistory: [...equipment.trackingHistory, historyEntry],
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Performs daily check-in for equipment
 */
export function performDailyCheckIn(
  equipment: Equipment,
  checkedBy: string,
  notes?: string,
  checkedByName?: string
): Equipment {
  const now = serverTimestamp() as Timestamp;
  
  const historyEntry = createHistoryEntry(
    EquipmentAction.DAILY_CHECK_IN,
    equipment.currentHolderId,
    checkedBy,
    equipment.location,
    notes || 'Daily check-in completed',
    undefined, // no approval needed for check-ins
    equipment.currentHolder, // holderName
    checkedByName // updatedByName
  );
  
  return {
    ...equipment,
    lastReportUpdate: now,
    trackingHistory: [...equipment.trackingHistory, historyEntry],
    updatedAt: now
  };
}

/**
 * Validates equipment ID format
 * Can be customized based on military serial number standards
 */
export function validateEquipmentId(id: string): { isValid: boolean; error?: string } {
  if (!id.trim()) {
    return { isValid: false, error: 'מספר סידורי חובה' };
  }
  
  // Basic validation - can be enhanced based on specific requirements
  const trimmedId = id.trim();
  
  if (trimmedId.length < 3) {
    return { isValid: false, error: 'מספר סידורי חייב להכיל לפחות 3 תווים' };
  }
  
  if (trimmedId.length > 50) {
    return { isValid: false, error: 'מספר סידורי ארוך מדי' };
  }
  
  // Check for valid characters (alphanumeric + hyphens)
  const validPattern = /^[A-Za-z0-9\-_]+$/;
  if (!validPattern.test(trimmedId)) {
    return { isValid: false, error: 'מספר סידורי יכול להכיל רק אותיות, ספרות, מקפים וקווים תחתונים' };
  }
  
  return { isValid: true };
}

/**
 * Gets user permissions based on role and user type
 * Generic permission system that can be extended
 * Admin UserType gets all permissions regardless of role
 */
export function getUserPermissions(role: UserRole, userType?: string): EquipmentPermission[] {
  // High-level UserTypes get ALL permissions regardless of military role
  if (userType === 'admin' || userType === 'system_manager') {
    return Object.values(EquipmentPermission);
  }
  
  // Manager UserType gets enhanced permissions
  if (userType === 'manager') {
    return [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.BULK_OPERATIONS,
      EquipmentPermission.RETIRE_EQUIPMENT,
      EquipmentPermission.APPROVE_RETIREMENT,
      EquipmentPermission.EXPORT_DATA
    ];
  }
  const permissions: Record<UserRole, EquipmentPermission[]> = {
    [UserRole.SOLDIER]: [
      EquipmentPermission.VIEW_UNIT_ONLY,
      EquipmentPermission.TRANSFER_OWN_EQUIPMENT,
      EquipmentPermission.UPDATE_OWN_EQUIPMENT
    ],
    [UserRole.TEAM_LEADER]: [
      EquipmentPermission.VIEW_UNIT_ONLY,
      EquipmentPermission.TRANSFER_TEAM_EQUIPMENT,
      EquipmentPermission.UPDATE_TEAM_EQUIPMENT,
      EquipmentPermission.APPROVE_TRANSFERS
    ],
    [UserRole.SQUAD_LEADER]: [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.EXPORT_DATA
    ],
    [UserRole.SERGEANT]: [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.EXPORT_DATA
    ],
    [UserRole.OFFICER]: [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.EMERGENCY_OVERRIDE,
      EquipmentPermission.EXPORT_DATA
    ],
    [UserRole.EQUIPMENT_MANAGER]: [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.BULK_OPERATIONS,
      EquipmentPermission.RETIRE_EQUIPMENT,
      EquipmentPermission.APPROVE_RETIREMENT,
      EquipmentPermission.EXPORT_DATA
    ],
    [UserRole.COMMANDER]: [
      EquipmentPermission.VIEW_ALL,
      EquipmentPermission.TRANSFER_EQUIPMENT,
      EquipmentPermission.UPDATE_STATUS,
      EquipmentPermission.APPROVE_TRANSFERS,
      EquipmentPermission.EMERGENCY_OVERRIDE,
      EquipmentPermission.BULK_OPERATIONS,
      EquipmentPermission.RETIRE_EQUIPMENT,
      EquipmentPermission.APPROVE_RETIREMENT,
      EquipmentPermission.EXPORT_DATA,
      EquipmentPermission.MANAGE_USERS
    ]
  };
  
  return permissions[role] || [];
}

/**
 * Checks if user has specific permission
 * Admin UserType automatically has all permissions
 */
export function hasPermission(
  userContext: EquipmentUserContext,
  permission: EquipmentPermission
): boolean {
  // High-level UserTypes have all permissions
  if (userContext.userType === 'admin' || userContext.userType === 'system_manager') {
    return true;
  }
  return userContext.permissions.includes(permission);
}

/**
 * Checks if user can update specific equipment based on ownership and permissions
 */
export function canUpdateEquipment(
  userContext: EquipmentUserContext,
  equipment: Equipment,
  action: 'status' | 'transfer' | 'condition'
): boolean {
  // High-level UserTypes can do everything
  if (userContext.userType === 'admin' || userContext.userType === 'system_manager') {
    return true;
  }
  // Check if user has the general permission first (for higher roles - squad leader and above)
  const hasGeneralPermission = 
    action === 'status' && hasPermission(userContext, EquipmentPermission.UPDATE_STATUS) ||
    action === 'transfer' && hasPermission(userContext, EquipmentPermission.TRANSFER_EQUIPMENT) ||
    action === 'condition' && hasPermission(userContext, EquipmentPermission.UPDATE_STATUS);

  // If user has general permission (squad leader and above), allow
  if (hasGeneralPermission) {
    return true;
  }

  // Check ownership (user holds the equipment)
  const isOwnEquipment = !!(equipment.currentHolderId === userContext.userId);
  
  // Check team membership (equipment belongs to user's team)
  const isTeamEquipment = !!(userContext.team && equipment.assignedTeam === userContext.team);

  // Handle team leader permissions
  if (action === 'status' && hasPermission(userContext, EquipmentPermission.UPDATE_TEAM_EQUIPMENT)) {
    return isOwnEquipment || isTeamEquipment;
  }

  if (action === 'transfer' && hasPermission(userContext, EquipmentPermission.TRANSFER_TEAM_EQUIPMENT)) {
    return isOwnEquipment || isTeamEquipment;
  }

  // Handle soldier permissions
  if (action === 'status' && hasPermission(userContext, EquipmentPermission.UPDATE_OWN_EQUIPMENT)) {
    return isOwnEquipment;
  }

  if (action === 'transfer' && hasPermission(userContext, EquipmentPermission.TRANSFER_OWN_EQUIPMENT)) {
    return isOwnEquipment;
  }

  return false;
}

/**
 * Filters equipment list based on user permissions and filters
 */
export function filterEquipmentList(
  equipment: Equipment[],
  userContext: EquipmentUserContext,
  filters: EquipmentFilter = {}
): Equipment[] {
  let filtered = [...equipment];
  
  // Apply permission-based filtering
  if (!hasPermission(userContext, EquipmentPermission.VIEW_ALL)) {
    // User can only see equipment from their unit
    filtered = filtered.filter(item => item.assignedUnit === userContext.unit);
  }
  
  // Apply search term
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.id.toLowerCase().includes(searchLower) ||
      item.productName.toLowerCase().includes(searchLower) ||
      item.currentHolder.toLowerCase().includes(searchLower) ||
      item.assignedUnit.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(item => filters.status!.includes(item.status));
  }
  
  // Apply condition filter
  if (filters.condition && filters.condition.length > 0) {
    filtered = filtered.filter(item => filters.condition!.includes(item.condition));
  }
  
  // Apply holder filter
  if (filters.holder) {
    filtered = filtered.filter(item => 
      item.currentHolder.toLowerCase().includes(filters.holder!.toLowerCase())
    );
  }
  
  // Apply unit filter
  if (filters.unit) {
    filtered = filtered.filter(item => item.assignedUnit === filters.unit);
  }
  
  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter(item => 
      item.category.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }
  
  // Apply date range filter
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(item => {
      const itemDate = item.lastReportUpdate instanceof Timestamp ? item.lastReportUpdate.toDate() : new Date(item.lastReportUpdate);
      const startDate = new Date(start);
      const endDate = new Date(end);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  return filtered;
}

/**
 * Sorts equipment list
 */
export function sortEquipmentList(
  equipment: Equipment[],
  sort: EquipmentSort
): Equipment[] {
  return [...equipment].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sort.field) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'productName':
        aValue = a.productName;
        bValue = b.productName;
        break;
      case 'currentHolder':
        aValue = a.currentHolder;
        bValue = b.currentHolder;
        break;
      case 'assignedUnit':
        aValue = a.assignedUnit;
        bValue = b.assignedUnit;
        break;
      case 'lastReportUpdate':
        aValue = a.lastReportUpdate instanceof Timestamp ? a.lastReportUpdate.toDate().getTime() : new Date(a.lastReportUpdate).getTime();
        bValue = b.lastReportUpdate instanceof Timestamp ? b.lastReportUpdate.toDate().getTime() : new Date(b.lastReportUpdate).getTime();
        break;
      case 'createdAt':
        aValue = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        bValue = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sort.direction === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return sort.direction === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });
}

/**
 * Formats date for display in Hebrew locale
 */
export function formatEquipmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gets status display text in Hebrew
 */
export function getStatusDisplayText(status: EquipmentStatus): string {
  const statusTexts: Record<EquipmentStatus, string> = {
    [EquipmentStatus.AVAILABLE]: 'זמין',
    [EquipmentStatus.SECURITY]: 'בביטחונית',
    [EquipmentStatus.REPAIR]: 'בתיקון',
    [EquipmentStatus.LOST]: 'אבוד',
    [EquipmentStatus.PENDING_TRANSFER]: 'בהעברה'
  };
  
  return statusTexts[status] || status;
}

/**
 * Gets condition display text in Hebrew
 */
export function getConditionDisplayText(condition: EquipmentCondition): string {
  const conditionTexts: Record<EquipmentCondition, string> = {
    [EquipmentCondition.GOOD]: 'טוב',
    [EquipmentCondition.NEEDS_REPAIR]: 'דרוש תיקון',
    [EquipmentCondition.WORN]: 'בלאי'
  };
  
  return conditionTexts[condition] || condition;
}

/**
 * Determines if equipment needs attention (overdue check-in, etc.)
 */
export function needsAttention(equipment: Equipment): {
  needsAttention: boolean;
  reason?: string;
  priority: 'low' | 'medium' | 'high';
} {
  const now = new Date();
  const lastUpdate = equipment.lastReportUpdate instanceof Timestamp ? equipment.lastReportUpdate.toDate() : new Date(equipment.lastReportUpdate);
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  // High priority issues
  if (equipment.status === EquipmentStatus.LOST) {
    return { needsAttention: true, reason: 'ציוד אבוד', priority: 'high' };
  }
  
  if (equipment.status === EquipmentStatus.REPAIR) {
    return { needsAttention: true, reason: 'ציוד בתיקון', priority: 'high' };
  }
  
  // Medium priority issues
  if (daysSinceUpdate > 7) {
    return { needsAttention: true, reason: 'לא עודכן למעלה מ-7 ימים', priority: 'medium' };
  }
  
  if (equipment.condition === EquipmentCondition.NEEDS_REPAIR || equipment.condition === EquipmentCondition.WORN) {
    return { needsAttention: true, reason: 'מצב הציוד דורש תשומת לב', priority: 'medium' };
  }
  
  // Low priority issues
  if (daysSinceUpdate > 3) {
    return { needsAttention: true, reason: 'לא עודכן למעלה מ-3 ימים', priority: 'low' };
  }
  
  return { needsAttention: false, priority: 'low' };
} 