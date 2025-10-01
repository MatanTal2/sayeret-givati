/**
 * Categories Module - Main export file
 */

// Main service
export { CategoriesService } from './categoriesService';

// Repository (for advanced use cases)
export { CategoriesRepository } from './repository';

// Types and interfaces
export type {
  Category,
  Subcategory,
  CreateCategoryData,
  CreateSubcategoryData,
  UpdateCategoryData,
  UpdateSubcategoryData,
  CategoriesServiceResult,
  CategoriesListResult,
  SubcategoriesListResult,
  CategoryResult,
  SubcategoryResult,
  CategoriesQueryOptions,
  SubcategoriesQueryOptions
} from './types';

// Constants
export { COLLECTIONS, DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';

// Utilities (for advanced use cases)
export {
  validateName,
  sortByOrderAndName,
  isHebrewText
} from './utils';
