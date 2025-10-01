/**
 * Custom hook for managing equipment templates
 * Handles Firestore fetching and caching - uses only database data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { EquipmentTypesService } from '@/lib/equipmentService';
import { CategoriesService } from '@/lib/categoriesService';
import { EquipmentType } from '@/types/equipment';
import { Category, Subcategory } from '@/lib/categories/types';

// In-memory cache for templates
let templatesCache: EquipmentType[] | null = null;
let cacheTimestamp: number = 0;

// In-memory cache for categories and subcategories
let categoriesCache: Record<string, string> | null = null;
let subcategoriesCache: Record<string, string> | null = null;
let categoriesCacheTimestamp: number = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseTemplatesReturn {
  templates: EquipmentType[];
  templatesByCategory: Record<string, EquipmentType[]>;
  loading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  invalidateCache: () => void;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback(() => {
    return templatesCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  }, []);

  /**
   * Check if categories cache is still valid
   */
  const isCategoriesCacheValid = useCallback(() => {
    return categoriesCache !== null && subcategoriesCache !== null && 
           (Date.now() - categoriesCacheTimestamp) < CACHE_DURATION;
  }, []);

  /**
   * Fetch and cache categories and subcategories
   */
  const fetchCategoriesAndSubcategories = useCallback(async (): Promise<{
    categoriesMap: Record<string, string>;
    subcategoriesMap: Record<string, string>;
  }> => {
    console.log('🔍 Fetching categories and subcategories from Firestore');
    
    try {
      const categoriesResult = await CategoriesService.getCategories();
      
      if (categoriesResult.success && categoriesResult.categories) {
        const categoriesMap: Record<string, string> = {};
        const subcategoriesMap: Record<string, string> = {};
        
        // Build categories map and collect all subcategories
        categoriesResult.categories.forEach((category: Category) => {
          categoriesMap[category.id] = category.name;
          
          // Add subcategories to the map
          if (category.subcategories) {
            category.subcategories.forEach((subcategory: Subcategory) => {
              subcategoriesMap[subcategory.id] = subcategory.name;
            });
          }
        });
        
        // Cache the results
        categoriesCache = categoriesMap;
        subcategoriesCache = subcategoriesMap;
        categoriesCacheTimestamp = Date.now();
        
        console.log(`✅ Cached ${Object.keys(categoriesMap).length} categories and ${Object.keys(subcategoriesMap).length} subcategories`);
        
        return { categoriesMap, subcategoriesMap };
      } else {
        console.log('❌ Failed to fetch categories:', categoriesResult.error);
        return { categoriesMap: {}, subcategoriesMap: {} };
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return { categoriesMap: {}, subcategoriesMap: {} };
    }
  }, []);

  /**
   * Get categories and subcategories maps (from cache or fetch)
   */
  const getCategoriesMaps = useCallback(async () => {
    if (isCategoriesCacheValid()) {
      console.log('📦 Using cached categories and subcategories');
      return { 
        categoriesMap: categoriesCache!, 
        subcategoriesMap: subcategoriesCache! 
      };
    }
    
    return await fetchCategoriesAndSubcategories();
  }, [isCategoriesCacheValid, fetchCategoriesAndSubcategories]);


  /**
   * Fetch templates from Firestore and resolve category/subcategory names
   */
  const fetchTemplatesFromFirestore = useCallback(async (): Promise<EquipmentType[]> => {
    console.log('🔍 Fetching templates from Firestore');
    
    // Fetch templates and categories in parallel
    const [templatesResult, categoriesMaps] = await Promise.all([
      EquipmentTypesService.getTemplates(),
      getCategoriesMaps()
    ]);
    
    if (templatesResult.success && templatesResult.data) {
      const firestoreTemplates = templatesResult.data as EquipmentType[];
      const { categoriesMap, subcategoriesMap } = categoriesMaps;
      
      // Resolve category and subcategory names
      const templatesWithResolvedNames = firestoreTemplates.map(template => ({
        ...template,
        category: categoriesMap[template.category] || template.category || 'לא נמצא',
        subcategory: subcategoriesMap[template.subcategory] || template.subcategory || 'לא נמצא'
      }));
      
      console.log(`✅ Successfully fetched ${templatesWithResolvedNames.length} templates with resolved names`);
      return templatesWithResolvedNames;
    } else {
      console.log('❌ Failed to fetch templates from Firestore:', templatesResult.error);
      throw new Error(templatesResult.error || 'Failed to fetch templates');
    }
  }, [getCategoriesMaps]);

  /**
   * Load templates from Firestore only
   */
  const loadTemplates = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid()) {
      console.log('📦 Using cached templates');
      setTemplates(templatesCache!);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch from Firestore
      const firestoreTemplates = await fetchTemplatesFromFirestore();
      
      // Use Firestore data (even if empty)
      setTemplates(firestoreTemplates);
      
      // Update cache
      templatesCache = firestoreTemplates;
      cacheTimestamp = Date.now();
      
      console.log(`✅ Templates loaded from Firestore: ${firestoreTemplates.length} templates`);
    } catch (err) {
      // On error, show empty templates and error message
      setTemplates([]);
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Failed to load templates from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }, [isCacheValid, fetchTemplatesFromFirestore]);

  /**
   * Invalidate cache without fetching
   */
  const invalidateCache = useCallback(() => {
    console.log('🗑️ Invalidating templates cache');
    templatesCache = null;
    cacheTimestamp = 0;
  }, []);

  /**
   * Invalidate categories cache
   */
  const invalidateCategoriesCache = useCallback(() => {
    console.log('🗑️ Invalidating categories cache');
    categoriesCache = null;
    subcategoriesCache = null;
    categoriesCacheTimestamp = 0;
  }, []);

  /**
   * Refresh categories and subcategories (force fetch from Firestore)
   */
  const refreshCategories = useCallback(async () => {
    console.log('🔄 Force refreshing categories and subcategories');
    invalidateCategoriesCache();
    await fetchCategoriesAndSubcategories();
    // Also refresh templates to get updated category names
    await loadTemplates(true);
  }, [invalidateCategoriesCache, fetchCategoriesAndSubcategories, loadTemplates]);

  /**
   * Refresh templates (force fetch from Firestore)
   */
  const refreshTemplates = useCallback(async () => {
    console.log('🔄 Force refreshing templates');
    await loadTemplates(true);
  }, [loadTemplates]);

  /**
   * Group templates by category
   */
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, EquipmentType[]> = {};
    
    templates.forEach(template => {
      const category = template.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });
    
    return grouped;
  }, [templates]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    templatesByCategory,
    loading,
    error,
    refreshTemplates,
    refreshCategories,
    invalidateCache
  };
}
