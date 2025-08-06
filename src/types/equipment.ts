// Equipment Tracking System Types
// Based on military צלם (serialized equipment) requirements

export interface Equipment {
  id: string; // Serial number (מספר סידורי) - also serves as Firestore document ID
  productName: string; // Name of the item (שם פריט)
  category: string; // Type/category (קטגוריה)
  dateSigned: string; // ISO date string - when item was first signed in
  signedBy: string; // Who signed the item in initially
  currentHolder: string; // Current holder's name
  assignedUnit: string; // Assigned unit or platoon
  status: EquipmentStatus; // Current status
  location: string; // Physical location
  condition: EquipmentCondition; // Current condition
  notes?: string; // Optional free text notes
  lastReportUpdate: string; // ISO date string - last daily check
  trackingHistory: EquipmentHistoryEntry[]; // Array of transfer/action records
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface EquipmentHistoryEntry {
  holder: string; // Person involved in this action
  fromDate: string; // ISO date string - start of this period
  toDate?: string; // ISO date string - end of this period (null if current)
  action: EquipmentAction; // Type of action performed
  updatedBy: string; // Who performed this action
  notes?: string; // Optional notes for this action
  approval?: ApprovalDetails; // Approval information (if required)
  timestamp: string; // ISO date string - when this action occurred
}

export interface ApprovalDetails {
  approvedBy: string; // Who approved this action
  approvedAt: string; // ISO date string - when approved
  approvalType: ApprovalType; // Method of approval
  phoneLast4?: string; // Last 4 digits of phone (for OTP verification)
  otpCode?: string; // OTP code used (for audit - should be hashed)
  emergencyOverride?: EmergencyOverride; // Emergency override details if applicable
}

export interface EmergencyOverride {
  overrideBy: string; // Officer who performed override
  overrideReason: string; // Reason for emergency override
  originalHolder: string; // Who should have approved originally
  overrideAt: string; // ISO date string - when override occurred
  justification: string; // Detailed justification
}

export interface RetirementRequest {
  requestedBy: string; // Who requested retirement
  requestedAt: string; // ISO date string - when requested
  reason: string; // Reason for retirement
  approvedBy?: string; // Who approved (if approved)
  approvedAt?: string; // ISO date string - when approved
  status: RetirementStatus; // Current status of request
  notes?: string; // Additional notes
}

// Enums for type safety
export enum EquipmentStatus {
  ACTIVE = 'active',
  LOST = 'lost',
  BROKEN = 'broken',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  PENDING_TRANSFER = 'pending_transfer',
  PENDING_RETIREMENT = 'pending_retirement'
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
  BROKEN = 'broken'
}

export enum EquipmentAction {
  INITIAL_SIGN_IN = 'initial_sign_in',
  TRANSFER = 'transfer',
  STATUS_UPDATE = 'status_update',
  CONDITION_UPDATE = 'condition_update',
  LOCATION_UPDATE = 'location_update',
  DAILY_CHECK_IN = 'daily_check_in',
  EMERGENCY_TRANSFER = 'emergency_transfer',
  RETIREMENT_REQUEST = 'retirement_request',
  RETIREMENT_APPROVED = 'retirement_approved',
  NOTES_UPDATE = 'notes_update'
}

export enum ApprovalType {
  OTP_SMS = 'otp_sms',
  OTP_APP = 'otp_app',
  COMMANDER_OVERRIDE = 'commander_override',
  DUAL_APPROVAL = 'dual_approval',
  NO_APPROVAL_REQUIRED = 'no_approval_required'
}

export enum RetirementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum UserRole {
  SOLDIER = 'soldier',
  OFFICER = 'officer',
  EQUIPMENT_MANAGER = 'equipment_manager',
  COMMANDER = 'commander',
  ADMIN = 'admin'
}

// Form interfaces for UI components
export interface NewEquipmentForm {
  id: string;
  productName: string;
  category: string;
  assignedUnit: string;
  location: string;
  condition: EquipmentCondition;
  notes?: string;
}

export interface TransferEquipmentForm {
  newHolder: string;
  newUnit?: string;
  newLocation?: string;
  notes?: string;
  requiresApproval: boolean;
}

export interface BulkTransferForm {
  equipmentIds: string[];
  newHolder: string;
  newUnit?: string;
  newLocation?: string;
  notes?: string;
}

export interface EquipmentFilter {
  searchTerm?: string;
  status?: EquipmentStatus[];
  condition?: EquipmentCondition[];
  holder?: string;
  unit?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// API Response types
export interface EquipmentListResponse {
  items: Equipment[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: unknown; // Firestore document snapshot for pagination
}

export interface EquipmentOperationResult {
  success: boolean;
  message: string;
  equipmentId?: string;
  error?: string;
}

// Utility types
export type EquipmentSortField = 'id' | 'productName' | 'currentHolder' | 'assignedUnit' | 'lastReportUpdate' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface EquipmentSort {
  field: EquipmentSortField;
  direction: SortDirection;
}

// User context for permissions
export interface EquipmentUserContext {
  userId: string;
  role: UserRole;
  unit: string;
  permissions: EquipmentPermission[];
}

export enum EquipmentPermission {
  VIEW_ALL = 'view_all',
  VIEW_UNIT_ONLY = 'view_unit_only',
  TRANSFER_EQUIPMENT = 'transfer_equipment',
  UPDATE_STATUS = 'update_status',
  APPROVE_TRANSFERS = 'approve_transfers',
  EMERGENCY_OVERRIDE = 'emergency_override',
  BULK_OPERATIONS = 'bulk_operations',
  RETIRE_EQUIPMENT = 'retire_equipment',
  APPROVE_RETIREMENT = 'approve_retirement',
  EXPORT_DATA = 'export_data',
  MANAGE_USERS = 'manage_users'
} 