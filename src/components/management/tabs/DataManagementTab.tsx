/**
 * Data management tab component - extracted from management page
 */
import React, { useState } from 'react';

export default function DataManagementTab() {
  const [selectedTable, setSelectedTable] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');

  const databaseTables = [
    { name: 'משתמשים', records: 24, size: '0.5 MB', lastUpdate: '15/01/2024' },
    { name: 'ציוד', records: 156, size: '2.1 MB', lastUpdate: '15/01/2024' },
    { name: 'התיאמויות', records: 89, size: '0.8 MB', lastUpdate: '14/01/2024' },
    { name: 'תבניות', records: 12, size: '0.1 MB', lastUpdate: '13/01/2024' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">ניהול נתונים</h3>
        <p className="text-sm text-gray-600">ייבוא, ייצוא וניהול נתוני המערכת</p>
      </div>

      {/* Database Overview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">📊 סקירת מסד הנתונים</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טבלה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">רשומות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">גודל</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">עדכון אחרון</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {databaseTables.map((table, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.records}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.lastUpdate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 ml-2">ייצא</button>
                    <button className="text-green-600 hover:text-green-900 ml-2">גבה</button>
                    <button className="text-orange-600 hover:text-orange-900">נקה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📤 ייצוא נתונים</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר טבלה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="">בחר טבלה...</option>
              <option value="users">משתמשים</option>
              <option value="equipment">ציוד</option>
              <option value="logs">התיאמויות</option>
              <option value="templates">תבניות</option>
              <option value="all">כל הנתונים</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">פורמט ייצוא</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            📤 ייצא נתונים
          </button>
        </div>
      </div>

      {/* Import Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📥 ייבוא נתונים</h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📁</span>
          </div>
          <p className="text-gray-600 mb-4">גרור קובץ לכאן או לחץ לבחירה</p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            בחר קובץ
          </button>
          <p className="text-xs text-gray-500 mt-2">תומך ב: .xlsx, .csv, .json</p>
        </div>
      </div>

      {/* Backup Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">💾 ניהול גיבויים</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">גיבוי אוטומטי יומי</div>
              <div className="text-sm text-gray-600">מתבצע כל יום ב-03:00</div>
            </div>
            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">פעיל</button>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              צור גיבוי מלא
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              שחזר מגיבוי
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
