'use client';

import React, { useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import { EquipmentStatus } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';
import StatusComponent from './EquipmentStatus';
import ConditionComponent from './EquipmentCondition';
import EquipmentRowActions, { type EquipmentRowAction } from './EquipmentRowActions';

const STALE_REPORT_DAYS = 7;

type SortField = 'id' | 'productName' | 'currentHolder' | 'status' | 'lastReportUpdate';
type SortOrder = 'asc' | 'desc';

interface EquipmentTableProps {
  equipment: Equipment[];
  user: EnhancedAuthUser;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAllVisible: () => void;
  onRowAction: (item: Equipment, action: EquipmentRowAction) => void;
  emptyMessage: string;
}

export default function EquipmentTable({
  equipment,
  user,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllVisible,
  onRowAction,
  emptyMessage,
}: EquipmentTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastReportUpdate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const list = [...equipment];
    list.sort((a, b) => {
      const av = readSortValue(a, sortField);
      const bv = readSortValue(b, sortField);
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortOrder === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [equipment, sortField, sortOrder]);

  const allSelected = sorted.length > 0 && sorted.every((i) => selectedIds.has(i.id));
  const someSelected = sorted.some((i) => selectedIds.has(i.id));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-12 text-center">
        <div className="text-5xl mb-3">📦</div>
        <p className="text-neutral-600 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SortBar
        sortField={sortField}
        sortOrder={sortOrder}
        onChangeField={setSortField}
        onToggleOrder={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={onToggleSelectAllVisible}
        totalVisible={sorted.length}
        selectedCount={Array.from(selectedIds).filter((id) => sorted.some((s) => s.id === id)).length}
      />

      <ul className="space-y-2">
        {sorted.map((item) => (
          <EquipmentRow
            key={item.id}
            item={item}
            user={user}
            selected={selectedIds.has(item.id)}
            expanded={expandedId === item.id}
            onToggleSelect={() => onToggleSelect(item.id)}
            onToggleExpand={() => setExpandedId((cur) => (cur === item.id ? null : item.id))}
            onAction={(action) => onRowAction(item, action)}
          />
        ))}
      </ul>
    </div>
  );
}

interface SortBarProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onChangeField: (f: SortField) => void;
  onToggleOrder: () => void;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  totalVisible: number;
  selectedCount: number;
}

function SortBar({
  sortField,
  sortOrder,
  onChangeField,
  onToggleOrder,
  allSelected,
  someSelected,
  onToggleAll,
  totalVisible,
  selectedCount,
}: SortBarProps) {
  const sortLabels: Record<SortField, string> = {
    id: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_SERIAL,
    productName: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_ITEM,
    currentHolder: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_HOLDER,
    status: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_STATUS,
    lastReportUpdate: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_LAST_CHECK,
  };
  return (
    <div className="bg-white rounded-xl border border-neutral-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-2 cursor-pointer text-neutral-700">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = !allSelected && someSelected;
          }}
          onChange={onToggleAll}
          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
        />
        <span>{selectedCount > 0 ? `${selectedCount}/${totalVisible}` : `${totalVisible}`}</span>
      </label>
      <span className="text-neutral-300">|</span>
      <span className="text-neutral-500">מיון:</span>
      <select
        value={sortField}
        onChange={(e) => onChangeField(e.target.value as SortField)}
        className="px-2 py-1 text-xs border border-neutral-200 rounded-md bg-white focus:ring-2 focus:ring-primary-500"
      >
        {(Object.keys(sortLabels) as SortField[]).map((f) => (
          <option key={f} value={f}>{sortLabels[f]}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleOrder}
        className="p-1 rounded-md text-neutral-600 hover:bg-neutral-100"
        aria-label="toggle sort order"
      >
        {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

interface EquipmentRowProps {
  item: Equipment;
  user: EnhancedAuthUser;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onAction: (action: EquipmentRowAction) => void;
}

function EquipmentRow({
  item,
  user,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onAction,
}: EquipmentRowProps) {
  const dimmed = item.signedById === user.uid && item.currentHolderId !== user.uid;
  const stale = isStale(item.lastReportUpdate);
  const requiresSerial = !!item.id;

  return (
    <li
      className={`bg-white rounded-xl border border-neutral-200 overflow-hidden transition-colors ${
        dimmed ? 'opacity-60' : ''
      } ${expanded ? 'ring-1 ring-primary-200 border-primary-300' : 'hover:border-neutral-300'}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="px-3 py-3 flex items-center gap-3 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
          aria-label="select"
        />
        <StatusDot status={item.status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate flex items-center gap-1.5">
            <span className="truncate">{item.productName}</span>
            {requiresSerial && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-info-100 text-info-700 flex-shrink-0">
                צ
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-500 truncate">#{item.id}</div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <EquipmentRowActions equipment={item} user={user} onAction={onAction} />
        </div>
      </div>
      {expanded && <ExpandedPanel item={item} dimmed={dimmed} stale={stale} />}
    </li>
  );
}

function StatusDot({ status }: { status: EquipmentStatus }) {
  const colorMap: Record<EquipmentStatus, string> = {
    [EquipmentStatus.AVAILABLE]: 'bg-success-500',
    [EquipmentStatus.PENDING_TRANSFER]: 'bg-warning-500',
    [EquipmentStatus.SECURITY]: 'bg-info-500',
    [EquipmentStatus.REPAIR]: 'bg-danger-500',
    [EquipmentStatus.LOST]: 'bg-danger-700',
    [EquipmentStatus.RETIRED]: 'bg-neutral-400',
  };
  const titleMap: Record<EquipmentStatus, string> = {
    [EquipmentStatus.AVAILABLE]: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_AVAILABLE,
    [EquipmentStatus.PENDING_TRANSFER]: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_PENDING_TRANSFER,
    [EquipmentStatus.SECURITY]: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_SECURITY,
    [EquipmentStatus.REPAIR]: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_REPAIR,
    [EquipmentStatus.LOST]: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_LOST,
    [EquipmentStatus.RETIRED]: 'הוחזר',
  };
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorMap[status] ?? 'bg-neutral-300'}`}
      title={titleMap[status] ?? status}
      aria-label={titleMap[status] ?? status}
    />
  );
}

function ExpandedPanel({
  item,
  dimmed,
  stale,
}: {
  item: Equipment;
  dimmed: boolean;
  stale: { isStale: boolean; days: number };
}) {
  return (
    <div className="px-3 pb-3 pt-2 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs">
      <PhotoBox url={item.photoUrl} />
      <div className="space-y-1.5">
        <Field label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_HOLDER} value={item.currentHolder} />
        {dimmed && (
          <p className="text-warning-700">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.DIMMED_ANNOTATION.replace('{holder}', item.currentHolder)}
          </p>
        )}
        <Field label="חתום" value={item.signedBy} />
        <Field label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOCATION} value={item.location || '—'} />
        <Field label="קטגוריה" value={item.category} />
      </div>
      <div className="col-span-2 space-y-1.5 pt-2 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <Field label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_STATUS}>
            <StatusComponent status={item.status} size="sm" variant="outlined" />
          </Field>
          <Field label="מצב">
            <ConditionComponent condition={item.condition} size="sm" />
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <Field label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_LAST_CHECK} value={formatDate(item.lastReportUpdate)} />
          {stale.isStale && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-800">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.STALE_REPORT_BADGE.replace('{days}', String(stale.days))}
            </span>
          )}
        </div>
        {item.catalogNumber && <Field label="מק״ט" value={item.catalogNumber} />}
        {item.notes && <Field label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.NOTES} value={item.notes} />}
      </div>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}: </span>
      {children ? <span className="text-neutral-900">{children}</span> : <span className="text-neutral-900">{value ?? '—'}</span>}
    </div>
  );
}

