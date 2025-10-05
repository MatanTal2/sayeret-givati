// Equipment Tracking System Types
// Based on military צלם (serialized equipment) requirements

import { Timestamp } from 'firebase/firestore';

// Equipment Type Definition for equipments collection
export interface EquipmentType {
  id: string; // Equipment type ID (auto-generated document ID)
  name: string; // Hebrew name
  category: string; // Equipment category reference (categoryId)
  subcategory: string; // Subcategory reference (subcategoryId)
  description?: string; // Optional detailed description
  notes?: string; // Optional notes - warnings/guidelines
  requiresDailyStatusCheck: boolean; // Whether this equipment type requires daily status checks
  isActive: boolean; // Whether type is available for creation (default true)
  templateCreatorId: string; // UID of user who created this template
  createdAt: Timestamp; // Document creation timestamp
  updatedAt: Timestamp; // Last update timestamp
}

export interface CustomizableFields {
  serialNumber: boolean; // Can customize serial number
  currentHolder: boolean; // Can set initial holder
  assignedUnit: boolean; // Can set unit assignment
  location: boolean; // Can override location
  status: boolean; // Can set initial status
  condition: boolean; // Can override condition
  notes: boolean; // Can add custom notes
}

// Individual Equipment Item for equipment collection
export interface Equipment {
  id: string; // Serial number (מספר סידורי) - also serves as Firestore document ID
  equipmentType: string; // Reference to equipmentTemplates collection (e.g., "rifle_m4")
  productName: string; // Name of the item (שם פריט) - inherited from equipmentType
  category: string; // Type/category (קטגוריה) - inherited from equipmentType
  subcategory?: string; // Specific type within category
  model?: string; // Equipment model/variant
  manufacturer?: string; // Equipment manufacturer
  
  // Dates - ALL Firestore timestamps
  acquisitionDate: Timestamp; // Date equipment was acquired
  dateSigned: Timestamp; // When item was first signed in
  lastSeen: Timestamp; // Last confirmed sighting/check
  lastReportUpdate: Timestamp; // Last daily report update
  warrantyExpiry?: Timestamp; // Warranty expiration date
  nextMaintenanceDate?: Timestamp; // Scheduled maintenance date
  
  // Assignment and Status
  signedBy: string; // Who signed the item in initially
  currentHolder: string; // Current responsible person (display name only - for UI)
  currentHolderId: string; // Current responsible person (user UID - for queries and permissions)
  assignedUnit: string; // Assigned unit or platoon
  assignedTeam?: string; // Assigned team within the unit (for team-based permissions)
  status: EquipmentStatus; // Current status
  location: string; // Physical location
  condition: EquipmentCondition; // Current condition
  
  // Additional Info
  acquisitionCost?: number; // Original cost in ILS
  notes?: string; // Optional free text notes
  maintenanceNotes?: string; // Maintenance history and notes
  qrCode?: string; // QR code for quick scanning
  requiresDailyStatusCheck?: boolean; // Whether this equipment requires daily status checks (inherited from template)
  
  // Audit Trail
  trackingHistory: EquipmentHistoryEntry[]; // Array of transfer/action records
  
  // Metadata
  createdAt: Timestamp; // Firestore timestamp
  updatedAt: Timestamp; // Firestore timestamp
}

export interface EquipmentHistoryEntry {
  action: string; // Action type (e.g., "transfer_requested", "transfer_approved")
  holder: string; // Name of current or previous holder
  location: string; // Location during this action
  notes?: string; // Optional notes for this action
  timestamp: Timestamp; // When this action occurred
  updatedBy: string; // UID of user who performed this action
}

export interface ApprovalDetails {
  approvedBy: string; // Who approved this action
  approvedAt: Timestamp; // Firestore timestamp - when approved
  approvalType: ApprovalType; // Method of approval
  phoneLast4?: string; // Last 4 digits of phone (for OTP verification)
  otpCode?: string; // OTP code used (for audit - should be hashed)
  emergencyOverride?: EmergencyOverride; // Emergency override details if applicable
}

