/**
 * Enforce transfer tab component - extracted from management page
 */
import React, { useState } from 'react';

export default function EnforceTransferTab() {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [reason, setReason] = useState('');

  const pendingTransfers = [
    { id: '1', equipment: 'תבור - T001', from: 'יוסי כהן', to: 'שרה לוי', date: '2024-01-15', status: 'pending' },
    { id: '2', equipment: 'אפוד טקטי - V042', from: 'דוד אבן', to: 'רן כהן', date: '2024-01-14', status: 'approved' },
    { id: '3', equipment: 'קסדה - H123', from: 'מיכל לוי', to: 'אבי גרינברג', date: '2024-01-13', status: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">העברות כפויות</h3>
        <p className="text-sm text-gray-600">נהל העברות ציוד בין משתמשים במצבי חירום</p>
      </div>

      {/* Force Transfer Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-red-600 mb-4">⚠️ יצירת העברה כפויה</h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">
            <strong>אזהרה:</strong> שימוש ביצירת העברה כפויה אמור להיעשות רק במצבי חירום או כאשר המשתמש לא זמין.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ציוד</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="">בחר ציוד...</option>
              <option value="1">תבור - T001</option>
              <option value="2">אפוד טקטי - V042</option>
              <option value="3">קסדה - H123</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מ-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אל-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סיבה להעברה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">בחר סיבה...</option>
              <option value="emergency">מצב חירום</option>
              <option value="unavailable">משתמש לא זמין</option>
              <option value="maintenance">תחזוקה</option>
              <option value="other">אחר</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">הערות נוספות</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="הסבר מפורט לסיבת ההעברה הכפויה..."
          />
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
            ⚠️ בצע העברה כפויה
          </button>
        </div>
      </div>

      {/* Pending Transfers */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">העברות בהמתנה לאישור</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ציוד</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מאת</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אל</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.equipment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.from}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.to}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transfer.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status === 'pending' ? 'ממתין' : transfer.status === 'approved' ? 'אושר' : 'נדחה'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {transfer.status === 'pending' && (
                      <>
                        <button className="text-green-600 hover:text-green-900 ml-2">אשר</button>
                        <button className="text-red-600 hover:text-red-900">דחה</button>
                      </>
                    )}
                    <button className="text-blue-600 hover:text-blue-900">פרטים</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
