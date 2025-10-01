/**
 * Common Notes Field Component
 */

import React from 'react';
import { FormField } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormFieldNotesProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function FormFieldNotes({
  value,
  onChange,
  error,
  disabled = false
}: FormFieldNotesProps) {
  return (
    <FormField
      label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES}
      error={error}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES_PLACEHOLDER}
        rows={3}
        disabled={disabled}
      />
    </FormField>
  );
}
