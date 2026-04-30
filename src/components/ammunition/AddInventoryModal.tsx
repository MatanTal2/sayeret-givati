'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { AMMUNITION_SUBCATEGORIES } from '@/lib/ammunition/subcategories';
import type {
  AmmunitionSubcategory,
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
  const { config: systemConfig } = useSystemConfig();
  const [subcategory, setSubcategory] = useState<AmmunitionSubcategory | null>(null);
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

  const filteredTemplates = useMemo(() => {
    if (!subcategory) return [];
    return selectableTemplates.filter((t) => t.subcategory === subcategory);
  }, [selectableTemplates, subcategory]);

  const selectedTemplate = useMemo(
    () => filteredTemplates.find((t) => t.id === templateId) || null,
    [filteredTemplates, templateId]
  );

  const handleSubcategoryChange = (next: AmmunitionSubcategory | null) => {
    setSubcategory(next);
    setTemplateId('');
  };

  const isManagerOrTL =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER ||
    enhancedUser?.userType === UserType.TEAM_LEADER;

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
            <label className="block text-sm font-medium text-neutral-700 mb-1">תת-קטגוריה</label>
            <Select<AmmunitionSubcategory>
              value={subcategory}
              onChange={handleSubcategoryChange}
              options={AMMUNITION_SUBCATEGORIES.map((s) => ({
                value: s,
                label: T.SUBCATEGORIES[s],
              }))}
              placeholder="בחר תת-קטגוריה"
              clearable
              ariaLabel="תת-קטגוריה"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">פריט</label>
            <Select
              value={templateId || null}
              onChange={(v) => setTemplateId(v ?? '')}
              options={filteredTemplates.map((t) => ({
                value: t.id,
                label: `${t.name} · ${T.TRACKING_MODE[t.trackingMode]}`,
              }))}
              placeholder={subcategory ? 'בחר פריט' : 'בחר תת-קטגוריה תחילה'}
              disabled={!subcategory || filteredTemplates.length === 0}
              clearable
              ariaLabel="פריט"
            />
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
                <>
                  <Select
                    value={holderChoice.teamId || null}
                    onChange={(v) =>
                      setHolderChoice({ kind: 'team', teamId: v ?? '' })
                    }
                    options={teamOptions}
                    placeholder={
                      teamOptions.length === 0
                        ? 'לא הוגדרו צוותים'
                        : 'בחר צוות'
                    }
                    disabled={!isAdminOrSysMgr || teamOptions.length === 0}
                    ariaLabel="צוות"
                  />
                  {!isAdminOrSysMgr && (
                    <p className="mt-1 text-xs text-neutral-500">
                      רק מנהל מערכת יכול להחליף צוות
                    </p>
                  )}
                </>
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
                <Select
                  value={openBruceState}
                  onChange={(v) => v && setOpenBruceState(v as BruceState)}
                  options={BRUCE_STATES.map((s) => ({
                    value: s,
                    label: T.BRUCE_STATE[s],
                  }))}
                  ariaLabel="מצב ברוס פתוח"
                />
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
