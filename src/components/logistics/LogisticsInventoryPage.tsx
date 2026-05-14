'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useLogisticsItems } from '@/hooks/useLogisticsItems';
import { listLogisticsTemplates } from '@/lib/logistics/templatesRepository';
import { deleteLogisticsItem } from '@/lib/logistics/itemsRepository';
import type { LogisticsItem, LogisticsTemplate } from '@/types/logistics';
import AddLogisticsItemModal from './AddLogisticsItemModal';
import EditLogisticsItemModal from './EditLogisticsItemModal';

export default function LogisticsInventoryPage() {
  const { enhancedUser } = useAuth();
  const canEdit =
    !!enhancedUser &&
    (enhancedUser.userType === UserType.ADMIN ||
      enhancedUser.userType === UserType.SYSTEM_MANAGER ||
      enhancedUser.userType === UserType.MANAGER ||
      enhancedUser.userType === UserType.TEAM_LEADER);

  const { data: items, isLoading, error, refresh } = useLogisticsItems();
  const [templates, setTemplates] = useState<LogisticsTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<LogisticsItem | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    listLogisticsTemplates({ activeOnly: true }).then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2500);
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.category) set.add(it.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
  }, [items]);

  const subcategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) continue;
      if (it.subcategory) set.add(it.subcategory);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'));
  }, [items, categoryFilter]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && it.subcategory !== subcategoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const hit =
          it.name.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          (it.subcategory ?? '').toLowerCase().includes(q) ||
          (it.location ?? '').toLowerCase().includes(q) ||
          (it.currentHolderName ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [items, categoryFilter, subcategoryFilter, searchTerm]);

  const handleDelete = async (item: LogisticsItem) => {
    if (!confirm(`למחוק את "${item.name}" (${item.quantity})?`)) return;
    try {
      await deleteLogisticsItem(item.id);
      showToast('success', 'הפריט נמחק');
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'מחיקה נכשלה');
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-24">
      <div className="flex items-center justify-between mb-4">
        {canEdit && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={templates.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {TEXT_CONSTANTS.FEATURES.LOGISTICS.ADD_ITEM}
          </button>
        )}
      </div>

      {templates.length === 0 && (
        <div className="mb-4 p-3 rounded-lg bg-info-50 border border-info-200 text-info-800 text-sm">
          אין תבניות אפסנאות. מנהל יכול ליצור תבניות תחת ניהול → תבניות אפסנאות.
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-3 mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={TEXT_CONSTANTS.FEATURES.LOGISTICS.SEARCH_PLACEHOLDER}
            className="w-full ps-9 pe-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={categoryFilter === 'all' ? null : categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v === null ? 'all' : (v as string));
              setSubcategoryFilter('all');
            }}
            options={categoryOptions.map((c) => ({ value: c, label: c }))}
            placeholder={TEXT_CONSTANTS.FEATURES.LOGISTICS.ALL_CATEGORIES}
            clearable
            ariaLabel={TEXT_CONSTANTS.FEATURES.LOGISTICS.FILTER_BY_CATEGORY}
          />
          <Select
            value={subcategoryFilter === 'all' ? null : subcategoryFilter}
            onChange={(v) => setSubcategoryFilter(v === null ? 'all' : (v as string))}
            options={subcategoryOptions.map((c) => ({ value: c, label: c }))}
            placeholder={TEXT_CONSTANTS.FEATURES.LOGISTICS.ALL_SUBCATEGORIES}
            clearable
            ariaLabel={TEXT_CONSTANTS.FEATURES.LOGISTICS.FILTER_BY_SUBCATEGORY}
          />
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 mb-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {isLoading && items.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-500">
          {items.length === 0 ? 'אין פריטים. הוסף פריט ראשון.' : 'לא נמצאו פריטים התואמים לסינון.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-600">
              <tr>
                <th className="text-start px-3 py-2">שם</th>
                <th className="text-start px-3 py-2">קטגוריה</th>
                <th className="text-start px-3 py-2">תת-קטגוריה</th>
                <th className="text-start px-3 py-2">כמות</th>
                <th className="text-start px-3 py-2">מיקום</th>
                <th className="text-start px-3 py-2">מחזיק</th>
                {canEdit && <th className="text-start px-3 py-2 w-24">פעולות</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((it) => (
                <tr key={it.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-900">{it.name}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.category}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.subcategory ?? '—'}</td>
                  <td className="px-3 py-2 text-neutral-900 font-semibold">{it.quantity}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.location ?? '—'}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.currentHolderName ?? '—'}</td>
                  {canEdit && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(it)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
                          aria-label="ערוך"
                          title="ערוך"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(it)}
                          className="p-1.5 rounded hover:bg-danger-50 text-danger-500 hover:text-danger-700"
                          aria-label="מחק"
                          title="מחק"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddLogisticsItemModal
          templates={templates}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            refresh();
            showToast('success', 'הפריט נוצר');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
      {editing && (
        <EditLogisticsItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onUpdated={() => {
            setEditing(null);
            refresh();
            showToast('success', 'הפריט עודכן');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-[60]',
            toast.kind === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-danger-50 border border-danger-200 text-danger-800',
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