function PhotoBox({ url }: { url: string }) {
  if (!url) {
    return (
      <div className="aspect-square rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
        —
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover bg-neutral-100" />
  );
}

function readSortValue(item: Equipment, field: SortField): string | number {
  switch (field) {
    case 'id': return item.id;
    case 'productName': return item.productName;
    case 'currentHolder': return item.currentHolder;
    case 'status': return statusOrder(item.status);
    case 'lastReportUpdate': return toDateMs(item.lastReportUpdate);
  }
}

function statusOrder(s: EquipmentStatus): number {
  const order: Record<EquipmentStatus, number> = {
    [EquipmentStatus.AVAILABLE]: 0,
    [EquipmentStatus.PENDING_TRANSFER]: 1,
    [EquipmentStatus.SECURITY]: 2,
    [EquipmentStatus.REPAIR]: 3,
    [EquipmentStatus.LOST]: 4,
    [EquipmentStatus.RETIRED]: 5,
  };
  return order[s] ?? 99;
}

function toDateMs(t: Timestamp | Date | string | undefined): number {
  if (!t) return 0;
  if (t instanceof Timestamp) return t.toDate().getTime();
  if (t instanceof Date) return t.getTime();
  return new Date(t).getTime();
}

function formatDate(t: Timestamp | Date | string | undefined): string {
  if (!t) return '—';
  return new Date(toDateMs(t)).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function isStale(t: Timestamp | Date | string | undefined): { isStale: boolean; days: number } {
  const ms = toDateMs(t);
  if (!ms) return { isStale: false, days: 0 };
  const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
  return { isStale: days >= STALE_REPORT_DAYS, days };
}
