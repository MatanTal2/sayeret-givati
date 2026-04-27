/**
 * Hook for managing tab configuration and filtering based on permissions
 */
import { useMemo } from 'react';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck, Mail, Layers, Package, Zap, Archive, BellRing, Crosshair } from 'lucide-react';
import { MANAGEMENT } from '@/constants/text';
import { useManagementAccess } from './useManagementAccess';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { canBulkOps, isManagerOrAbove, isTeamLeaderOrAbove } from '@/lib/equipmentPolicy';
import type { ManagementTab, TabCategory } from '@/types/management';

// Tab Categories - extracted from management page
export const TAB_CATEGORIES: TabCategory[] = [
  {
    id: 'user-management',
    name: 'ניהול משתמשים',
    icon: Users,
    order: 1
  },
  {
    id: 'equipment',
    name: 'ניהול ציוד',
    icon: Package,
    order: 2
  },
  {
    id: 'system',
    name: 'מערכת',
    icon: Settings,
    order: 3
  },
  {
    id: 'communication',
    name: 'תקשורת',
    icon: Mail,
    order: 4
  }
];

// All available tabs - extracted from management page
const ALL_MANAGEMENT_TABS: ManagementTab[] = [
  {
    id: 'users',
    label: MANAGEMENT.TABS.USERS,
    icon: Users,
    description: MANAGEMENT.TAB_DESCRIPTIONS.USERS,
    category: 'user-management'
  },
  {
    id: 'permissions',
    label: MANAGEMENT.TABS.PERMISSIONS,
    icon: Shield,
    description: MANAGEMENT.TAB_DESCRIPTIONS.PERMISSIONS,
    category: 'user-management'
  },
  {
    id: 'template-management',
    label: MANAGEMENT.TABS.TEMPLATE_MANAGEMENT,
    icon: Layers,
    description: MANAGEMENT.TAB_DESCRIPTIONS.TEMPLATE_MANAGEMENT,
    category: 'equipment'
  },
  {
    id: 'equipment-creation',
    label: MANAGEMENT.TABS.EQUIPMENT_CREATION,
    icon: Package,
    description: MANAGEMENT.TAB_DESCRIPTIONS.EQUIPMENT_CREATION,
    category: 'equipment',
    requiresTemplatePermission: true
  },
  {
    id: 'enforce-transfer',
    label: MANAGEMENT.TABS.ENFORCE_TRANSFER,
    icon: ArrowRightLeft,
    description: MANAGEMENT.TAB_DESCRIPTIONS.ENFORCE_TRANSFER,
    category: 'equipment'
  },
  {
    id: 'force-ops',
    label: MANAGEMENT.TABS.FORCE_OPS,
    icon: Zap,
    description: MANAGEMENT.TAB_DESCRIPTIONS.FORCE_OPS,
    category: 'equipment'
  },
  {
    id: 'retirement-approval',
    label: MANAGEMENT.TABS.RETIREMENT_APPROVAL,
    icon: Archive,
    description: MANAGEMENT.TAB_DESCRIPTIONS.RETIREMENT_APPROVAL,
    category: 'equipment'
  },
  {
    id: 'report-request',
    label: MANAGEMENT.TABS.REPORT_REQUEST,
    icon: BellRing,
    description: MANAGEMENT.TAB_DESCRIPTIONS.REPORT_REQUEST,
    category: 'equipment'
  },
  {
    id: 'ammunition',
    label: MANAGEMENT.TABS.AMMUNITION,
    icon: Crosshair,
    description: MANAGEMENT.TAB_DESCRIPTIONS.AMMUNITION,
    category: 'equipment'
  },
  {
    id: 'system-config',
    label: MANAGEMENT.TABS.SYSTEM_CONFIG,
    icon: Settings,
    description: MANAGEMENT.TAB_DESCRIPTIONS.SYSTEM_CONFIG,
    category: 'system'
  },
  {
    id: 'data-management',
    label: MANAGEMENT.TABS.DATA_MANAGEMENT,
    icon: Database,
    description: MANAGEMENT.TAB_DESCRIPTIONS.DATA_MANAGEMENT,
    category: 'system'
  },
  {
    id: 'audit-logs',
    label: MANAGEMENT.TABS.AUDIT_LOGS,
    icon: UserCheck,
    description: MANAGEMENT.TAB_DESCRIPTIONS.AUDIT_LOGS,
    category: 'system'
  },
  {
    id: 'send-email',
    label: MANAGEMENT.TABS.SEND_EMAIL,
    icon: Mail,
    description: MANAGEMENT.TAB_DESCRIPTIONS.SEND_EMAIL,
    category: 'communication'
  }
];

export interface UseManagementTabsReturn {
  availableTabs: ManagementTab[];
  tabsByCategory: Record<string, ManagementTab[]>;
  getTabById: (id: string) => ManagementTab | undefined;
  defaultTabId: string;
}

export function useManagementTabs(): UseManagementTabsReturn {
  const { permissions } = useManagementAccess();
  const { enhancedUser } = useAuth();

  const availableTabs = useMemo(() => {
    const isTeamLeader = enhancedUser?.userType === UserType.TEAM_LEADER;
    return ALL_MANAGEMENT_TABS.filter(tab => {
      // Filter based on permissions
      if (tab.requiresTemplatePermission && !permissions.canManageTemplates) {
        return false;
      }

      // Apply specific tab permissions
      switch (tab.id) {
        case 'users':
        case 'permissions':
          return permissions.canManageUsers || permissions.canManagePermissions;
        case 'template-management':
          return permissions.canManageTemplates || isTeamLeader;
        case 'equipment-creation':
          return permissions.canManageTemplates;
        case 'force-ops':
          // TL+ in any team scope can run force-ops; canForceTransfer per-item is enforced inside the tab.
          return !!enhancedUser && isTeamLeaderOrAbove(enhancedUser);
        case 'retirement-approval':
        case 'report-request':
          return !!enhancedUser && (isManagerOrAbove(enhancedUser) || canBulkOps(enhancedUser));
        case 'ammunition':
          return permissions.canManageTemplates || isTeamLeader;
        case 'system-config':
        case 'data-management':
          return permissions.canManageSystem;
        case 'audit-logs':
          return permissions.canViewAuditLogs;
        case 'send-email':
          return permissions.canSendEmails;
        default:
          return true;
      }
    });
  }, [permissions, enhancedUser]);

  const tabsByCategory = useMemo(() => {
    const grouped: Record<string, ManagementTab[]> = {};
    
    availableTabs.forEach(tab => {
      if (!grouped[tab.category]) {
        grouped[tab.category] = [];
      }
      grouped[tab.category].push(tab);
    });
    
    return grouped;
  }, [availableTabs]);

  const getTabById = useMemo(() => {
    return (id: string) => availableTabs.find(tab => tab.id === id);
  }, [availableTabs]);

  const defaultTabId = availableTabs[0]?.id || 'users';

  return {
    availableTabs,
    tabsByCategory,
    getTabById,
    defaultTabId,
  };
}