export interface EmergencyOverride {
  overrideBy: string; // Officer who performed override
  overrideReason: string; // Reason for emergency override
  originalHolder: string; // Who should have approved originally
  overrideAt: Timestamp; // Firestore timestamp - when override occurred
  justification: string; // Detailed justification
}

export interface RetirementRequest {
  requestedBy: string; // Who requested retirement
  requestedAt: Timestamp; // Firestore timestamp - when requested
  reason: string; // Reason for retirement
  approvedBy?: string; // Who approved (if approved)
  approvedAt?: Timestamp; // Firestore timestamp - when approved
  status: RetirementStatus; // Current status of request
  notes?: string; // Additional notes
}

// Enums for type safety
export enum EquipmentStatus {
  AVAILABLE = 'available',
  SECURITY = 'security',
  REPAIR = 'repair',
  LOST = 'lost',
  PENDING_TRANSFER = 'pending_transfer'
}

export enum EquipmentCondition {
  GOOD = 'good',
  NEEDS_REPAIR = 'needs_repair',
  WORN = 'worn'
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
  IN_APP_NOTIFICATION = 'in_app_notification',
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
  TEAM_LEADER = 'team_leader',
  SQUAD_LEADER = 'squad_leader', 
  SERGEANT = 'sergeant',
  OFFICER = 'officer',
  COMMANDER = 'commander',
  EQUIPMENT_MANAGER = 'equipment_manager'
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
  holder?: string; // Display name (for UI search)
  holderId?: string; // User UID (for exact queries)
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
export type EquipmentSortField = 'id' | 'productName' | 'currentHolder' | 'currentHolderId' | 'assignedUnit' | 'lastReportUpdate' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface EquipmentSort {
  field: EquipmentSortField;
  direction: SortDirection;
}

// User context for permissions
export interface EquipmentUserContext {
  userId: string;
  role: UserRole;
  userType?: string; // Admin UserType gets all permissions
  unit: string;
  team?: string; // Team identifier for team-based permissions
  permissions: EquipmentPermission[];
}

export enum EquipmentPermission {
  VIEW_ALL = 'view_all',
  VIEW_UNIT_ONLY = 'view_unit_only',
  TRANSFER_EQUIPMENT = 'transfer_equipment',
  TRANSFER_OWN_EQUIPMENT = 'transfer_own_equipment',
  TRANSFER_TEAM_EQUIPMENT = 'transfer_team_equipment',
  UPDATE_STATUS = 'update_status',
  UPDATE_OWN_EQUIPMENT = 'update_own_equipment',
  UPDATE_TEAM_EQUIPMENT = 'update_team_equipment',
  APPROVE_TRANSFERS = 'approve_transfers',
  EMERGENCY_OVERRIDE = 'emergency_override',
  BULK_OPERATIONS = 'bulk_operations',
  RETIRE_EQUIPMENT = 'retire_equipment',
  APPROVE_RETIREMENT = 'approve_retirement',
  EXPORT_DATA = 'export_data',
  MANAGE_USERS = 'manage_users'
}

// Notification System Types for In-App Approvals

export interface Notification {
  id: string; // Auto-generated UUID
  type: NotificationType;
  recipientId: string; // User UID who should receive notification
  senderId: string; // User UID who triggered notification
  title: string; // Notification title
  message: string; // Notification message
  status: NotificationStatus; // Current notification status
  priority: NotificationPriority; // Notification priority level
  relatedDocuments: RelatedDocuments; // References to related documents
  actionRequired: boolean; // Whether user action is required
  actions?: NotificationAction[]; // Available actions (approve/decline/etc.)
  response?: NotificationResponse; // User response data
  expiresAt?: Timestamp; // When notification expires
  readAt?: Timestamp; // When notification was read
  respondedAt?: Timestamp; // When user responded
  metadata?: Record<string, unknown>; // Additional context data
  createdAt: Timestamp; // Notification creation time
  updatedAt: Timestamp; // Last update time
}

export interface RelatedDocuments {
  transferId?: string; // Reference to transfers collection
  equipmentId?: string; // Reference to equipment collection
  retirementRequestId?: string; // Reference to retirement_requests collection
  userId?: string; // Reference to users collection
}

export interface NotificationAction {
  id: string; // Action identifier
  label: string; // Display text
  type: ActionType; // approve, decline, view, etc.
  style: ActionStyle; // primary, secondary, danger
  requiresConfirmation: boolean; // Show confirmation dialog
  confirmationMessage?: string; // Confirmation text
}

export interface NotificationResponse {
  action: string; // Which action was taken
  message?: string; // Optional response message
  timestamp: Timestamp; // When responded
  metadata?: Record<string, unknown>; // Additional response data
}

export enum NotificationType {
  EQUIPMENT_TRANSFER_REQUEST = 'equipment_transfer_request',
  EQUIPMENT_TRANSFER_APPROVED = 'equipment_transfer_approved',
  EQUIPMENT_TRANSFER_DECLINED = 'equipment_transfer_declined',
  RETIREMENT_REQUEST = 'retirement_request',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  OVERDUE_REPORT = 'overdue_report',
  SYSTEM_ALERT = 'system_alert',
  GENERAL_MESSAGE = 'general_message'
}

export enum NotificationStatus {
  PENDING = 'pending',
  READ = 'read',
  RESPONDED = 'responded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ActionType {
  APPROVE = 'approve',
  DECLINE = 'decline',
  VIEW = 'view',
  ACKNOWLEDGE = 'acknowledge',
  CUSTOM = 'custom'
}

export enum ActionStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  GHOST = 'ghost'
}

