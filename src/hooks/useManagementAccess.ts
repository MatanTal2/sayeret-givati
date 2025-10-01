/**
 * Hook for managing user access to management features
 * Leverages existing permission system from equipmentUtils
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/equipment';
import { canManageTemplates } from '@/types/templateSystem';
import type { ManagementPermissions, ManagementContext } from '@/types/management';

export function useManagementAccess(): ManagementContext {
  const { enhancedUser, isLoading } = useAuth();

  const permissions = useMemo((): ManagementPermissions => {
    if (!enhancedUser) {
      return {
        canAccessManagement: false,
        canManageUsers: false,
        canManagePermissions: false,
        canManageTemplates: false,
        canManageSystem: false,
        canSendEmails: false,
        canViewAuditLogs: false,
      };
    }

    // Check if user has management access - admin or officer/commander roles
    const hasManagementAccess = 
      enhancedUser.userType === 'admin' || 
      [UserRole.OFFICER, UserRole.COMMANDER].includes(enhancedUser.role as UserRole);

    if (!hasManagementAccess) {
      return {
        canAccessManagement: false,
        canManageUsers: false,
        canManagePermissions: false,
        canManageTemplates: false,
        canManageSystem: false,
        canSendEmails: false,
        canViewAuditLogs: false,
      };
    }

    // Determine specific permissions based on user type and role
    const isAdmin = enhancedUser.userType === 'admin';
    const isSystemManager = enhancedUser.userType === 'system_manager';
    const isManager = enhancedUser.userType === 'manager';
    const isOfficer = enhancedUser.role === UserRole.OFFICER;
    const isCommander = enhancedUser.role === UserRole.COMMANDER;

    return {
      canAccessManagement: true,
      canManageUsers: isAdmin || isSystemManager || isCommander,
      canManagePermissions: isAdmin || isSystemManager,
      canManageTemplates: enhancedUser.userType ? canManageTemplates(enhancedUser.userType) : false,
      canManageSystem: isAdmin || isSystemManager,
      canSendEmails: isAdmin || isSystemManager || isManager || isOfficer || isCommander,
      canViewAuditLogs: isAdmin || isSystemManager || isCommander,
    };
  }, [enhancedUser]);

  return {
    user: enhancedUser,
    permissions,
    isLoading,
  };
}

/**
 * Hook to check if user has specific management permission
 */
export function useManagementPermission(permission: keyof ManagementPermissions): boolean {
  const { permissions } = useManagementAccess();
  return permissions[permission];
}

