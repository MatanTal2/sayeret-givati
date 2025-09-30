/**
 * Categories Service Utility Functions
 */

import { Category, Subcategory } from './types';

/**
 * Validate Hebrew text
 */
export function isHebrewText(text: string): boolean {
  // Hebrew Unicode range: \u0590-\u05FF (includes Hebrew letters, vowels, and punctuation)
  // Allow spaces, numbers, and basic punctuation
  const hebrewRegex = /^[\u0590-\u05FF\s\d\-.,!?()]+$/;
  return hebrewRegex.test(text.trim());
}

/**
 * Group subcategories by parent category ID
 */
export function groupSubcategoriesByParent(subcategories: Subcategory[]): Map<string, Subcategory[]> {
  const subcategoriesMap = new Map<string, Subcategory[]>();
  
  subcategories.forEach(subcategory => {
    const parentId = subcategory.parentCategoryId;
    
    if (!subcategoriesMap.has(parentId)) {
      subcategoriesMap.set(parentId, []);
    }
    subcategoriesMap.get(parentId)!.push(subcategory);
  });
  
  return subcategoriesMap;
}

/**
 * Merge subcategories into categories
 */
export function mergeCategoriesWithSubcategories(
  categories: Omit<Category, 'subcategories'>[],
  subcategoriesMap: Map<string, Subcategory[]>
): Category[] {
  return categories.map(category => ({
    ...category,
    subcategories: subcategoriesMap.get(category.id) || []
  }));
}

/**
 * Sort categories/subcategories by order and name
 */
export function sortByOrderAndName<T extends { order: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // First sort by order
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    // Then by name (Hebrew locale)
    return a.name.localeCompare(b.name, 'he');
  });
}

/**
 * Validate category/subcategory name
 */
export function validateName(name: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'השם לא יכול להיות ריק' };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'השם חייב להכיל לפחות 2 תווים' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'השם לא יכול להכיל יותר מ-50 תווים' };
  }
  
  // Validate Hebrew text
  if (!isHebrewText(trimmedName)) {
    return { isValid: false, error: 'השם חייב להיות בעברית בלבד' };
  }
  
  return { isValid: true };
}

/**
 * Create error result
 */
export function createErrorResult(error: string, message?: string) {
  return {
    success: false,
    error,
    message: message || error
  };
}

/**
 * Create success result
 */
export function createSuccessResult<T>(data?: T, message?: string) {
  return {
    success: true,
    data,
    message
  };
}
