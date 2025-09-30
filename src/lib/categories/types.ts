/**
 * Categories Service Types and Interfaces
 */

import { Timestamp } from 'firebase/firestore';

// Core entities
export interface Category {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  parentCategoryId: string;
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input DTOs
export interface CreateCategoryData {
  name: string;
}

export interface CreateSubcategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateSubcategoryData {
  name?: string;
  order?: number;
  isActive?: boolean;
}

// Service result types
export interface CategoriesServiceResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface CategoriesListResult extends CategoriesServiceResult<Category[]> {
  categories: Category[];
}

export interface SubcategoriesListResult extends CategoriesServiceResult<Subcategory[]> {
  subcategories: Subcategory[];
}

export interface CategoryResult extends CategoriesServiceResult<Category> {
  data?: Category;
}

export interface SubcategoryResult extends CategoriesServiceResult<Subcategory> {
  data?: Subcategory;
}

// Query options
export interface CategoriesQueryOptions {
  activeOnly?: boolean;
  includeSubcategories?: boolean;
  orderBy?: 'name' | 'order' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface SubcategoriesQueryOptions {
  parentCategoryId?: string;
  activeOnly?: boolean;
  orderBy?: 'name' | 'order' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}
