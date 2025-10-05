/**
 * Permissions management tab component - extracted from management page
 */
import React, { useState } from 'react';

export default function PermissionsTab() {
  const [selectedUser, setSelectedUser] = useState('');
  
  const permissions = [
    { id: 'view_equipment', name: 'צפייה בציוד', category: 'ציוד' },
    { id: 'edit_equipment', name: 'עריכת ציוד', category: 'ציוד' },
    { id: 'delete_equipment', name: 'מחיקת ציוד', category: 'ציוד' },
    { id: 'manage_users', name: 'ניהול משתמשים', category: 'מערכת' },
    { id: 'view_reports', name: 'צפייה בדוחות', category: 'דוחות' },
    { id: 'manage_templates', name: 'ניהול תבניות', category: 'ציוד' },
  ];

  const roles = [
    { id: 'admin', name: 'מנהל מערכת', permissions: ['view_equipment', 'edit_equipment', 'delete_equipment', 'manage_users', 'view_reports', 'manage_templates'] },
    { id: 'manager', name: 'מנהל', permissions: ['view_equipment', 'edit_equipment', 'view_reports', 'manage_templates'] },
    { id: 'user', name: 'משתמש', permissions: ['view_equipment'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">ניהול הרשאות</h3>
        <p className="text-sm text-neutral-600">נהל הרשאות לתפקידים שונים במערכת</p>
      </div>

      {/* Roles Management */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-4">תפקידים והרשאות</h4>
        <div className="space-y-6">
          {roles.map((role) => (
            <div key={role.id} className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-medium text-neutral-900">{role.name}</h5>
                <button className="text-info-600 hover:text-info-800 text-sm">ערוך הרשאות</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission.id)}
                      className="text-primary-600 focus:ring-primary-500 ml-2"
                      readOnly
                    />
                    <span className="text-sm text-neutral-700">{permission.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Permissions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-4">הרשאות מותאמות אישית</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">בחר משתמש</label>
            <select
              className="w-full md:w-64 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          {selectedUser && (
            <div className="border border-neutral-200 rounded-lg p-4">
              <h6 className="font-medium text-neutral-900 mb-3">הרשאות מותאמות עבור המשתמש</h6>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="text-primary-600 focus:ring-primary-500 ml-2"
                    />
                    <span className="text-sm text-neutral-700">{permission.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                  שמור שינויים
                </button>
                <button className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors">
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
