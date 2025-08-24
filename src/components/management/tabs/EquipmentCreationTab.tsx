/**
 * Equipment creation tab component - extracted from management page
 */
import React from 'react';

export default function EquipmentCreationTab() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">📦 יצירת ציוד חדש - בפיתוח</h3>
        <p className="text-green-700 text-sm">
          כאן יהיה ניתן ליצור ציוד חדש למערכת. התכונה תכלול:
        </p>
        <ul className="list-disc list-inside text-green-700 text-sm mt-2 space-y-1">
          <li>יצירה מהירה מתבניות קיימות</li>
          <li>יצירה ידנית עם כל השדות</li>
          <li>אפשרות לשמור כתבנית חדשה</li>
          <li>אינטגרציה עם מערכת הוספת ציוד הקיימת</li>
        </ul>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700 text-sm">
          <strong>הערה:</strong> כרגע ניתן ליצור ציוד חדש דרך דף הציוד הראשי. 
          תכונה זו תשפר את החוויה עבור מנהלי מערכת.
        </p>
      </div>
    </div>
  );
}
