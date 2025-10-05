/**
 * Default Values Fields Component - Status and Condition
 */

import React from 'react';
import { FormField } from '@/components/ui';
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_STATUS}
      >
        <select
          value={defaultStatus}
          onChange={(e) => onStatusChange(e.target.value as EquipmentStatus)}
          disabled={disabled}
        >
          <option value={EquipmentStatus.AVAILABLE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.AVAILABLE}</option>
          <option value={EquipmentStatus.SECURITY}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.SECURITY}</option>
          <option value={EquipmentStatus.REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.REPAIR}</option>
          <option value={EquipmentStatus.LOST}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.LOST}</option>
        </select>
      </FormField>

      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DEFAULT_CONDITION}
      >
        <select
          value={defaultCondition}
          onChange={(e) => onConditionChange(e.target.value as EquipmentCondition)}
          disabled={disabled}
        >
          <option value={EquipmentCondition.GOOD}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.GOOD}</option>
          <option value={EquipmentCondition.NEEDS_REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.NEEDS_REPAIR}</option>
          <option value={EquipmentCondition.WORN}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.WORN}</option>
        </select>
      </FormField>
    </div>
  );
}
