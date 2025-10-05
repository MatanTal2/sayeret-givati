/**
 * System configuration tab component - extracted from management page
 */
import React, { useState } from 'react';

export default function SystemConfigTab() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('admin@example.com');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('3');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">הגדרות מערכת</h3>
        <p className="text-sm text-neutral-600">נהל הגדרות כלליות ותצורת המערכת</p>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-4">🔒 הגדרות אבטחה</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">זמן תפוגת חיבור (דקות)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">מקסימום ניסיונות התחברות</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
              className="text-primary-600 focus:ring-primary-500 ml-2"
            />
            <span className="text-sm text-neutral-700">גיבוי אוטומטי יומי</span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-4">📧 הגדרות התראות</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">אימייל להתראות מערכת</label>
            <input
              type="email"
              className="w-full md:w-96 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="text-primary-600 focus:ring-primary-500 ml-2" />
              <span className="text-sm text-neutral-700">התראה על ציוד חסר</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="text-primary-600 focus:ring-primary-500 ml-2" />
              <span className="text-sm text-neutral-700">התראה על ציוד הזקוק לתחזוקה</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="text-primary-600 focus:ring-primary-500 ml-2" />
              <span className="text-sm text-neutral-700">התראה על משתמשים חדשים</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-4">📊 מידע מערכת</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">גרסת מערכת:</span>
              <span className="text-sm font-medium text-neutral-900">v1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">גיבוי אחרון:</span>
              <span className="text-sm font-medium text-neutral-900">15/01/2024 03:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">משתמשים מחוברים:</span>
              <span className="text-sm font-medium text-neutral-900">12</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">שימוש במסד נתונים:</span>
              <span className="text-sm font-medium text-neutral-900">2.3 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">שימוש בשרת:</span>
              <span className="text-sm font-medium text-neutral-900">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">עדכון אחרון:</span>
              <span className="text-sm font-medium text-neutral-900">10/01/2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
          שמור הגדרות
        </button>
        <button className="px-4 py-2 bg-info-600 hover:bg-info-700 text-white font-medium rounded-lg transition-colors">
          בצע גיבוי כעת
        </button>
        <button className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors">
          איפוס הגדרות
        </button>
      </div>
    </div>
  );
}
