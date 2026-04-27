/**
 * Default Values Fields Component - Status and Condition
 */

import React from 'react';
import { FormField, Select } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { EquipmentStatus, EquipmentCondition } from '@/types/equipment';

interface FormFieldDefaultValuesProps {
  defaultStatus: EquipmentStatus;
  defaultCondition: EquipmentCondition;
  onStatusChange: (value: EquipmentStatus) => void;
  onConditionChange: (value: EquipmentCondition) => void;
  disabled?: boolean;
}

export default function FormFieldDefaultValues({
  defaultStatus,
  defaultCondition,
  onStatusChange,
  onConditionChange,
  disabled = false
}: FormFieldDefaultValuesProps) {
  const statusOptions = [
    { value: EquipmentStatus.AVAILABLE, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.AVAILABLE },
    { value: EquipmentStatus.SECURITY, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.SECURITY },
    { value: EquipmentStatus.REPAIR, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.REPAIR },
    { value: EquipmentStatus.LOST, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.LOST },
  ];
  const conditionOptions = [
    { value: EquipmentCondition.GOOD, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.GOOD },
    { value: EquipmentCondition.NEEDS_REPAIR, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.NEEDS_REPAIR },
    { value: EquipmentCondition.WORN, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.WORN },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_STATUS}
      >
        <Select
          value={defaultStatus}
          onChange={(v) => v && onStatusChange(v as EquipmentStatus)}
          options={statusOptions}
          disabled={disabled}
          ariaLabel={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_STATUS}
        />
      </FormField>

      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_CONDITION}
      >
        <Select
          value={defaultCondition}
          onChange={(v) => v && onConditionChange(v as EquipmentCondition)}
          options={conditionOptions}
          disabled={disabled}
          ariaLabel={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_CONDITION}
        />
      </FormField>
    </div>
  );
}
