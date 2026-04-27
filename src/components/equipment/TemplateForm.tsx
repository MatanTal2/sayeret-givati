'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { CategoriesService } from '@/lib/categoriesService';
import FormFieldCategory from './template-form/FormFieldCategory';
import FormFieldSubcategory from './template-form/FormFieldSubcategory';
import FormFieldRequiresDailyCheck from './template-form/FormFieldRequiresDailyCheck';
import { Button } from '@/components/ui';
import type { Category } from './template-form/types';

export interface TemplateFormValues {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  notes: string;
  requiresSerialNumber: boolean;
  requiresDailyStatusCheck: boolean;
  defaultCatalogNumber: string;
}

const EMPTY_VALUES: TemplateFormValues = {
  name: '',
  description: '',
  category: '',
  subcategory: '',
  notes: '',
  requiresSerialNumber: true,
  requiresDailyStatusCheck: false,
  defaultCatalogNumber: '',
};

export type TemplateFormMode =
  | 'create_canonical'
  | 'propose'
  | 'edit_and_approve'
  | 'request';

export interface TemplateFormProps {
  mode: TemplateFormMode;
  initialValues?: Partial<TemplateFormValues>;
  submitLabel?: string;
  onSubmit: (values: TemplateFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface Errors {
  [k: string]: string;
}

export default function TemplateForm({
  mode,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TemplateFormProps) {
  const [values, setValues] = useState<TemplateFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    setValues({ ...EMPTY_VALUES, ...initialValues });
  }, [initialValues]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const result = await CategoriesService.getCategories();
      if (result.success) {
        setCategories(result.categories || []);
      } else if (result.error && !result.error.includes('permissions')) {
        setCategoriesError(result.error);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const availableSubcategories = useMemo(() => {
    return categories.find((c) => c.id === values.category)?.subcategories || [];
  }, [categories, values.category]);

  const setField = <K extends keyof TemplateFormValues>(
    field: K,
    value: TemplateFormValues[K]
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'category' ? { subcategory: '' } : {}),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!values.name.trim()) {
      next.name = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME_REQUIRED;
    }
    if (!values.category) {
      next.category = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORY_REQUIRED;
    }
    if (!values.subcategory) {
      next.subcategory = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SUBCATEGORY_REQUIRED;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  const defaultLabel =
    mode === 'create_canonical'
      ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CREATE_TEMPLATE
      : mode === 'propose'
        ? 'הגש הצעה'
        : mode === 'request'
          ? 'שלח בקשה'
          : 'אשר תבנית';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="tf-name" className="block text-sm font-medium text-neutral-700 mb-1">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME} *
          </label>
          <input
            id="tf-name"
            type="text"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME_PLACEHOLDER}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-sm text-danger-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="tf-description" className="block text-sm font-medium text-neutral-700 mb-1">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION}
          </label>
          <textarea
            id="tf-description"
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={3}
            placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION_PLACEHOLDER}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-neutral-900">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORIES}
          </h4>
          <button
            type="button"
            onClick={loadCategories}
            disabled={categoriesLoading}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.REFRESH}
          </button>
        </div>
        {categoriesError && <p className="text-sm text-danger-600">{categoriesError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldCategory
            value={values.category}
            onChange={(v) => setField('category', v)}
            categories={categories}
            onCategoriesRefresh={loadCategories}
            error={errors.category}
            disabled={isSubmitting || categoriesLoading}
          />
          <FormFieldSubcategory
            value={values.subcategory}
            onChange={(v) => setField('subcategory', v)}
            subcategories={availableSubcategories}
            selectedCategoryId={values.category}
            onCategoriesRefresh={loadCategories}
            error={errors.subcategory}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium text-neutral-900">מאפיינים</h4>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.requiresSerialNumber}
            onChange={(e) => setField('requiresSerialNumber', e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4"
          />
          <span className="text-sm text-neutral-700">דרוש מספר סידורי (צ)</span>
        </label>

        <FormFieldRequiresDailyCheck
          value={values.requiresDailyStatusCheck}
          onChange={(v) => setField('requiresDailyStatusCheck', v)}
          disabled={isSubmitting}
        />

        <div>
          <label htmlFor="tf-catalog" className="block text-sm font-medium text-neutral-700 mb-1">
            מספר מק&quot;ט ברירת מחדל
          </label>
          <input
            id="tf-catalog"
            type="text"
            value={values.defaultCatalogNumber}
            onChange={(e) => setField('defaultCatalogNumber', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="tf-notes" className="block text-sm font-medium text-neutral-700 mb-1">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES}
          </label>
          <textarea
            id="tf-notes"
            value={values.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={3}
            placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES_PLACEHOLDER}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            {TEXT_CONSTANTS.CONFIRMATIONS.CANCEL}
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel ?? defaultLabel}
        </Button>
      </div>
    </form>
  );
}
