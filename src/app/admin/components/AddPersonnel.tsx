'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { RANK_OPTIONS, USER_TYPE_OPTIONS, FORM_CONSTRAINTS } from '@/constants/admin';
import { UserType } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Select } from '@/components/ui';
import { cn } from '@/lib/cn';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

type StatusDetail =
  | { kind: 'success'; name: string; militaryId: string }
  | { kind: 'error'; errorText: string };

const AUTO_DISMISS_MS = 3000;

const inputClass =
  'w-full px-3 py-2 border border-neutral-300 rounded-md ' +
  'bg-white text-neutral-900 ' +
  'focus:ring-2 focus:ring-info-500 focus:border-info-500 disabled:opacity-50';

const labelClass = 'block text-sm font-medium text-neutral-700 mb-1';

export default function AddPersonnel() {
  const { formData, isLoading, updateFormField, addPersonnel } = usePersonnelManagement();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [statusDetail, setStatusDetail] = useState<StatusDetail | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const scheduleDismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      setSubmitState('idle');
      setStatusDetail(null);
    }, AUTO_DISMISS_MS);
  };

  const dismissNow = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setSubmitState('idle');
    setStatusDetail(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const snapshot = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      militaryId: formData.militaryPersonalNumber
    };

    setSubmitState('submitting');
    setStatusDetail(null);

    const result = await addPersonnel();

    if (result.success) {
      setStatusDetail({ kind: 'success', name: snapshot.name, militaryId: snapshot.militaryId });
      setSubmitState('success');
    } else {
      setStatusDetail({ kind: 'error', errorText: result.message });
      setSubmitState('error');
    }
    scheduleDismiss();
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    updateFormField(field, value);
    if (statusDetail) dismissNow();
  };

  const inputsDisabled = isLoading || submitState === 'submitting';

  const submitButtonClass = cn(
    'btn-primary inline-flex items-center justify-center gap-2 min-w-[12rem]',
    submitState === 'success' && '!bg-success-600 hover:!bg-success-600 focus:!ring-success-500',
    submitState === 'error' && '!bg-danger-600 hover:!bg-danger-600 focus:!ring-danger-500'
  );

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone + Military ID — paired in one row */}
          <div>
            <label htmlFor="phoneNumber" className={labelClass}>
              מספר טלפון *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={inputClass}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.PHONE_PLACEHOLDER_ADMIN}
              maxLength={FORM_CONSTRAINTS.PHONE_MAX_LENGTH}
              disabled={inputsDisabled}
            />
          </div>

          <div>
            <label htmlFor="militaryPersonalNumber" className={labelClass}>
              מספר אישי *
            </label>
            <input
              type="text"
              inputMode="numeric"
              id="militaryPersonalNumber"
              value={formData.militaryPersonalNumber}
              onChange={(e) => handleInputChange('militaryPersonalNumber', e.target.value)}
              className={inputClass}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONAL_ID_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.MILITARY_ID_MAX_LENGTH}
              disabled={inputsDisabled}
            />
          </div>

          {/* Names */}
          <div>
            <label htmlFor="firstName" className={labelClass}>
              שם פרטי *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={inputClass}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.FIRST_NAME_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={inputsDisabled}
            />
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>
              שם משפחה *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={inputClass}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.LAST_NAME_PLACEHOLDER}
              maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
              disabled={inputsDisabled}
            />
          </div>

          {/* Rank + User Type */}
          <div>
            <label htmlFor="rank" className={labelClass}>
              דרגה *
            </label>
            <Select
              id="rank"
              value={formData.rank || null}
              onChange={(v) => handleInputChange('rank', v ?? '')}
              options={RANK_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
              placeholder="בחר דרגה"
              clearable
              disabled={inputsDisabled}
              ariaLabel="דרגה"
            />
          </div>

          <div>
            <label htmlFor="userType" className={labelClass}>
              סוג משתמש *
            </label>
            <Select
              id="userType"
              value={formData.userType || UserType.USER}
              onChange={(v) => v && handleInputChange('userType', v)}
              options={USER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={inputsDisabled}
              ariaLabel="סוג משתמש"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start pt-2">
          <button
            type="submit"
            disabled={submitState === 'submitting' || submitState === 'success'}
            className={submitButtonClass}
            aria-live="polite"
          >
            {submitState === 'submitting' && (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                <span>{TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADD_SUBMITTING}</span>
              </>
            )}
            {submitState === 'success' && (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADDED_TITLE}</span>
              </>
            )}
            {submitState === 'error' && (
              <>
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADD_ERROR_TITLE}</span>
              </>
            )}
            {submitState === 'idle' && (
              <span>{TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADD_SUBMIT}</span>
            )}
          </button>
        </div>

        {/* Status block */}
        {statusDetail && (
          <div
            className={cn(
              'rounded-lg p-4 border-2 shadow-lg transition-all duration-300',
              statusDetail.kind === 'success'
                ? 'bg-success-50 border-success-300'
                : 'bg-danger-50 border-danger-300'
            )}
            role={statusDetail.kind === 'error' ? 'alert' : 'status'}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {statusDetail.kind === 'success' ? (
                  <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success-600" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-danger-600" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="ms-3 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    statusDetail.kind === 'success'
                      ? 'text-success-800'
                      : 'text-danger-800'
                  )}
                >
                  {statusDetail.kind === 'success'
                    ? TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADDED_TITLE
                    : TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADD_ERROR_TITLE}
                </p>
                <p
                  className={cn(
                    'text-sm mt-1',
                    statusDetail.kind === 'success'
                      ? 'text-success-700'
                      : 'text-danger-700'
                  )}
                >
                  {statusDetail.kind === 'success'
                    ? `${statusDetail.name} (${statusDetail.militaryId})`
                    : statusDetail.errorText}
                </p>
                {statusDetail.kind === 'success' && (
                  <p className="text-xs text-success-600 mt-2">
                    💡 {TEXT_CONSTANTS.ADMIN_COMPONENTS.PERSONNEL_ADDED_HINT}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={dismissNow}
                className={cn(
                  'ms-2 flex-shrink-0 p-1 rounded-md',
                  statusDetail.kind === 'success'
                    ? 'text-success-500 hover:bg-success-200'
                    : 'text-danger-500 hover:bg-danger-200'
                )}
                aria-label={TEXT_CONSTANTS.ADMIN_COMPONENTS.DISMISS}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
