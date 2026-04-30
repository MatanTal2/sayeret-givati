'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import UserSearchInput from '@/components/users/UserSearchInput';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { UserType } from '@/types/user';
import type { UserSearchResult } from '@/lib/userService';
import type { AmmunitionItem, HolderType } from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

type Mode = 'user' | 'team';

export interface TransferAmmoItemModalProps {
  item: AmmunitionItem;
  onClose: () => void;
  onSubmit: (
    serial: string,
    payload: { newHolderType: HolderType; newHolderId: string }
  ) => Promise<boolean>;
}

export default function TransferAmmoItemModal({ item, onClose, onSubmit }: TransferAmmoItemModalProps) {
  const { enhancedUser } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const [mode, setMode] = useState<Mode>(item.currentHolderType === 'TEAM' ? 'team' : 'user');
  const [teamId, setTeamId] = useState<string>(item.currentHolderType === 'TEAM' ? item.currentHolderId : enhancedUser?.teamId || '');
  const [user, setUser] = useState<UserSearchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdminOrSysMgr =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;

  const teamOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const t of systemConfig?.teams ?? []) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push({ value: t, label: t });
      }
    }
    if (enhancedUser?.teamId && !seen.has(enhancedUser.teamId)) {
      out.push({ value: enhancedUser.teamId, label: enhancedUser.teamId });
    }
    return out;
  }, [systemConfig?.teams, enhancedUser?.teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let newHolderType: HolderType;
    let newHolderId: string;
    if (mode === 'team') {
      if (!teamId.trim()) {
        setError('בחר צוות');
        return;
      }
      newHolderType = 'TEAM';
      newHolderId = teamId.trim();
    } else {
      if (!user) {
        setError('בחר משתמש');
        return;
      }
      newHolderType = 'USER';
      newHolderId = user.uid;
    }
    if (newHolderType === item.currentHolderType && newHolderId === item.currentHolderId) {
      setError(T.TRANSFER_NO_CHANGE);
      return;
    }
    setSubmitting(true);
    try {
      const ok = await onSubmit(item.id, { newHolderType, newHolderId });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{T.TRANSFER_TITLE}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div className="text-sm text-neutral-600">
            צ-{item.id}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{T.TRANSFER_TARGET}</label>
            <div className="flex gap-2 mb-2">
              {(['user', 'team'] as Mode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    mode === m
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {m === 'user' ? T.TRANSFER_TO_USER : T.TRANSFER_TO_TEAM}
                </button>
              ))}
            </div>
            {mode === 'team' ? (
              <Select
                value={teamId || null}
                onChange={(v) => setTeamId(v ?? '')}
                options={teamOptions}
                placeholder={teamOptions.length === 0 ? 'לא הוגדרו צוותים' : 'בחר צוות'}
                disabled={!isAdminOrSysMgr || teamOptions.length === 0}
                ariaLabel={T.TRANSFER_TO_TEAM}
              />
            ) : (
              <UserSearchInput
                value={user}
                onChange={(u) => setUser(u)}
                placeholder="חפש משתמש"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'שומר...' : T.TRANSFER_SUBMIT}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
