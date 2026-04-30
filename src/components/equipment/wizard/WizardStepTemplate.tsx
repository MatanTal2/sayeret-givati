'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { type EquipmentType, TemplateStatus } from '@/types/equipment';
import { CategoriesService, type Category } from '@/lib/categories';
import { EquipmentService } from '@/lib/equipmentService';
import { Select } from '@/components/ui';
import { cn } from '@/lib/cn';

interface Props {
  categoryId: string | null;
  subcategoryId: string | null;
  template: EquipmentType | null;
  onPick: (params: { categoryId: string; subcategoryId: string | null; template: EquipmentType }) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  onRequestNew: () => void;
}

const ALL_SUB_VALUE = '__all__';

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
  const subcategories = useMemo(
    () => selectedCategory?.subcategories ?? [],
    [selectedCategory],
  );

  const filteredTemplates = useMemo(() => {
    if (!categoryId) return [];
    return allTemplates.filter((t) => {
      if (t.category !== categoryId) return false;
      if (subcategoryId && t.subcategory !== subcategoryId) return false;
      return true;
    });
  }, [allTemplates, categoryId, subcategoryId]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const subcategoryOptions = useMemo(
    () => [
      { value: ALL_SUB_VALUE, label: labels.ALL_SUBCATEGORIES },
      ...subcategories.map((s) => ({ value: s.id, label: s.name })),
    ],
    [subcategories, labels.ALL_SUBCATEGORIES],
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.CATEGORY}</label>
        <Select
          value={categoryId}
          onChange={(v) => {
            onSelectCategory(v);
            onSelectSubcategory(null);
          }}
          options={categoryOptions}
          clearable
          disabled={loadingCats}
          ariaLabel={labels.CATEGORY}
        />
        {!loadingCats && categories.length === 0 && (
          <p className="text-xs text-neutral-500 mt-1">{labels.EMPTY_CATEGORIES}</p>
        )}
      </div>

      {selectedCategory && subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.SUBCATEGORY}</label>
          <Select
            value={subcategoryId ?? ALL_SUB_VALUE}
            onChange={(v) => onSelectSubcategory(v === ALL_SUB_VALUE ? null : v)}
            options={subcategoryOptions}
            ariaLabel={labels.SUBCATEGORY}
          />
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
            <ul className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {filteredTemplates.map((t) => {
                const active = template?.id === t.id;
                const hasExtra = !!t.notes || !!t.defaultCatalogNumber;
                return (
                  <Disclosure key={t.id} as="li">
                    {({ open }) => (
                      <div
                        className={cn(
                          'rounded-lg border transition-colors overflow-hidden',
                          active ? 'border-primary-500 bg-primary-50' : 'border-neutral-200',
                        )}
                      >
                        <DisclosureButton
                          onClick={() => onPick({ categoryId, subcategoryId, template: t })}
                          className={cn(
                            'w-full text-start p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                            !active && 'hover:bg-neutral-50',
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-neutral-900">{t.name}</span>
                            {t.requiresSerialNumber && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-info-100 text-info-700">צ</span>
                            )}
                            {t.requiresDailyStatusCheck && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700">דיווח</span>
                            )}
                            <ChevronDown
                              className={cn(
                                'ms-auto w-4 h-4 text-neutral-500 transition-transform',
                                open && 'rotate-180',
                              )}
                            />
                          </div>
                          {t.description && (
                            <div className="text-xs text-neutral-500 mt-1">{t.description}</div>
                          )}
                        </DisclosureButton>
                        <DisclosurePanel className="px-3 pb-3 pt-2 border-t border-neutral-200 text-xs space-y-1.5 bg-white">
                          {t.notes && (
                            <div>
                              <span className="font-medium text-neutral-500">{labels.TEMPLATE_NOTES_LABEL}:</span>{' '}
                              <span className="text-neutral-700">{t.notes}</span>
                            </div>
                          )}
                          {t.defaultCatalogNumber && (
                            <div>
                              <span className="font-medium text-neutral-500">{labels.TEMPLATE_DEFAULT_CATALOG_LABEL}:</span>{' '}
                              <span className="text-neutral-700">{t.defaultCatalogNumber}</span>
                            </div>
                          )}
                          {!hasExtra && (
                            <p className="text-neutral-500">{labels.TEMPLATE_NO_EXTRA_INFO}</p>
                          )}
                        </DisclosurePanel>
                      </div>
                    )}
                  </Disclosure>
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
