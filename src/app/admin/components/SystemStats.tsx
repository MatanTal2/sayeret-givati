'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function SystemStats() {
  const { personnel, fetchPersonnel, isLoading, cacheInfo } = usePersonnelManagement();
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    recentlyAdded: 0,
    lastUpdated: null as Date | null
  });

  // Only fetch on mount if cache is invalid/expired
  useEffect(() => {
    fetchPersonnel(); // This will use cache if valid, only fetch from DB if needed
  }, [fetchPersonnel]);

  const handleManualRefresh = () => {
    fetchPersonnel(true); // Force refresh from database
  };

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
      {/* Cache Status Banner */}
      {cacheInfo.isValid && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-success-600 dark:text-success-400 mr-2">💾</div>
              <div>
                <div className="text-sm font-medium text-success-800 dark:text-success-200">
                  נתונים נטענו מהמטמון המקומי
                </div>
                <div className="text-xs text-success-600 dark:text-success-400">
                  עדכון אחרון: {Math.round(cacheInfo.ageInHours)} שעות | TTL: 24 שעות
                </div>
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-success-100 dark:bg-success-800 text-success-700 dark:text-success-200 
                         rounded-md hover:bg-success-200 dark:hover:bg-success-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? TEXT_CONSTANTS.ADMIN_COMPONENTS.REFRESHING : TEXT_CONSTANTS.ADMIN_COMPONENTS.REFRESH_NOW}
            </button>
          </div>
        </div>
      )}
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Personnel */}
        <div className="bg-info-50 dark:bg-info-900/20 p-6 rounded-lg border border-info-200 dark:border-info-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👥</div>
            <div>
              <div className="text-2xl font-bold text-info-600 dark:text-info-400">
                {isLoading ? '...' : stats.totalPersonnel}
              </div>
              <div className="text-sm text-info-600 dark:text-info-400">
                Total Authorized Personnel
              </div>
            </div>
          </div>
        </div>

        {/* Recently Added */}
        <div className="bg-warning-50 dark:bg-warning-900/20 p-6 rounded-lg border border-warning-200 dark:border-warning-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📈</div>
            <div>
              <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {isLoading ? '...' : stats.recentlyAdded}
              </div>
              <div className="text-sm text-warning-600 dark:text-warning-400">
                Added This Week
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚡</div>
            <div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                Online
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400">
                System Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            📊 System Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Database Status:</span>
              <span className="text-sm font-medium text-success-600 dark:text-success-400">✅ Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Authentication:</span>
              <span className="text-sm font-medium text-success-600 dark:text-success-400">✅ Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Security Rules:</span>
              <span className="text-sm font-medium text-success-600 dark:text-success-400">✅ Applied</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Last Updated:</span>
              <span className="text-sm font-medium text-info-600 dark:text-info-400">
                {formatLastUpdated() || 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            🚀 Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="w-full text-left p-3 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 
                         border border-neutral-200 dark:border-neutral-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                🔄 רענן נתוני כוח אדם
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {cacheInfo.isValid 
                  ? `מטמון בן ${Math.round(cacheInfo.ageInHours)} שעות - עדכן מהמאגר`
                  : TEXT_CONSTANTS.ADMIN_COMPONENTS.UPDATE_PERSONNEL_TOOLTIP
                }
              </div>
            </button>
            
            <div className="p-3 rounded-md border border-neutral-200 dark:border-neutral-600">
              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                📊 Export Data
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Export personnel list (Coming Soon)
              </div>
            </div>
            
            <div className="p-3 rounded-md border border-neutral-200 dark:border-neutral-600">
              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                📋 Backup Database
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Create system backup (Coming Soon)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          📈 Recent Activity
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info-600 mx-auto mb-4"></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading activity...</p>
          </div>
        ) : personnel.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
                                                  bg-neutral-50 dark:bg-neutral-700 rounded-md">
                  <div className="flex items-center">
                    <div className="text-lg mr-3">👤</div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {person.firstName} {person.lastName}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Added to authorized personnel • {person.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
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