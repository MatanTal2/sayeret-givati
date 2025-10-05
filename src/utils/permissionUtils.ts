/**
 * Permission utility functions for access control
 */

import { UserType, EnhancedAuthUser } from '@/types/user';

/**
 * Check if user has equipment management permissions
 * Only ADMIN, SYSTEM_MANAGER, and MANAGER can transfer/update equipment
 */
export function hasEquipmentManagementAccess(user: EnhancedAuthUser | null): boolean {
  if (!user || !user.userType) return false;
  
  return [
    UserType.ADMIN,
    UserType.SYSTEM_MANAGER,
    UserType.MANAGER
  ].includes(user.userType);
}

/**
 * Check if user has admin-level access
 * Only ADMIN and SYSTEM_MANAGER have full admin access
 */
export function hasAdminAccess(user: EnhancedAuthUser | null): boolean {
  if (!user || !user.userType) return false;
  
  return [
    UserType.ADMIN,
    UserType.SYSTEM_MANAGER
  ].includes(user.userType);
}

/**
 * Check if user has manager-level access (includes admin)
 * ADMIN, SYSTEM_MANAGER, and MANAGER have manager access
 */
export function hasManagerAccess(user: EnhancedAuthUser | null): boolean {
  return hasEquipmentManagementAccess(user);
}

/**
 * Check if user can perform actions on equipment they don't own
 * Only users with management access can modify other people's equipment
 */
export function canModifyOthersEquipment(user: EnhancedAuthUser | null): boolean {
  return hasEquipmentManagementAccess(user);
}

/**
 * Check if user can view equipment management interface
 * All authenticated users can view, but only managers can modify
 */
export function canViewEquipmentManagement(user: EnhancedAuthUser | null): boolean {
  return !!user; // All authenticated users can view
}

/**
 * Get user permission level as string for debugging/logging
 */
export function getUserPermissionLevel(user: EnhancedAuthUser | null): string {
  if (!user) return 'unauthenticated';
  if (!user.userType) return 'no_user_type';
  
  switch (user.userType) {
    case UserType.ADMIN:
      return 'admin';
    case UserType.SYSTEM_MANAGER:
      return 'system_manager';
    case UserType.MANAGER:
      return 'manager';
    case UserType.TEAM_LEADER:
      return 'team_leader';
    case UserType.USER:
      return 'user';
    default:
      return 'unknown';
  }
}
