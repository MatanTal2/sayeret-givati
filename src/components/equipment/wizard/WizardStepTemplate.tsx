'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { type EquipmentType, TemplateStatus } from '@/types/equipment';
import { CategoriesService, type Category } from '@/lib/categories';
import { EquipmentService } from '@/lib/equipmentService';

interface Props {
  categoryId: string | null;
  subcategoryId: string | null;
  template: EquipmentType | null;
  onPick: (params: { categoryId: string; subcategoryId: string | null; template: EquipmentType }) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  onRequestNew: () => void;
}

export default function WizardStepTemplate({
  categoryId,
  subcategoryId,
  template,
  onPick,
  onSelectCategory,
  onSelectSubcategory,
  onRequestNew,
}: Props) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTemplates, setAllTemplates] = useState<EquipmentType[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingTpls, setLoadingTpls] = useState(true);

  useEffect(() => {
    let cancelled = false;
    CategoriesService.getCategories({ activeOnly: true, includeSubcategories: true })
      .then((res) => {
        if (!cancelled && res.success) setCategories(res.categories);
      })
      .finally(() => { if (!cancelled) setLoadingCats(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    EquipmentService.Types.getEquipmentTypes({ activeOnly: true })
      .then((res) => {
        if (!cancelled && res.success) {
          // Regular users only see canonical templates
          setAllTemplates(res.equipmentTypes.filter((t) => t.status === TemplateStatus.CANONICAL));
        }
      })
      .finally(() => { if (!cancelled) setLoadingTpls(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );
  const subcategories = selectedCategory?.subcategories ?? [];

  const filteredTemplates = useMemo(() => {
    if (!categoryId) return [];
    return allTemplates.filter((t) => {
      if (t.category !== categoryId) return false;
      if (subcategoryId && t.subcategory !== subcategoryId) return false;
      return true;
    });
  }, [allTemplates, categoryId, subcategoryId]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.CATEGORY}</label>
        <select
          value={categoryId ?? ''}
          onChange={(e) => {
            onSelectCategory(e.target.value || null);
            onSelectSubcategory(null);
          }}
          disabled={loadingCats}
          className="input-base text-sm truncate"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {!loadingCats && categories.length === 0 && (
          <p className="text-xs text-neutral-500 mt-1">{labels.EMPTY_CATEGORIES}</p>
        )}
      </div>

      {selectedCategory && subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.SUBCATEGORY}</label>
          <select
            value={subcategoryId ?? ''}
            onChange={(e) => onSelectSubcategory(e.target.value || null)}
            className="input-base text-sm truncate"
          >
            <option value="">—</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {categoryId && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.TEMPLATE}</label>
          {loadingTpls ? (
            <p className="text-xs text-neutral-500">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOADING_EQUIPMENT_TYPES}</p>
          ) : filteredTemplates.length === 0 ? (
            <p className="text-sm text-neutral-500">{labels.EMPTY_TEMPLATES}</p>
          ) : (
            <ul className="space-y-2">
              {filteredTemplates.map((t) => {
                const active = template?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onPick({ categoryId, subcategoryId, template: t })}
                      className={`w-full text-start p-3 rounded-lg border transition-all ${
                        active
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-neutral-900">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-neutral-500 mt-0.5">{t.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {t.requiresSerialNumber && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-info-100 text-info-700">צ</span>
                        )}
                        {t.requiresDailyStatusCheck && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700">דיווח יומי</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-neutral-200">
        <button
          type="button"
          onClick={onRequestNew}
          className="text-sm text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline"
        >
          {labels.NOT_FOUND_LINK}
        </button>
      </div>
    </div>
  );
}
