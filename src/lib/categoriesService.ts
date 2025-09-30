/**
 * Categories Service - Legacy compatibility wrapper
 * @deprecated Use the new modular categories service from './categories'
 */

// Re-export the new modular service for backward compatibility
export { 
  CategoriesService,
  type Category,
  type Subcategory,
  type CreateCategoryData,
  type CreateSubcategoryData,
  type CategoriesServiceResult
} from './categories';