'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_TABS } from '@/constants/admin';
import { AdminTabType } from '@/types/admin';
import { CONFIRMATIONS } from '@/constants/text';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AddPersonnel from './AddPersonnel';
import BulkUpload from './BulkUpload';
import ViewPersonnel from './ViewPersonnel';
import UpdatePersonnel from './UpdatePersonnel';
import SystemStats from './SystemStats';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('add-personnel');
  const { 
    showLogoutModal, 
    requestLogout, 
    confirmLogout, 
    cancelLogout 
  } = useAdminAuth();

  const handleLogoutRequest = () => {
    requestLogout();
  };

  const handleLogoutConfirm = async () => {
    await confirmLogout();
    onLogout();
  };

  return (
    <div>
      {/* Header with logout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              👨‍💼 Admin Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              System administrator tools and management
            </p>
          </div>
          <button
            onClick={handleLogoutRequest}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md
                       focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                       transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ADMIN_TABS.map((tab) => {
            if (activeTab !== tab.id) return null;
            
            return (
              <div key={tab.id}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {tab.name.replace(/^🔐|📁|📋|📊\s/, '')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tab.description}
                  </p>
                </div>
                
                {tab.id === 'add-personnel' && <AddPersonnel />}
                
                {tab.id === 'bulk-upload' && <BulkUpload />}
                
                {tab.id === 'view-personnel' && <ViewPersonnel />}
                
                {tab.id === 'update-personnel' && <UpdatePersonnel />}
                
                {tab.id === 'system-stats' && <SystemStats />}
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