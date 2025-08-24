/**
 * Tab content renderer - handles switching between different management tabs
 */
import React from 'react';
import EmailTab from './EmailTab';
import UsersTab from './UsersTab';
import SystemConfigTab from './SystemConfigTab';
import PermissionsTab from './PermissionsTab';
import AuditLogsTab from './AuditLogsTab';
import DataManagementTab from './DataManagementTab';
import TemplateManagementTab from './TemplateManagementTab';
import EquipmentCreationTab from './EquipmentCreationTab';
import EnforceTransferTab from './EnforceTransferTab';
import { Card } from '@/components/ui';
import { MANAGEMENT } from '@/constants/text';
import type { ManagementTab } from '@/types/management';

export interface TabContentRendererProps {
  activeTab: string;
  activeTabData?: ManagementTab;
}

export default function TabContentRenderer({ activeTab, activeTabData }: TabContentRendererProps) {
  // Render specific tab content
  switch (activeTab) {
    case 'send-email':
      return <EmailTab />;

    case 'users':
      return <UsersTab />;
    
    case 'permissions':
      return <PermissionsTab />;
    
    case 'template-management':
      return <TemplateManagementTab />;
    
    case 'equipment-creation':
      return <EquipmentCreationTab />;
    
    case 'enforce-transfer':
      return <EnforceTransferTab />;
    
    case 'system-config':
      return <SystemConfigTab />;
    
    case 'data-management':
      return <DataManagementTab />;
    
    case 'audit-logs':
      return <AuditLogsTab />;

    default:
      return <PlaceholderTabContent tabData={activeTabData} />;
  }
}

/**
 * Placeholder component for tabs that haven't been extracted yet
 * This will be replaced as we extract more tab components
 */
function PlaceholderTabContent({ tabData }: { tabData?: ManagementTab }) {
  if (!tabData) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">תוכן לא נמצא</p>
        </div>
      </Card>
    );
  }

  const Icon = tabData.icon;

  return (
    <Card padding="lg" className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {tabData.label} - {MANAGEMENT.DEVELOPMENT.IN_DEVELOPMENT}
      </h3>
      <p className="text-gray-500 mb-4">
        {MANAGEMENT.DEVELOPMENT.FEATURE_COMING_SOON}
      </p>
      <div className="text-sm text-gray-400">
        {tabData.description}
      </div>
    </Card>
  );
}

