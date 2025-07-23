'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_TABS } from '@/constants/admin';
import { AdminTabType } from '@/types/admin';
import AddPersonnel from './AddPersonnel';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('add-personnel');
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
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
            onClick={handleLogout}
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
                    {tab.name.replace(/^🔐|📋|📊\s/, '')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tab.description}
                  </p>
                </div>
                
                {tab.id === 'add-personnel' && <AddPersonnel />}
                
                {tab.id === 'view-personnel' && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    🚧 Personnel list view coming soon...
                  </div>
                )}
                
                {tab.id === 'system-stats' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl mb-2">👥</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">-</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Authorized Personnel</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-2xl mb-2">✅</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">-</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Registered Users</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-2xl mb-2">🔄</div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">-</div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">Recent Activity</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 