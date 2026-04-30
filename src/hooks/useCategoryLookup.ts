/**
 * Loads the categories tree once and exposes O(1) ID-to-name lookups for
 * categories and subcategories. Used wherever a list view needs to render
 * the human-readable name for the IDs stored on `EquipmentType.category` /
 * `EquipmentType.subcategory`.
 */
import { useEffect, useMemo, useState } from 'react';
import { CategoriesService, type Category } from '@/lib/categoriesService';

export interface UseCategoryLookupReturn {
  categoryName: (id: string) => string | null;
  subcategoryName: (id: string) => string | null;
  isLoading: boolean;
}

export function useCategoryLookup(): UseCategoryLookupReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    CategoriesService.getCategories()
      .then((result) => {
        if (cancelled) return;
        if (result.success) setCategories(result.categories ?? []);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const catById = new Map<string, string>();
    const subById = new Map<string, string>();
    for (const c of categories) {
      catById.set(c.id, c.name);
      for (const s of c.subcategories ?? []) subById.set(s.id, s.name);
    }
    return {
      categoryName: (id: string) => catById.get(id) ?? null,
      subcategoryName: (id: string) => subById.get(id) ?? null,
      isLoading,
    };
  }, [categories, isLoading]);
}
