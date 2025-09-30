/**
 * Requires Daily Check Toggle Component
 */

import React from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormFieldRequiresDailyCheckProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function FormFieldRequiresDailyCheck({
  value,
  onChange,
  disabled = false
}: FormFieldRequiresDailyCheckProps) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id="requiresDailyStatusCheck"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
      />
      <label htmlFor="requiresDailyStatusCheck" className="mr-2 text-sm text-gray-700">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.REQUIRES_DAILY_CHECK}
      </label>
    </div>
  );
}
