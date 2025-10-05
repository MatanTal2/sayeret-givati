/**
 * Form Actions Component - Save/Cancel buttons
 */

import React from 'react';
import { Button } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export default function FormActions({
  onCancel,
  onSubmit,
  isSubmitting,
  canSubmit
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {TEXT_CONSTANTS.CONFIRMATIONS.CANCEL}
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !canSubmit}
        isLoading={isSubmitting}
      >
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CREATE_TEMPLATE}
      </Button>
    </div>
  );
}
