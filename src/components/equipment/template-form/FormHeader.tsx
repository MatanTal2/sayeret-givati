/**
 * Form Header Component - Title, description, and close button
 */

import React from 'react';
import { X } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormHeaderProps {
  onClose: () => void;
  isSubmitting: boolean;
}

export default function FormHeader({ onClose, isSubmitting }: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.TITLE}
      </h3>
      <button
        onClick={onClose}
        disabled={isSubmitting}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
