/**
 * Hook for managing tab configuration and filtering based on permissions
 */
import { useMemo } from 'react';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck, Mail, Layers, Package } from 'lucide-react';
import { MANAGEMENT } from '@/constants/text';
import { useManagementAccess } from './useManagementAccess';
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
    category: 'equipment',
    requiresTemplatePermission: true
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

  const availableTabs = useMemo(() => {
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
  }, [permissions]);

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

