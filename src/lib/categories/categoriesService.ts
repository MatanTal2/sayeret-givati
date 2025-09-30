/**
 * Categories Service - Business logic layer
 */

import { Timestamp } from 'firebase/firestore';
import { 
  Category,
  CreateCategoryData,
  CreateSubcategoryData,
  UpdateCategoryData,
  UpdateSubcategoryData,
  CategoriesListResult,
  SubcategoriesListResult,
  CategoryResult,
  SubcategoryResult,
  CategoriesServiceResult,
  CategoriesQueryOptions,
  SubcategoriesQueryOptions
} from './types';
import { CategoriesRepository } from './repository';
import { 
  groupSubcategoriesByParent,
  mergeCategoriesWithSubcategories,
  sortByOrderAndName,
  validateName,
  createErrorResult,
  createSuccessResult
} from './utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, DEFAULTS } from './constants';

export class CategoriesService {
  
  /**
   * Get all categories with their subcategories
   */
  static async getCategories(options: CategoriesQueryOptions = {}): Promise<CategoriesListResult> {
    try {
      const { includeSubcategories = true } = options;
      
      // Get categories
      const categories = await CategoriesRepository.getCategories(options);
      
      if (!includeSubcategories) {
        const categoriesWithEmptySubcategories = categories.map(cat => ({
          ...cat,
          subcategories: []
        }));
        
        return {
          success: true,
          categories: sortByOrderAndName(categoriesWithEmptySubcategories)
        };
      }
      
      // Get subcategories
      const subcategories = await CategoriesRepository.getSubcategories({
        activeOnly: options.activeOnly
      });
      
      // Group subcategories by parent category
      const subcategoriesMap = groupSubcategoriesByParent(subcategories);
      
      // Merge categories with subcategories
      const categoriesWithSubcategories = mergeCategoriesWithSubcategories(
        categories,
        subcategoriesMap
      );
      
      // Sort categories and their subcategories
      const sortedCategories = sortByOrderAndName(categoriesWithSubcategories);
      sortedCategories.forEach(category => {
        category.subcategories = sortByOrderAndName(category.subcategories);
      });
      
      return {
        success: true,
        categories: sortedCategories
      };
      
    } catch (error) {
      console.log('Categories service: returning empty categories due to error:', error);
      // Return empty categories list instead of error to handle empty collections gracefully
      return {
        success: true,
        categories: []
      };
    }
  }
  
  /**
   * Get subcategories for a specific category
   */
  static async getSubcategories(
    categoryId: string,
    options: SubcategoriesQueryOptions = {}
  ): Promise<SubcategoriesListResult> {
    try {
      const subcategories = await CategoriesRepository.getSubcategories({
        ...options,
        parentCategoryId: categoryId
      });
      
      return {
        success: true,
        subcategories: sortByOrderAndName(subcategories)
      };
      
    } catch (error) {
      console.log('Subcategories service: returning empty subcategories due to error:', error);
      // Return empty subcategories list instead of error to handle empty collections gracefully
      return {
        success: true,
        subcategories: []
      };
    }
  }
  
  /**
   * Create a new category
   */
  static async createCategory(
    categoryData: CreateCategoryData,
    createdBy: string = DEFAULTS.CREATED_BY
  ): Promise<CategoryResult> {
    try {
      // Validate name
      const nameValidation = validateName(categoryData.name);
      if (!nameValidation.isValid) {
        return createErrorResult(nameValidation.error!);
      }
      
      // Get next order number
      const order = await CategoriesRepository.getNextCategoryOrder();
      
      // Create category data
      const category = {
        name: categoryData.name.trim(),
        order,
        isActive: DEFAULTS.IS_ACTIVE,
        createdBy
      };
      
      // Save to Firestore and get auto-generated ID
      const categoryId = await CategoriesRepository.createCategory(category);
      
      // Return created category
      const createdCategory: Category = {
        id: categoryId,
        ...category,
        subcategories: [],
        createdAt: new Date() as unknown as Timestamp, // Will be set by Firestore
        updatedAt: new Date() as unknown as Timestamp  // Will be set by Firestore
      };
      
      return createSuccessResult(createdCategory, SUCCESS_MESSAGES.CATEGORY_CREATED);
      
    } catch (error) {
      console.error('Error creating category:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.CREATION_FAILED
      );
    }
  }
  
