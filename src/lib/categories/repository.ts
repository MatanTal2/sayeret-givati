/**
 * Categories Repository - Firestore data access layer
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { apiFetch } from '../apiFetch';
import {
  Category,
  Subcategory,
  CategoriesQueryOptions,
  SubcategoriesQueryOptions
} from './types';
import { COLLECTIONS } from './constants';

export class CategoriesRepository {
  
  /**
   * Get all categories from Firestore
   */
  static async getCategories(options: CategoriesQueryOptions = {}): Promise<Omit<Category, 'subcategories'>[]> {
    try {
    const {
      activeOnly = true,
      orderBy: orderByField = 'order'
    } = options;

      // Use simple query with isActive filter (no index required)
      const q = activeOnly 
        ? query(collection(db, COLLECTIONS.CATEGORIES), where('isActive', '==', true))
        : query(collection(db, COLLECTIONS.CATEGORIES));
      
      // For now, fetch all and filter in memory to avoid index requirements
      // TODO: Create proper Firestore indexes for production

      const snapshot = await getDocs(q);
      const categories: Omit<Category, 'subcategories'>[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const category = {
          id: doc.id,
          name: data.name,
          order: data.order || 0,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        
        // Add all (filtering already done by query)
        categories.push(category);
      });

      // Sort in memory
      if (orderByField === 'order') {
        categories.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name, 'he');
        });
      } else if (orderByField === 'name') {
        categories.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      }

      return categories;
    } catch (error) {
      // If collection doesn't exist or permissions issue, return empty array
      console.log('Categories collection empty or inaccessible, returning empty array:', error);
      return [];
    }
  }

  /**
   * Get all subcategories from Firestore
   */
  static async getSubcategories(options: SubcategoriesQueryOptions = {}): Promise<Subcategory[]> {
    try {
      const {
        parentCategoryId,
        activeOnly = true,
        orderBy: orderByField = 'order'
      } = options;

      // Use simple query with isActive filter (no index required)
      const q = activeOnly 
        ? query(collection(db, COLLECTIONS.SUBCATEGORIES), where('isActive', '==', true))
        : query(collection(db, COLLECTIONS.SUBCATEGORIES));
      
      // For now, fetch all and filter in memory to avoid index requirements
      // TODO: Create proper Firestore indexes for production

      const snapshot = await getDocs(q);
      const subcategories: Subcategory[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const subcategory = {
          id: doc.id,
          name: data.name,
          parentCategoryId: data.parentCategoryId,
          order: data.order || 0,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        
        // Apply parentCategoryId filter in memory (isActive already filtered by query)
        if (!parentCategoryId || subcategory.parentCategoryId === parentCategoryId) {
          subcategories.push(subcategory);
        }
      });

      // Sort in memory
      if (orderByField === 'order') {
        subcategories.sort((a, b) => {
          // First by parent category
          if (a.parentCategoryId !== b.parentCategoryId) {
            return a.parentCategoryId.localeCompare(b.parentCategoryId);
          }
          // Then by order
          if (a.order !== b.order) return a.order - b.order;
          // Finally by name
          return a.name.localeCompare(b.name, 'he');
        });
      } else if (orderByField === 'name') {
        subcategories.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      }

      return subcategories;
    } catch (error) {
      // If collection doesn't exist or permissions issue, return empty array
      console.log('Subcategories collection empty or inaccessible, returning empty array:', error);
      return [];
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(categoryId: string): Promise<Omit<Category, 'subcategories'> | null> {
    const categoryDoc = await getDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    
    if (!categoryDoc.exists()) {
      return null;
    }

    const data = categoryDoc.data();
    return {
      id: categoryDoc.id,
      name: data.name,
      order: data.order || 0,
      isActive: data.isActive,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Get a single subcategory by ID
   */
  static async getSubcategoryById(subcategoryId: string): Promise<Subcategory | null> {
    const subcategoryDoc = await getDoc(doc(db, COLLECTIONS.SUBCATEGORIES, subcategoryId));
    
    if (!subcategoryDoc.exists()) {
      return null;
    }

    const data = subcategoryDoc.data();
    return {
      id: subcategoryDoc.id,
      name: data.name,
      parentCategoryId: data.parentCategoryId,
      order: data.order || 0,
      isActive: data.isActive,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  /**
   * Check if category exists
   */
  static async categoryExists(categoryId: string): Promise<boolean> {
    try {
      const categoryDoc = await getDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
      return categoryDoc.exists();
    } catch (error) {
      console.log('Error checking category existence, assuming false:', error);
      return false;
    }
  }

  /**
   * Check if subcategory exists
   */
  static async subcategoryExists(subcategoryId: string): Promise<boolean> {
    try {
      const subcategoryDoc = await getDoc(doc(db, COLLECTIONS.SUBCATEGORIES, subcategoryId));
      return subcategoryDoc.exists();
    } catch (error) {
      console.log('Error checking subcategory existence, assuming false:', error);
      return false;
    }
  }

  /**
   * Create a new category.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async createCategory(
    categoryData: Omit<Category, 'id' | 'subcategories' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create category');
    return result.id;
  }

  /**
   * Create a new subcategory.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async createSubcategory(
    subcategoryData: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const response = await apiFetch('/api/categories/subcategories', {
      method: 'POST',
      body: JSON.stringify(subcategoryData),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create subcategory');
    return result.id;
  }

  /**
   * Update a category.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async updateCategory(
    categoryId: string,
    updates: Partial<Pick<Category, 'name' | 'order' | 'isActive'>>
  ): Promise<void> {
    const response = await apiFetch('/api/categories', {
      method: 'PUT',
      body: JSON.stringify({ id: categoryId, ...updates }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to update category');
  }

  /**
   * Update a subcategory.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async updateSubcategory(
    subcategoryId: string,
    updates: Partial<Pick<Subcategory, 'name' | 'order' | 'isActive'>>
  ): Promise<void> {
    const response = await apiFetch('/api/categories/subcategories', {
      method: 'PUT',
      body: JSON.stringify({ id: subcategoryId, ...updates }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to update subcategory');
  }

  /**
   * Get next order number for categories.
   * Reads max(order)+1 via orderBy+limit(1) instead of scanning the whole
   * collection. Safer than `snapshot.size` (which produces duplicate orders
   * after deletes) and cheaper (1 doc read vs N).
   */
  static async getNextCategoryOrder(): Promise<number> {
    try {
      const q = query(collection(db, COLLECTIONS.CATEGORIES), orderBy('order', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return 0;
      const top = snapshot.docs[0].data() as { order?: number };
      return (top.order ?? 0) + 1;
    } catch (error) {
      console.log('Error getting max category order, assuming 0:', error);
      return 0;
    }
  }

  /**
   * Get next order number for subcategories in a category.
   * Needs a composite index (parentCategoryId ASC, order DESC) to use the
   * limited path; falls back to scanning the parent's subcategories if the
   * index is missing.
   */
  static async getNextSubcategoryOrder(parentCategoryId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBCATEGORIES),
        where('parentCategoryId', '==', parentCategoryId),
        orderBy('order', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return 0;
      const top = snapshot.docs[0].data() as { order?: number };
      return (top.order ?? 0) + 1;
    } catch (error) {
      console.log('Error getting max subcategory order, falling back:', error);
      try {
        const q = query(
          collection(db, COLLECTIONS.SUBCATEGORIES),
          where('parentCategoryId', '==', parentCategoryId)
        );
        const snapshot = await getDocs(q);
        let max = -1;
        snapshot.forEach((d) => {
          const o = (d.data() as { order?: number }).order ?? -1;
          if (o > max) max = o;
        });
        return max + 1;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Deactivate category and all its subcategories.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async deactivateCategory(categoryId: string): Promise<void> {
    const response = await apiFetch('/api/categories', {
      method: 'DELETE',
      body: JSON.stringify({ id: categoryId }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to deactivate category');
  }

  /**
   * Deactivate subcategory.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async deactivateSubcategory(subcategoryId: string): Promise<void> {
    const response = await apiFetch('/api/categories/subcategories', {
      method: 'DELETE',
      body: JSON.stringify({ id: subcategoryId }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to deactivate subcategory');
  }
}
