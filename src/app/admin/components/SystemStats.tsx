'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';

export default function SystemStats() {
  const { personnel, fetchPersonnel, isLoading } = usePersonnelManagement();
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    recentlyAdded: 0,
    lastUpdated: null as Date | null
  });

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  useEffect(() => {
    if (personnel.length > 0) {
      // Calculate recent additions (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentCount = personnel.filter(person => {
        try {
          const createdDate = person.createdAt?.toDate?.() || new Date();
          return createdDate > oneWeekAgo;
        } catch {
          return false;
        }
      }).length;

      setStats({
        totalPersonnel: personnel.length,
        recentlyAdded: recentCount,
        lastUpdated: new Date()
      });
    }
  }, [personnel]);

  const formatLastUpdated = () => {
    if (!stats.lastUpdated) return '';
    return stats.lastUpdated.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Personnel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👥</div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {isLoading ? '...' : stats.totalPersonnel}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Total Authorized Personnel
              </div>
            </div>
          </div>
        </div>

        {/* Recently Added */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📈</div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {isLoading ? '...' : stats.recentlyAdded}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                Added This Week
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚡</div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Online
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                System Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 System Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Database Status:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">✅ Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Authentication:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">✅ Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Security Rules:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">✅ Applied</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated:</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {formatLastUpdated() || 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={fetchPersonnel}
              disabled={isLoading}
              className="w-full text-left p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 
                         border border-gray-200 dark:border-gray-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                🔄 Refresh Personnel Data
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Update personnel list from database
              </div>
            </button>
            
            <div className="p-3 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                📊 Export Data
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Export personnel list (Coming Soon)
              </div>
            </div>
            
            <div className="p-3 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                📋 Backup Database
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Create system backup (Coming Soon)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📈 Recent Activity
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading activity...</p>
          </div>
        ) : personnel.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No activity yet. Add some personnel to see recent activity.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {personnel
              .slice()
              .sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
              })
              .slice(0, 5)
              .map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 
                                                  bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex items-center">
                    <div className="text-lg mr-3">👤</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {person.firstName} {person.lastName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Added to authorized personnel • {person.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {person.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || 'Unknown date'}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
} 