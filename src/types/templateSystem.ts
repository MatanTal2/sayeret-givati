/**
 * Professional Template System Types
 * Hierarchical template management for military equipment
 */

import { EquipmentStatus, EquipmentCondition } from './equipment';

// Template Permissions based on UserType
export interface TemplatePermissions {
  canCreateTemplate: boolean;
  canEditTemplate: boolean;
  canDeleteTemplate: boolean;
  canUseTemplate: boolean;
  canViewTemplates: boolean;
  canManageCategories: boolean;
}

// Template Category (Top Level)
export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
  subcategories: TemplateSubcategory[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Template Subcategory (Second Level)
export interface TemplateSubcategory {
  id: string;
  name: string;
  parentCategoryId: string;
  order: number;
  templates: string[]; // Array of template IDs
  isActive: boolean;
}

// Enhanced Equipment Template
// export interface ProfessionalTemplate {
//   id: string;
//   name: string;
//   description: string;
//   categoryId: string;
//   subcategoryId: string;
  
//   // Default Values
//   defaultValues: TemplateDefaults;
  
//   // Field Configuration
//   customizableFields: CustomizableField[];
//   requiredFields: string[];
  
//   // Metadata
//   icon: string;
//   idPrefix: string;
//   usage: {
//     timesUsed: number;
//     lastUsed?: string;
//   };
  
//   // Daily Status Check
//   requiresDailyStatusCheck: boolean; // New field for daily status reporting
  
//   // Management
//   isActive: boolean;
//   createdBy: string;
//   createdAt: string;
//   updatedAt: string;
//   version: number;
// }

// Template Default Values
export interface TemplateDefaults {
  productName: string;
  category: string;
  subcategory: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  location: string;
  commonNotes?: string;
  
  // Auto-filled fields (not editable in template)
  // These will be filled when equipment is created:
  // - currentHolder (from current user)
  // - assignedUnit (from current user)
  // - assignedTeam (from current user)
  // - dateSigned (current date)
  // - signedBy (current user)
  // - id (user must enter)
  // - notes (always empty for user input)
}

// Customizable Field Configuration
export interface CustomizableField {
  fieldName: string;
  isRequired: boolean;
  isVisible: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// Template Creation Form Data
export interface CreateTemplateForm {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  
  // Default values
  productName: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  location: string;
  commonNotes: string;
  
  // Configuration
  icon: string;
  idPrefix: string;
  customizableFields: string[]; // Array of field names
  requiredFields: string[];
  requiresDailyStatusCheck: boolean; // New field for daily status reporting
}

// Template Usage Statistics
export interface TemplateUsageStats {
  templateId: string;
  templateName: string;
  category: string;
  subcategory: string;
  timesUsed: number;
  lastUsed?: string;
  equipmentCreated: number;
  averageUsagePerMonth: number;
}

// Template Management View Options
export interface TemplateManagementView {
  view: 'list' | 'grid' | 'category';
  sortBy: 'name' | 'category' | 'usage' | 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
  filterBy: {
    category?: string;
    subcategory?: string;
    isActive?: boolean;
    createdBy?: string;
  };
  searchTerm: string;
}

// Permission Helper Functions
export function getTemplatePermissions(userType: string): TemplatePermissions {
  const basePermissions: TemplatePermissions = {
    canCreateTemplate: false,
    canEditTemplate: false,
    canDeleteTemplate: false,
    canUseTemplate: true,
    canViewTemplates: true,
    canManageCategories: false,
  };

  switch (userType.toLowerCase()) {
    case 'admin':
      return {
        canCreateTemplate: true,
        canEditTemplate: true,
        canDeleteTemplate: true,
        canUseTemplate: true,
        canViewTemplates: true,
        canManageCategories: true,
      };

    case 'system_manager':
      return {
        canCreateTemplate: true,
        canEditTemplate: true,
        canDeleteTemplate: false, // Only admin can delete
        canUseTemplate: true,
        canViewTemplates: true,
        canManageCategories: true,
      };

    case 'manager':
      return {
        canCreateTemplate: true,
        canEditTemplate: true,
        canDeleteTemplate: false,
        canUseTemplate: true,
        canViewTemplates: true,
        canManageCategories: false,
      };

    case 'team_leader':
    case 'user':
    default:
      // Soldiers and team leaders cannot create templates
      return basePermissions;
  }
}

// Check if user can manage templates
export function canManageTemplates(userType: string): boolean {
  const permissions = getTemplatePermissions(userType);
  return permissions.canCreateTemplate || permissions.canEditTemplate;
}

// Note: DEFAULT_TEMPLATE_CATEGORIES has been removed.
// The application now uses Firestore data with fallback to EQUIPMENT_TEMPLATES from @/data/equipmentTemplates
// This provides better data consistency and real-time updates.
