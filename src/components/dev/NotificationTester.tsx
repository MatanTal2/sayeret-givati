'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  createTestNotification, 
  createTestTransferNotification, 
  createMultipleTestNotifications,
  cleanupTestNotifications 
} from '@/utils/testNotifications';

interface NotificationTesterProps {
  className?: string;
}

export default function NotificationTester({ className = '' }: NotificationTesterProps) {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateTest = async (type: 'single' | 'transfer' | 'multiple') => {
    if (!user?.uid) {
      setMessage('יש להתחבר כדי לבדוק התראות');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      let result;
      switch (type) {
        case 'single':
          result = await createTestNotification(user.uid);
          break;
        case 'transfer':
          result = await createTestTransferNotification(user.uid);
          break;
        case 'multiple':
          result = await createMultipleTestNotifications(user.uid, 3);
          break;
      }

      if (Array.isArray(result)) {
        const successful = result.filter(r => r.success).length;
        setMessage(`נוצרו ${successful} התראות בדיקה בהצלחה`);
      } else if (result.success) {
        setMessage('התראת בדיקה נוצרה בהצלחה');
      } else {
        setMessage(`שגיאה: ${result.message}`);
      }
    } catch (error) {
      setMessage(`שגיאה: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!user?.uid) {
      setMessage('יש להתחבר כדי לנקות התראות');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await cleanupTestNotifications(user.uid);
      setMessage(result.success ? result.message : `שגיאה: ${result.message}`);
    } catch (error) {
      setMessage(`שגיאה: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-yellow-800">יש להתחבר כדי לבדוק את מערכת ההתראות</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 בדיקת מערכת התראות
      </h3>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>סטטוס:</strong> {notifications.length} התראות כולל, {unreadCount} לא נקראו
        </p>
        {user && (
          <p className="text-xs text-blue-600 mt-1">
            משתמש: {user.displayName || user.email}
          </p>
        )}
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleCreateTest('single')}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'יוצר...' : 'צור התראה בודדת'}
        </button>

        <button
          onClick={() => handleCreateTest('transfer')}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'יוצר...' : 'צור התראת העברה'}
        </button>

        <button
          onClick={() => handleCreateTest('multiple')}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'יוצר...' : 'צור 3 התראות'}
        </button>

        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'מנקה...' : 'נקה התראות בדיקה'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('שגיאה') 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">הוראות:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• לחץ על הכפתורים כדי ליצור התראות בדיקה</li>
          <li>• בדוק שההתראות מופיעות בפעמון בחלק העליון</li>
          <li>• בדוק שהמספר על הפעמון מתעדכן</li>
          <li>• בדוק שניתן לסמן התראות כנקראו ולמחוק אותן</li>
          <li>• השתמש בכפתור &quot;נקה&quot; כדי להסיר התראות בדיקה</li>
        </ul>
      </div>
    </div>
  );
}
