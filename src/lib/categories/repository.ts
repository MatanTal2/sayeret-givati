/**
 * Categories Repository - Firestore data access layer
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
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
   * Create a new category
   */
  static async createCategory(
    categoryData: Omit<Category, 'id' | 'subcategories' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const categoryDoc = doc(collection(db, COLLECTIONS.CATEGORIES));
    
    const category = {
      ...categoryData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(categoryDoc, category);
    return categoryDoc.id; // Return the auto-generated ID
  }

  /**
   * Create a new subcategory
   */
  static async createSubcategory(
    subcategoryData: Omit<Subcategory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const subcategoryDoc = doc(collection(db, COLLECTIONS.SUBCATEGORIES));
    
    const subcategory = {
      ...subcategoryData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(subcategoryDoc, subcategory);
    return subcategoryDoc.id; // Return the auto-generated ID
  }

  /**
   * Update a category
   */
  static async updateCategory(
    categoryId: string,
    updates: Partial<Pick<Category, 'name' | 'order' | 'isActive'>>
  ): Promise<void> {
    const categoryDoc = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    
    await updateDoc(categoryDoc, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Update a subcategory
   */
  static async updateSubcategory(
    subcategoryId: string,
    updates: Partial<Pick<Subcategory, 'name' | 'order' | 'isActive'>>
  ): Promise<void> {
    const subcategoryDoc = doc(db, COLLECTIONS.SUBCATEGORIES, subcategoryId);
    
    await updateDoc(subcategoryDoc, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get next order number for categories
   */
  static async getNextCategoryOrder(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      return snapshot.size;
    } catch (error) {
      console.log('Error getting category count, assuming 0:', error);
      return 0;
    }
  }

  /**
   * Get next order number for subcategories in a category
   */
  static async getNextSubcategoryOrder(parentCategoryId: string): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBCATEGORIES),
        where('parentCategoryId', '==', parentCategoryId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.log('Error getting subcategory count, assuming 0:', error);
      return 0;
    }
  }

  /**
   * Deactivate category and all its subcategories
   */
  static async deactivateCategory(categoryId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Deactivate category
    const categoryDoc = doc(db, COLLECTIONS.CATEGORIES, categoryId);
    batch.update(categoryDoc, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    // Deactivate all subcategories
    const subcategoriesQuery = query(
      collection(db, COLLECTIONS.SUBCATEGORIES),
      where('parentCategoryId', '==', categoryId)
    );
    
    const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
    subcategoriesSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  }

  /**
   * Deactivate subcategory
   */
  static async deactivateSubcategory(subcategoryId: string): Promise<void> {
    const subcategoryDoc = doc(db, COLLECTIONS.SUBCATEGORIES, subcategoryId);
    
    await updateDoc(subcategoryDoc, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  }
}
