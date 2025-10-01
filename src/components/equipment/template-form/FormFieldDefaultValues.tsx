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
          <option value={EquipmentStatus.AVAILABLE}>זמין</option>
          <option value={EquipmentStatus.IN_USE}>בשימוש</option>
          <option value={EquipmentStatus.MAINTENANCE}>תחזוקה</option>
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
          <option value={EquipmentCondition.NEW}>חדש</option>
          <option value={EquipmentCondition.EXCELLENT}>מצוין</option>
          <option value={EquipmentCondition.GOOD}>טוב</option>
          <option value={EquipmentCondition.FAIR}>בינוני</option>
        </select>
      </FormField>
    </div>
  );
}
