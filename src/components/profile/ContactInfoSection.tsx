'use client';

import { useEffect, useState } from 'react';
import type { EnhancedAuthUser } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';
import { updateUserProfile } from '@/lib/userProfileService';
import PhoneNumberUpdate from '@/components/profile/PhoneNumberUpdate';

interface Props {
  user: EnhancedAuthUser;
  authEmail: string | undefined;
  phoneNumber: string;
  onPhoneUpdate: (newPhone: string) => Promise<void> | void;
  onSaved: () => Promise<void> | void;
}

/**
 * Contact Info card. Email is read-only. Phone keeps its existing
 * dedicated update component. Address is editable behind the same
 * section-level pencil pattern used by `MilitaryInfoSection`.
 */
export default function ContactInfoSection({ user, authEmail, phoneNumber, onPhoneUpdate, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(user.address || '');

  useEffect(() => {
    if (!editing) setAddress(user.address || '');
  }, [user.address, editing]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.uid, { address: address.trim() });
      await onSaved();
      setEditing(false);
    } catch {
      setError(TEXT_CONSTANTS.PROFILE.SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setAddress(user.address || '');
    setError(null);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{TEXT_CONSTANTS.PROFILE.CONTACT_INFO}</span>
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={TEXT_CONSTANTS.PROFILE.EDIT_SECTION_ARIA}
            className="btn-ghost text-sm flex items-center gap-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{TEXT_CONSTANTS.PROFILE.EDIT_SECTION}</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{TEXT_CONSTANTS.PROFILE.EMAIL}</label>
          <div className="text-neutral-900">{user.email || authEmail || TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE}</div>
        </div>

        <PhoneNumberUpdate
          currentPhoneNumber={phoneNumber}
          onPhoneUpdate={onPhoneUpdate}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{TEXT_CONSTANTS.PROFILE.ADDRESS}</label>
          {editing ? (
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={TEXT_CONSTANTS.PROFILE.ADDRESS_PLACEHOLDER}
              className="input-base"
              disabled={saving}
            />
          ) : (
            <div className="text-neutral-900">{user.address || TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE}</div>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? TEXT_CONSTANTS.PROFILE.SAVING : TEXT_CONSTANTS.PROFILE.SAVE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn-ghost"
          >
            {TEXT_CONSTANTS.PROFILE.CANCEL}
          </button>
          {error && <span className="text-sm text-danger-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
