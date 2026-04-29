'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_TABS } from '@/constants/admin';
import { AdminTabType } from '@/types/admin';
import { CONFIRMATIONS, TEXT_CONSTANTS } from '@/constants/text';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AddPersonnel from './AddPersonnel';
import BulkUpload from './BulkUpload';
import ViewPersonnel from './ViewPersonnel';
import UpdatePersonnel from './UpdatePersonnel';
import SystemStats from './SystemStats';
import SystemConfigPanel from './SystemConfigPanel';
import { cn } from '@/lib/cn';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('add-personnel');
  const { showLogoutModal, confirmLogout, cancelLogout } = useAdminAuth();

  const handleLogoutConfirm = async () => {
    await confirmLogout();
    onLogout();
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-neutral-200">
          <nav className="flex gap-6 px-4 sm:px-6 overflow-x-auto" aria-label={TEXT_CONSTANTS.ADMIN.SECTIONS_ARIA}>
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-info-500 text-info-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {ADMIN_TABS.map((tab) => {
            if (activeTab !== tab.id) return null;

            return (
              <div key={tab.id}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {tab.name}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {tab.description}
                  </p>
                </div>

                {tab.id === 'add-personnel' && <AddPersonnel />}
                {tab.id === 'bulk-upload' && <BulkUpload />}
                {tab.id === 'view-personnel' && <ViewPersonnel />}
                {tab.id === 'update-personnel' && <UpdatePersonnel />}
                {tab.id === 'system-stats' && <SystemStats />}
                {tab.id === 'system-config' && <SystemConfigPanel />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title={CONFIRMATIONS.LOGOUT_TITLE}
        message={CONFIRMATIONS.LOGOUT_MESSAGE}
        confirmText={CONFIRMATIONS.LOGOUT_CONFIRM}
        cancelText={CONFIRMATIONS.LOGOUT_CANCEL}
        onConfirm={handleLogoutConfirm}
        onCancel={cancelLogout}
        variant="warning"
        icon="🚪"
      />
    </div>
  );
}
