/**
 * Management-specific types extending existing user and equipment types
 */
import { LucideIcon } from 'lucide-react';
import { EnhancedAuthUser, UserType } from './user';

/**
 * Management tab configuration - extracted from management page
 */
export interface ManagementTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
  requiresTemplatePermission?: boolean;
}

/**
 * Tab category for sidebar organization
 */
export interface TabCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  order: number;
}

/**
 * Template data interface - aligned with existing template system
 */
export interface TemplateData {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  icon: string;
  usageCount: number;
  lastUsed: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  productName?: string;
  defaultStatus?: string;
  defaultCondition?: string;
  defaultLocation?: string;
  idPrefix?: string;
  commonNotes?: string;
}

/**
 * Email recipient types
 */
export type EmailRecipientType = 'all' | 'roles' | 'teams' | 'custom';

/**
 * Email priority levels
 */
export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * User type option for email selection
 */
export interface UserTypeOption {
  value: UserType;
  label: string;
}

/**
 * Team option for email selection
 */
export interface TeamOption {
  value: string;
  label: string;
}

/**
 * Management access permissions
 */
export interface ManagementPermissions {
  canAccessManagement: boolean;
  canManageUsers: boolean;
  canManagePermissions: boolean;
  canManageTemplates: boolean;
  canManageSystem: boolean;
  canSendEmails: boolean;
  canViewAuditLogs: boolean;
}

/**
 * Management context for accessing user and permissions
 */
export interface ManagementContext {
  user: EnhancedAuthUser | null;
  permissions: ManagementPermissions;
  isLoading: boolean;
}

/**
 * Sidebar state management
 */
export interface SidebarState {
  isOpen: boolean;
  activeTab: string;
}

/**
 * User menu state
 */
export interface UserMenuState {
  isOpen: boolean;
}

