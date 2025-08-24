/**
 * Audit logs tab component - extracted from management page
 */
import React, { useState } from 'react';

export default function AuditLogsTab() {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-15');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const auditLogs = [
    { id: '1', user: 'יוסי כהן', action: 'התחברות למערכת', resource: 'מערכת', timestamp: '15/01/2024 08:30', ip: '192.168.1.100' },
    { id: '2', user: 'שרה לוי', action: 'עריכת ציוד', resource: 'תבור T001', timestamp: '15/01/2024 09:15', ip: '192.168.1.105' },
    { id: '3', user: 'דוד אבן', action: 'יצירת משתמש', resource: 'רן כהן', timestamp: '14/01/2024 14:20', ip: '192.168.1.110' },
    { id: '4', user: 'מיכל לוי', action: 'מחיקת תבנית', resource: 'תבנית אפוד', timestamp: '14/01/2024 11:45', ip: '192.168.1.115' },
    { id: '5', user: 'אבי גרינברג', action: 'יצוא נתונים', resource: 'טבלת ציוד', timestamp: '13/01/2024 16:30', ip: '192.168.1.120' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">רישום פעולות</h3>
        <p className="text-sm text-gray-600">צפה ופלטר פעולות משתמשים במערכת</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔍 מסננים</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג פעולה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">כל הפעולות</option>
              <option value="login">התחברות</option>
              <option value="edit">עריכה</option>
              <option value="create">יצירה</option>
              <option value="delete">מחיקה</option>
              <option value="export">ייצוא</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">כל המשתמשים</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            🔍 חפש
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">📋 יומן פעולות</h4>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            📤 ייצא יומן
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">זמן</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משתמש</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משאב</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כתובת IP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פרטים</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.action.includes('התחברות') ? 'bg-blue-100 text-blue-800' :
                      log.action.includes('עריכה') ? 'bg-yellow-100 text-yellow-800' :
                      log.action.includes('יצירה') ? 'bg-green-100 text-green-800' :
                      log.action.includes('מחיקה') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.resource}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-900">צפה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">📊</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">1,245</div>
              <div className="text-sm text-gray-600">סך הפעולות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">👤</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600">משתמשים פעילים היום</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">⚠️</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">פעולות חשודות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">🔒</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600">פעולות אבטחה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
