'use client';

/**
 * Card that lists the configured "ammunition managers" — uids stored on
 * `systemConfig.ammoNotificationRecipientUserIds`. Mirrors the
 * `MilitaryInfoSection` profile pattern: view mode = name list with a
 * top-left edit button, edit mode = same list with X buttons + a
 * `UserSearchInput` to add more, plus Save/Cancel buttons inline.
 *
 * Emails are NEVER shown — recipients are an org-wide setting and the
 * surface stays name-only on purpose. The component takes a raw uid array
 * via `value`, resolves names through `useUsersByIds`, and reports the new
 * uid array through `onSave`. Persistence is the parent's job.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { useUsersByIds } from '@/hooks/useUsersByIds';
import { FEATURES } from '@/constants/text';
import { cn } from '@/lib/cn';

const TT = FEATURES.AMMUNITION.RECIPIENTS;

/** Keep aligned with `AMMO_RECIPIENTS_MAX` on the server. */
const MAX_RECIPIENTS = 10;

export interface AmmoRecipientsSectionProps {
  value: string[];
  onSave: (next: string[]) => Promise<void>;
  disabled?: boolean;
}

export default function AmmoRecipientsSection({
  value,
  onSave,
  disabled,
}: AmmoRecipientsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<string[]>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve display names for whichever list is currently shown. Re-resolves
  // when the user adds/removes during edit.
  const idsToResolve = editing ? pending : value;
  const { users, isLoading } = useUsersByIds(idsToResolve);

  useEffect(() => {
    if (!editing) setPending(value);
  }, [value, editing]);

  const renderedList = editing ? pending : value;

  const handleAdd = (user: UserSearchResult | null) => {
    if (!user) return;
    if (pending.includes(user.uid)) return;
    if (pending.length >= MAX_RECIPIENTS) {
      setError(TT.MAX_REACHED);
      return;
    }
    setPending((prev) => [...prev, user.uid]);
    setError(null);
  };

  const handleRemove = (uid: string) => {
    setPending((prev) => prev.filter((id) => id !== uid));
    setError(null);
  };

  const handleSave = async () => {
    if (saving) return;
    if (pending.length > MAX_RECIPIENTS) {
      setError(TT.MAX_REACHED);
      return;
    }
    // Dedup as a defensive measure — UI already guards but the contract is
    // "pass a clean array down".
    const deduped = Array.from(new Set(pending));
    setSaving(true);
    setError(null);
    try {
      await onSave(deduped);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : TT.SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPending(value);
    setError(null);
    setEditing(false);
  };

  const remainingSlots = useMemo(() => MAX_RECIPIENTS - pending.length, [pending.length]);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-lg font-medium text-neutral-900 min-w-0 truncate">
          {TT.SECTION_TITLE}
        </h4>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={TT.EDIT_ARIA}
            disabled={disabled}
            className={cn(
              'btn-ghost text-sm flex items-center gap-1 shrink-0',
              disabled && 'pointer-events-none opacity-60'
            )}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span>{TT.EDIT}</span>
          </button>
        )}
      </div>

      <p className="text-sm text-neutral-600 mb-4">{TT.SECTION_DESCRIPTION}</p>

      {renderedList.length === 0 && !editing && (
        <p className="text-sm text-neutral-500 italic">{TT.EMPTY_STATE}</p>
      )}

      {renderedList.length > 0 && (
        <ul className="space-y-2">
          {renderedList.map((uid) => {
            const resolved = users[uid];
            const label = resolved?.displayName ?? (isLoading ? '...' : uid);
            return (
              <li
                key={uid}
                className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-neutral-900 truncate">{label}</span>
                {editing && (
                  <button
                    type="button"
                    onClick={() => handleRemove(uid)}
                    aria-label={TT.REMOVE_ARIA}
                    className="p-1 rounded-md text-neutral-500 hover:bg-neutral-200 hover:text-danger-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="mt-4 space-y-3">
          {remainingSlots > 0 ? (
            <UserSearchInput
              value={null}
              onChange={handleAdd}
              placeholder={TT.ADD_PLACEHOLDER}
              excludeUserIds={pending}
            />
          ) : (
            <p className="text-sm text-warning-700">{TT.MAX_REACHED}</p>
          )}

          {error && <p className="text-sm text-danger-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || disabled}
              className="btn-primary"
            >
              {saving ? TT.SAVING : TT.SAVE}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn-ghost"
            >
              {TT.CANCEL}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
