'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { isBruceLike } from '@/lib/ammunition/subcategories';
import type {
  AmmunitionItem,
  AmmunitionStock,
  AmmunitionType,
} from '@/types/ammunition';
import type { AssignFromCentralPayload } from '@/hooks/useAmmunitionInventory';

export interface AssignFromCentralModalProps {
  template: AmmunitionType;
  /** UNIT-pool stock doc for this template (BRUCE / BELT / LOOSE_COUNT). May be null when SERIAL. */
  unitStock: AmmunitionStock | null;
  /** SERIAL items currently held by UNIT_main. */
  unitItems: AmmunitionItem[];
  onClose: () => void;
  onSubmit: (payload: AssignFromCentralPayload) => Promise<boolean>;
}

type TargetKind = 'user' | 'team';

export default function AssignFromCentralModal({
  template,
  unitStock,
  unitItems,
  onClose,
  onSubmit,
}: AssignFromCentralModalProps) {
  const [targetKind, setTargetKind] = useState<TargetKind>('user');
  const [user, setUser] = useState<UserSearchResult | null>(null);
  const [teamId, setTeamId] = useState('');
  const [bruceCount, setBruceCount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSerials = useMemo(
    () => unitItems.filter((i) => i.templateId === template.id && i.status === 'AVAILABLE'),
    [unitItems, template.id]
  );

  const poolBalance = useMemo(() => {
    if (template.trackingMode === 'SERIAL') return availableSerials.length;
    if (isBruceLike(template.trackingMode)) return unitStock?.bruceCount ?? 0;
    return unitStock?.quantity ?? 0;
  }, [template, unitStock, availableSerials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target =
      targetKind === 'user'
        ? user
          ? { holderType: 'USER' as const, holderId: user.uid }
          : null
        : teamId.trim()
          ? { holderType: 'TEAM' as const, holderId: teamId.trim() }
          : null;
    if (!target) {
      setError('יש לבחור יעד');
      return;
    }

    const payload: AssignFromCentralPayload = {
      templateId: template.id,
      target,
    };

    if (template.trackingMode === 'SERIAL') {
      const serials = Array.from(selectedSerials);
      if (serials.length === 0) {
        setError('יש לבחור לפחות פריט סריאלי אחד');
        return;
      }
      payload.serials = serials;
    } else if (isBruceLike(template.trackingMode)) {
      const n = Number(bruceCount);
      if (!Number.isFinite(n) || n <= 0) {
        setError('כמות ברוסים חייבת להיות מספר חיובי');
        return;
      }
      if (n > poolBalance) {
        setError(`במלאי המרכזי יש רק ${poolBalance} ברוסים`);
        return;
      }
      payload.bruceCount = n;
    } else {
      const n = Number(quantity);
      if (!Number.isFinite(n) || n <= 0) {
        setError('כמות חייבת להיות מספר חיובי');
        return;
      }
      if (n > poolBalance) {
        setError(`במלאי המרכזי יש רק ${poolBalance} יח׳`);
        return;
      }
      payload.quantity = n;
    }

    setSubmitting(true);
    const ok = await onSubmit(payload);
    setSubmitting(false);
    if (ok) onClose();
    else setError('הקצאה נכשלה');
  };

  const toggleSerial = (serial: string) => {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            הקצאה ממלאי מרכזי — {template.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="text-sm text-neutral-600">
            במלאי המרכזי: {poolBalance}{' '}
            {template.trackingMode === 'SERIAL'
              ? 'פריטים זמינים'
              : isBruceLike(template.trackingMode)
                ? 'ברוסים'
                : 'יח׳'}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">סוג יעד</label>
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
              {(['user', 'team'] as TargetKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTargetKind(k)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    targetKind === k
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {k === 'user' ? 'משתמש' : 'צוות'}
                </button>
              ))}
            </div>
          </div>

          {targetKind === 'user' ? (
            <UserSearchInput value={user} onChange={setUser} placeholder="חפש משתמש" />
          ) : (
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="מזהה צוות"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          )}

          {template.trackingMode === 'SERIAL' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                פריטים סריאליים ({selectedSerials.size}/{availableSerials.length})
              </label>
              {availableSerials.length === 0 ? (
                <div className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-200 rounded-lg">
                  אין פריטים זמינים במלאי המרכזי
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                  {availableSerials.map((it) => (
                    <label
                      key={it.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSerials.has(it.id)}
                        onChange={() => toggleSerial(it.id)}
                      />
                      <span>צ-{it.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {isBruceLike(template.trackingMode) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                כמות ברוסים
              </label>
              <input
                type="number"
                min={1}
                max={poolBalance}
                value={bruceCount}
                onChange={(e) => setBruceCount(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {template.trackingMode === 'LOOSE_COUNT' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">כמות</label>
              <input
                type="number"
                min={1}
                max={poolBalance}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'מקצה...' : 'הקצה'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
