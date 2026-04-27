/**
 * Enforce transfer tab component - extracted from management page
 * Wired to real Firestore data via transferRequestService
 */
'use client';

import React, { useState, useEffect } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllPendingTransferRequests,
  approveTransferRequest,
  rejectTransferRequest,
} from '@/lib/transferRequestService';
import { TransferRequest } from '@/types/equipment';
import { Timestamp } from 'firebase/firestore';

export default function EnforceTransferTab() {
  const { enhancedUser } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [reason, setReason] = useState('');

  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load real pending transfers on mount
  useEffect(() => {
    loadPendingTransfers();
  }, []);

  const loadPendingTransfers = async () => {
    setIsLoading(true);
    try {
      const transfers = await getAllPendingTransferRequests();
      setPendingTransfers(transfers);
    } catch (error) {
      console.error('Error loading pending transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (transferId: string) => {
    if (!enhancedUser) return;
    setActionInProgress(transferId);
    try {
      const approverName = (enhancedUser.firstName && enhancedUser.lastName)
        ? `${enhancedUser.firstName} ${enhancedUser.lastName}`
        : enhancedUser.email || '';
      await approveTransferRequest(transferId, enhancedUser.uid, approverName);
      await loadPendingTransfers();
    } catch (error) {
      console.error('Error approving transfer:', error);
      alert('שגיאה באישור ההעברה');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (transferId: string) => {
    if (!enhancedUser) return;
    const rejectionReason = prompt('סיבת הדחייה:');
    if (rejectionReason === null) return; // cancelled

    setActionInProgress(transferId);
    try {
      const rejectorName = (enhancedUser.firstName && enhancedUser.lastName)
        ? `${enhancedUser.firstName} ${enhancedUser.lastName}`
        : enhancedUser.email || '';
      await rejectTransferRequest(transferId, enhancedUser.uid, rejectorName, rejectionReason || undefined);
      await loadPendingTransfers();
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      alert('שגיאה בדחיית ההעברה');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (timestamp: Timestamp | string | Date): string => {
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as string);
      return date.toLocaleDateString('he-IL');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Force Transfer Form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="text-lg font-medium text-danger-600 mb-4">⚠️ יצירת העברה כפויה</h4>
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mb-4">
          <p className="text-danger-700 text-sm">
            <strong>אזהרה:</strong> שימוש ביצירת העברה כפויה אמור להיעשות רק במצבי חירום או כאשר המשתמש לא זמין.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">ציוד</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="">בחר ציוד...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">מ-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">אל-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">סיבה להעברה</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
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
          <label className="block text-sm font-medium text-neutral-700 mb-2">הערות נוספות</label>
          <textarea
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
            rows={3}
            placeholder={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.TRANSFER_REASON_PLACEHOLDER}
          />
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => alert('פיצ\'ר העברה כפויה בפיתוח')}
          >
            ⚠️ בצע העברה כפויה
          </button>
        </div>
      </div>

      {/* Pending Transfers — Real Data */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h4 className="text-lg font-medium text-neutral-900">העברות בהמתנה לאישור</h4>
          <button
            onClick={loadPendingTransfers}
            disabled={isLoading}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            🔄 רענן
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">טוען...</div>
        ) : pendingTransfers.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">אין העברות בהמתנה</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">ציוד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">מאת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">אל</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">סיבה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {pendingTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{transfer.equipmentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{transfer.fromUserName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{transfer.toUserName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{formatDate(transfer.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-[200px] truncate">{transfer.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleApprove(transfer.id)}
                        disabled={actionInProgress === transfer.id}
                        className="text-success-600 hover:text-success-900 ml-2 disabled:opacity-50"
                      >
                        {actionInProgress === transfer.id ? '...' : 'אשר'}
                      </button>
                      <button
                        onClick={() => handleReject(transfer.id)}
                        disabled={actionInProgress === transfer.id}
                        className="text-danger-600 hover:text-danger-900 disabled:opacity-50"
                      >
                        דחה
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
