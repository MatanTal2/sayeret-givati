/**
 * Product Name Field Component
 */

import React from 'react';
import { FormField } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormFieldProductNameProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function FormFieldProductName({
  value,
  onChange,
  error,
  disabled = false
}: FormFieldProductNameProps) {
  return (
    <FormField
      label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.PRODUCT_NAME}
      required
      error={error}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.PRODUCT_NAME_PLACEHOLDER}
        disabled={disabled}
      />
    </FormField>
  );
}
