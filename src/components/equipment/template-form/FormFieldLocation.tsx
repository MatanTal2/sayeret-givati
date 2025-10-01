/**
 * Location Field Component
 */

import React from 'react';
import { FormField } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormFieldLocationProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function FormFieldLocation({
  value,
  onChange,
  error,
  disabled = false
}: FormFieldLocationProps) {
  return (
    <FormField
      label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.LOCATION}
      error={error}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.LOCATION_PLACEHOLDER}
        disabled={disabled}
      />
    </FormField>
  );
}
