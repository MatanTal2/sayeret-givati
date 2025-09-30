/**
 * Basic Info Fields Component - Name, Description, ID Prefix
 */

import React from 'react';
import { FormField } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { FormErrors } from './types';

interface FormFieldBasicInfoProps {
  name: string;
  description: string;
  idPrefix: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIdPrefixChange: (value: string) => void;
  errors: FormErrors;
  disabled?: boolean;
}

export default function FormFieldBasicInfo({
  name,
  description,
  idPrefix,
  onNameChange,
  onDescriptionChange,
  onIdPrefixChange,
  errors,
  disabled = false
}: FormFieldBasicInfoProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-900">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.BASIC_INFO}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME}
          required
          error={errors.name}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME_PLACEHOLDER}
            disabled={disabled}
          />
        </FormField>

        <FormField
          label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ID_PREFIX}
          required
          error={errors.idPrefix}
        >
          <input
            type="text"
            value={idPrefix}
            onChange={(e) => onIdPrefixChange(e.target.value.toUpperCase())}
            placeholder="M4, RAD, etc."
            maxLength={6}
            disabled={disabled}
          />
        </FormField>
      </div>

      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION}
        error={errors.description}
      >
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION_PLACEHOLDER}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