  /**
   * Create a new subcategory
   */
  static async createSubcategory(
    parentCategoryId: string,
    subcategoryData: CreateSubcategoryData,
    createdBy: string = DEFAULTS.CREATED_BY
  ): Promise<SubcategoryResult> {
    try {
      // Validate name
      const nameValidation = validateName(subcategoryData.name);
      if (!nameValidation.isValid) {
        return createErrorResult(nameValidation.error!);
      }
      
      // Verify parent category exists
      const parentExists = await CategoriesRepository.categoryExists(parentCategoryId);
      if (!parentExists) {
        return createErrorResult(ERROR_MESSAGES.PARENT_CATEGORY_NOT_FOUND);
      }
      
      // Get next order number
      const order = await CategoriesRepository.getNextSubcategoryOrder(parentCategoryId);
      
      // Create subcategory data
      const subcategory = {
        name: subcategoryData.name.trim(),
        parentCategoryId,
        order,
        isActive: DEFAULTS.IS_ACTIVE,
        createdBy
      };
      
      // Save to Firestore and get auto-generated ID
      const subcategoryId = await CategoriesRepository.createSubcategory(subcategory);
      
      // Return created subcategory
      const createdSubcategory = {
        id: subcategoryId,
        ...subcategory,
        createdAt: new Date() as unknown as Timestamp, // Will be set by Firestore
        updatedAt: new Date() as unknown as Timestamp  // Will be set by Firestore
      };
      
      return createSuccessResult(createdSubcategory, SUCCESS_MESSAGES.SUBCATEGORY_CREATED);
      
    } catch (error) {
      console.error('Error creating subcategory:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.CREATION_FAILED
      );
    }
  }
  
  /**
   * Update a category
   */
  static async updateCategory(
    categoryId: string,
    updates: UpdateCategoryData
  ): Promise<CategoriesServiceResult> {
    try {
      // Validate name if provided
      if (updates.name) {
        const nameValidation = validateName(updates.name);
        if (!nameValidation.isValid) {
          return createErrorResult(nameValidation.error!);
        }
        updates.name = updates.name.trim();
      }
      
      // Check if category exists
      const exists = await CategoriesRepository.categoryExists(categoryId);
      if (!exists) {
        return createErrorResult(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
      
      // Update category
      await CategoriesRepository.updateCategory(categoryId, updates);
      
      return createSuccessResult(undefined, SUCCESS_MESSAGES.CATEGORY_UPDATED);
      
    } catch (error) {
      console.error('Error updating category:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.UPDATE_FAILED
      );
    }
  }
  
  /**
   * Update a subcategory
   */
  static async updateSubcategory(
    subcategoryId: string,
    updates: UpdateSubcategoryData
  ): Promise<CategoriesServiceResult> {
    try {
      // Validate name if provided
      if (updates.name) {
        const nameValidation = validateName(updates.name);
        if (!nameValidation.isValid) {
          return createErrorResult(nameValidation.error!);
        }
        updates.name = updates.name.trim();
      }
      
      // Check if subcategory exists
      const exists = await CategoriesRepository.subcategoryExists(subcategoryId);
      if (!exists) {
        return createErrorResult(ERROR_MESSAGES.SUBCATEGORY_NOT_FOUND);
      }
      
      // Update subcategory
      await CategoriesRepository.updateSubcategory(subcategoryId, updates);
      
      return createSuccessResult(undefined, SUCCESS_MESSAGES.SUBCATEGORY_UPDATED);
      
    } catch (error) {
      console.error('Error updating subcategory:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.UPDATE_FAILED
      );
    }
  }
  
  /**
   * Deactivate category (soft delete)
   */
  static async deactivateCategory(categoryId: string): Promise<CategoriesServiceResult> {
    try {
      // Check if category exists
      const exists = await CategoriesRepository.categoryExists(categoryId);
      if (!exists) {
        return createErrorResult(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
      
      // Deactivate category and all its subcategories
      await CategoriesRepository.deactivateCategory(categoryId);
      
      return createSuccessResult(undefined, SUCCESS_MESSAGES.CATEGORY_DELETED);
      
    } catch (error) {
      console.error('Error deactivating category:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.DELETION_FAILED
      );
    }
  }
  
  /**
   * Deactivate subcategory (soft delete)
   */
  static async deactivateSubcategory(subcategoryId: string): Promise<CategoriesServiceResult> {
    try {
      // Check if subcategory exists
      const exists = await CategoriesRepository.subcategoryExists(subcategoryId);
      if (!exists) {
        return createErrorResult(ERROR_MESSAGES.SUBCATEGORY_NOT_FOUND);
      }
      
      // Deactivate subcategory
      await CategoriesRepository.deactivateSubcategory(subcategoryId);
      
      return createSuccessResult(undefined, SUCCESS_MESSAGES.SUBCATEGORY_DELETED);
      
    } catch (error) {
      console.error('Error deactivating subcategory:', error);
      return createErrorResult(
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        ERROR_MESSAGES.DELETION_FAILED
      );
    }
  }
}
