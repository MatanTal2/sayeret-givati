'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import type {
  AmmunitionType,
  BruceState,
  HolderType,
} from '@/types/ammunition';
import type {
  CreateSerialItemPayload,
  UpsertStockPayload,
} from '@/hooks/useAmmunitionInventory';

const T = FEATURES.AMMUNITION;

const BRUCE_STATES: BruceState[] = ['FULL', 'MORE_THAN_HALF', 'LESS_THAN_HALF', 'EMPTY'];

export interface AddInventoryModalProps {
  templates: AmmunitionType[];
  onClose: () => void;
  onSubmitStock: (payload: UpsertStockPayload) => Promise<boolean>;
  onSubmitItem: (payload: CreateSerialItemPayload) => Promise<boolean>;
  /** When true, the holder pickers are exposed; when false, defaults to current user. */
  allowHolderPicker?: boolean;
}

type HolderChoice =
  | { kind: 'self' }
  | { kind: 'team'; teamId: string }
  | { kind: 'user'; user: UserSearchResult };

export default function AddInventoryModal({
  templates,
  onClose,
  onSubmitStock,
  onSubmitItem,
  allowHolderPicker = true,
}: AddInventoryModalProps) {
  const { enhancedUser } = useAuth();
  const [templateId, setTemplateId] = useState<string>('');
  const [holderChoice, setHolderChoice] = useState<HolderChoice>({ kind: 'self' });
  const [bruceCount, setBruceCount] = useState('0');
  const [openBruceState, setOpenBruceState] = useState<BruceState>('EMPTY');
  const [quantity, setQuantity] = useState('0');
  const [serial, setSerial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableTemplates = useMemo(() => {
    if (!enhancedUser) return [];
    if (
      enhancedUser.userType === UserType.ADMIN ||
      enhancedUser.userType === UserType.SYSTEM_MANAGER ||
      enhancedUser.userType === UserType.MANAGER ||
      enhancedUser.userType === UserType.TEAM_LEADER
    ) {
      return templates;
    }
    return templates.filter((t) => t.allocation === 'USER' || t.allocation === 'BOTH');
  }, [templates, enhancedUser]);

  const selectedTemplate = useMemo(
    () => selectableTemplates.find((t) => t.id === templateId) || null,
    [selectableTemplates, templateId]
  );

  useEffect(() => {
    if (!templateId && selectableTemplates.length > 0) {
      setTemplateId(selectableTemplates[0].id);
    }
  }, [selectableTemplates, templateId]);

  const isManagerOrTL =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER ||
    enhancedUser?.userType === UserType.TEAM_LEADER;

  const resolveHolder = (): { holderType: HolderType; holderId: string } | null => {
    if (!enhancedUser) return null;
    if (holderChoice.kind === 'self') {
      return { holderType: 'USER', holderId: enhancedUser.uid };
    }
    if (holderChoice.kind === 'team') {
      if (!holderChoice.teamId) return null;
      return { holderType: 'TEAM', holderId: holderChoice.teamId };
    }
    return { holderType: 'USER', holderId: holderChoice.user.uid };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedTemplate) {
      setError('יש לבחור פריט');
      return;
    }
    const holder = resolveHolder();
    if (!holder) {
      setError('יש לבחור מחזיק');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedTemplate.trackingMode === 'BRUCE') {
        const bc = Number(bruceCount);
        if (!Number.isFinite(bc) || bc < 0) {
          setError('כמות ברוסים לא תקינה');
          return;
        }
        const ok = await onSubmitStock({
          templateId: selectedTemplate.id,
          holderType: holder.holderType,
          holderId: holder.holderId,
          bruceCount: bc,
          openBruceState,
        });
        if (ok) onClose();
      } else if (selectedTemplate.trackingMode === 'LOOSE_COUNT') {
        const q = Number(quantity);
        if (!Number.isFinite(q) || q < 0) {
          setError('כמות לא תקינה');
          return;
        }
        const ok = await onSubmitStock({
          templateId: selectedTemplate.id,
          holderType: holder.holderType,
          holderId: holder.holderId,
          quantity: q,
        });
        if (ok) onClose();
      } else {
        if (!serial.trim()) {
          setError('יש להזין מספר סידורי');
          return;
        }
        const ok = await onSubmitItem({
          templateId: selectedTemplate.id,
          holderType: holder.holderType,
          holderId: holder.holderId,
          serial: serial.trim(),
        });
        if (ok) onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{T.ADD_NEW}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">פריט</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {selectableTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {T.TRACKING_MODE[t.trackingMode]}
                </option>
              ))}
            </select>
          </div>

          {allowHolderPicker && isManagerOrTL && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">מחזיק</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {(['self', 'team', 'user'] as const).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => {
                      if (k === 'self') setHolderChoice({ kind: 'self' });
                      else if (k === 'team')
                        setHolderChoice({
                          kind: 'team',
                          teamId: enhancedUser?.teamId || '',
                        });
                      else setHolderChoice({ kind: 'user', user: null as unknown as UserSearchResult });
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      holderChoice.kind === k
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {k === 'self' ? 'אני' : k === 'team' ? 'הצוות שלי' : 'משתמש אחר'}
                  </button>
                ))}
              </div>
              {holderChoice.kind === 'team' && (
                <input
                  type="text"
                  value={holderChoice.teamId}
                  onChange={(e) =>
                    setHolderChoice({ kind: 'team', teamId: e.target.value.trim() })
                  }
                  placeholder="מזהה צוות"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              )}
              {holderChoice.kind === 'user' && (
                <UserSearchInput
                  value={holderChoice.user || null}
                  onChange={(u) =>
                    u
                      ? setHolderChoice({ kind: 'user', user: u })
                      : setHolderChoice({ kind: 'self' })
                  }
                  placeholder="חפש משתמש"
                />
              )}
            </div>
          )}

          {selectedTemplate?.trackingMode === 'BRUCE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  כמות ברוסים
                </label>
                <input
                  type="number"
                  min={0}
                  value={bruceCount}
                  onChange={(e) => setBruceCount(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  מצב ברוס פתוח
                </label>
                <select
                  value={openBruceState}
                  onChange={(e) => setOpenBruceState(e.target.value as BruceState)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {BRUCE_STATES.map((s) => (
                    <option key={s} value={s}>
                      {T.BRUCE_STATE[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedTemplate?.trackingMode === 'LOOSE_COUNT' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">כמות</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {selectedTemplate?.trackingMode === 'SERIAL' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                מספר סידורי (צ)
              </label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="צ-12345"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting || !selectedTemplate}>
              {submitting ? 'שומר...' : 'הוסף'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
