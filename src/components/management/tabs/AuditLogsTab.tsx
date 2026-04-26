/**
 * Audit logs tab component - wired to real Firestore actionsLog data
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  getRecentActionLogs,
  getActionLogsByDateRange,
} from '@/lib/actionsLogService';
import { ActionsLog } from '@/types/equipment';
import { Timestamp } from 'firebase/firestore';

export default function AuditLogsTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const [logs, setLogs] = useState<ActionsLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent logs on mount
  useEffect(() => {
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    setIsLoading(true);
    try {
      const recentLogs = await getRecentActionLogs(100);
      setLogs(recentLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!dateFrom || !dateTo) {
      await loadRecentLogs();
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59); // Include the entire end day
      let results = await getActionLogsByDateRange(startDate, endDate);

      // Client-side action filter
      if (actionFilter !== 'all') {
        results = results.filter(log => log.actionType.includes(actionFilter));
      }

      setLogs(results);
    } catch (error) {
      console.error('Error searching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | string | Date): string => {
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as string);
      return `${date.toLocaleDateString('he-IL')} ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const getActionBadgeStyle = (actionType: string): string => {
    if (actionType.includes('transfer')) return 'bg-info-100 text-info-800';
    if (actionType.includes('created')) return 'bg-success-100 text-success-800';
    if (actionType.includes('update')) return 'bg-warning-100 text-warning-800';
    if (actionType.includes('reject')) return 'bg-danger-100 text-danger-800';
    return 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <h4 className="text-md font-medium text-neutral-900 mb-4">🔍 מסננים</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">מתאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">עד תאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">סוג פעולה</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">כל הפעולות</option>
              <option value="transfer">העברות</option>
              <option value="created">יצירה</option>
              <option value="update">עדכון</option>
              <option value="reject">דחייה</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              🔍 חפש
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
          <h4 className="text-lg font-medium text-neutral-900">📋 יומן פעולות ({logs.length})</h4>
          <button
            onClick={loadRecentLogs}
            disabled={isLoading}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            🔄 רענן
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">טוען...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">לא נמצאו רשומות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">זמן</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">מבצע</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">פעולה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">ציוד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">יעד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">הערות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{log.actorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeStyle(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{log.equipmentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{log.targetName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500 max-w-[200px] truncate">{log.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats — real count */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-info-100 rounded-full flex items-center justify-center">
            <span className="text-info-600 font-bold">📊</span>
          </div>
          <div className="mr-4">
            <div className="text-2xl font-bold text-neutral-900">{logs.length}</div>
            <div className="text-sm text-neutral-600">רשומות מוצגות</div>
          </div>
        </div>
      </div>
    </div>
  );
}
