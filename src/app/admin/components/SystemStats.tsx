'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function SystemStats() {
  const { personnel, fetchPersonnel, isLoading, cacheInfo } = usePersonnelManagement();
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    recentlyAdded: 0,
    registeredCount: 0,
    pendingCount: 0,
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

      const registeredCount = personnel.filter(p => p.registered).length;

      setStats({
        totalPersonnel: personnel.length,
        recentlyAdded: recentCount,
        registeredCount,
        pendingCount: personnel.length - registeredCount,
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
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-success-600 me-2">💾</div>
              <div>
                <div className="text-sm font-medium text-success-800">
                  נתונים נטענו מהמטמון המקומי
                </div>
                <div className="text-xs text-success-600">
                  עדכון אחרון: {Math.round(cacheInfo.ageInHours)} שעות | TTL: 24 שעות
                </div>
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-success-100 text-success-700 
                         rounded-md hover:bg-success-200 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? TEXT_CONSTANTS.ADMIN_COMPONENTS.REFRESHING : TEXT_CONSTANTS.ADMIN_COMPONENTS.REFRESH_NOW}
            </button>
          </div>
        </div>
      )}
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Personnel */}
        <div className="bg-info-50 p-6 rounded-lg border border-info-200">
          <div className="flex items-center">
            <div className="text-3xl me-4">👥</div>
            <div>
              <div className="text-2xl font-bold text-info-600">
                {isLoading ? '...' : stats.totalPersonnel}
              </div>
              <div className="text-sm text-info-600">
                {TEXT_CONSTANTS.ADMIN.STATS_TOTAL_PERSONNEL}
              </div>
            </div>
          </div>
        </div>

        {/* Registered */}
        <div className="bg-success-50 p-6 rounded-lg border border-success-200">
          <div className="flex items-center">
            <div className="text-3xl me-4">✅</div>
            <div>
              <div className="text-2xl font-bold text-success-600">
                {isLoading ? '...' : stats.registeredCount}
              </div>
              <div className="text-sm text-success-600">
                {TEXT_CONSTANTS.ADMIN.STATS_REGISTERED}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Registration */}
        <div className="bg-warning-50 p-6 rounded-lg border border-warning-200">
          <div className="flex items-center">
            <div className="text-3xl me-4">⏳</div>
            <div>
              <div className="text-2xl font-bold text-warning-600">
                {isLoading ? '...' : stats.pendingCount}
              </div>
              <div className="text-sm text-warning-600">
                {TEXT_CONSTANTS.ADMIN.STATS_PENDING}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Added */}
        <div className="bg-primary-50 p-6 rounded-lg border border-primary-200">
          <div className="flex items-center">
            <div className="text-3xl me-4">📈</div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {isLoading ? '...' : stats.recentlyAdded}
              </div>
              <div className="text-sm text-primary-600">
                {TEXT_CONSTANTS.ADMIN.STATS_ADDED_THIS_WEEK}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {TEXT_CONSTANTS.ADMIN.STATS_INFO_TITLE}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">{TEXT_CONSTANTS.ADMIN.STATS_DB_STATUS}</span>
              <span className="text-sm font-medium text-success-600">{TEXT_CONSTANTS.ADMIN.STATS_CONNECTED}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">{TEXT_CONSTANTS.ADMIN.STATS_AUTH}</span>
              <span className="text-sm font-medium text-success-600">{TEXT_CONSTANTS.ADMIN.STATS_ACTIVE}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">{TEXT_CONSTANTS.ADMIN.STATS_SECURITY_RULES}</span>
              <span className="text-sm font-medium text-success-600">{TEXT_CONSTANTS.ADMIN.STATS_APPLIED}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">{TEXT_CONSTANTS.ADMIN.STATS_LAST_UPDATED}</span>
              <span className="text-sm font-medium text-info-600">
                {formatLastUpdated() || TEXT_CONSTANTS.ADMIN.STATS_NEVER}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {TEXT_CONSTANTS.ADMIN.STATS_QUICK_ACTIONS}
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="w-full text-start p-3 rounded-md hover:bg-neutral-50 
                         border border-neutral-200 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-medium text-neutral-900">
                🔄 רענן נתוני כוח אדם
              </div>
              <div className="text-xs text-neutral-500">
                {cacheInfo.isValid 
                  ? `מטמון בן ${Math.round(cacheInfo.ageInHours)} שעות - עדכן מהמאגר`
                  : TEXT_CONSTANTS.ADMIN_COMPONENTS.UPDATE_PERSONNEL_TOOLTIP
                }
              </div>
            </button>
            
            <div className="p-3 rounded-md border border-neutral-200">
              <div className="text-sm font-medium text-neutral-900">
                {TEXT_CONSTANTS.ADMIN.STATS_EXPORT}
              </div>
              <div className="text-xs text-neutral-500">
                {TEXT_CONSTANTS.ADMIN.STATS_EXPORT_HINT}
              </div>
            </div>

            <div className="p-3 rounded-md border border-neutral-200">
              <div className="text-sm font-medium text-neutral-900">
                {TEXT_CONSTANTS.ADMIN.STATS_BACKUP}
              </div>
              <div className="text-xs text-neutral-500">
                {TEXT_CONSTANTS.ADMIN.STATS_BACKUP_HINT}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          📈 פעילות אחרונה
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info-600 mx-auto mb-4"></div>
            <p className="text-sm text-neutral-600">טוען פעילות...</p>
          </div>
        ) : personnel.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-neutral-600">
              עדיין אין פעילות. הוסף כוח אדם כדי לראות פעילות אחרונה.
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
                                                  bg-neutral-50 rounded-md">
                  <div className="flex items-center">
                    <div className="text-lg me-3">👤</div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {person.firstName} {person.lastName}
                      </div>
                      <div className="text-xs text-neutral-500">
                        נוסף לכוח אדם מורשה • {person.rank}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {person.registered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        ✅ {TEXT_CONSTANTS.ADMIN.VIEW_REGISTERED_BADGE}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                        ⏳ {TEXT_CONSTANTS.ADMIN.VIEW_PENDING_BADGE}
                      </span>
                    )}
                    <div className="text-xs text-neutral-500">
                      {person.createdAt?.toDate?.()?.toLocaleDateString('he-IL') || 'תאריך לא ידוע'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
} 