// Actions Log Collection Types
export interface ActionsLog {
  id: string; // autogenerated Firestore document ID
  actionType: ActionType;
  equipmentId: string; // Equipment serial number/display ID
  equipmentDocId: string; // Firestore document ID
  equipmentName: string; // Equipment product name for easy reference
  actorId: string; // UID of user performing the action
  actorName: string; // Display name of actor
  targetId?: string; // UID of target user (for transfers)
  targetName?: string; // Display name of target user
  note?: string; // Optional note/reason
  timestamp: Timestamp; // When the action occurred
}

export enum ActionType {
  // Transfer actions
  TRANSFER_REQUESTED = 'transfer_requested',
  TRANSFER_APPROVED = 'transfer_approved',
  TRANSFER_REJECTED = 'transfer_rejected',
  
  // Maintenance actions
  MAINTENANCE_START = 'maintenance_start',
  MAINTENANCE_COMPLETE = 'maintenance_complete',
  
  // Status changes
  STATUS_UPDATE = 'status_update',
  CONDITION_UPDATE = 'condition_update',
  
  // Equipment lifecycle
  EQUIPMENT_CREATED = 'equipment_created',
  EQUIPMENT_RETIRED = 'equipment_retired',
  
  // Sign in/out actions
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  
  // Other actions
  LOCATION_UPDATE = 'location_update',
  NOTES_UPDATE = 'notes_update'
}

// Transfer Request Collection Types
export interface TransferRequest {
  id: string; // autogenerated Firestore document ID
  equipmentId: string; // Equipment serial number/display ID
  equipmentDocId: string; // Firestore document ID
  equipmentName: string; // Equipment product name for easy reference
  fromUserId: string; // UID of current holder
  fromUserName: string; // Display name of current holder
  toUserId: string; // UID of target recipient
  toUserName: string; // Display name of target recipient
  reason: string; // Reason for transfer (required)
  note?: string; // Optional additional notes
  status: TransferStatus;
  statusHistory: TransferStatusHistoryEntry[];
  createdAt: Timestamp;
}

export enum TransferStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface TransferStatusHistoryEntry {
  status: Exclude<TransferStatus, TransferStatus.NONE>; // Cannot have 'none' in history
  timestamp: Timestamp;
  updatedBy: string; // UID of user who made the status change
  updatedByName: string; // Display name of user who made the change
  note?: string; // Optional note for the status change
} 