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
  description?: string;
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
  description?: string;
  parentCategoryId: string;
  order: number;
  templates: string[]; // Array of template IDs
  isActive: boolean;
}

// Enhanced Equipment Template
export interface ProfessionalTemplate {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  
  // Default Values
  defaultValues: TemplateDefaults;
  
  // Field Configuration
  customizableFields: CustomizableField[];
  requiredFields: string[];
  
  // Metadata
  icon: string;
  idPrefix: string;
  usage: {
    timesUsed: number;
    lastUsed?: string;
  };
  
  // Management
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

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

// Default Categories for Military Equipment
export const DEFAULT_TEMPLATE_CATEGORIES: Omit<TemplateCategory, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'נשקייה',
    icon: '🔫',
    description: 'רובים, ומקלעים אישיים',
    order: 1,
    isActive: true,
    subcategories: [
      {
        id: 'assault_rifles',
        name: 'רובי סער',
        description: 'תבור, M4A1, וכדומה',
        parentCategoryId: '',
        order: 1,
        templates: [],
        isActive: true,
      },
      {
        id: 'machine_guns',
        name: 'מקלעים',
        description: 'נגב, מא"ג, וכדומה',
        parentCategoryId: '',
        order: 3,
        templates: [],
        isActive: true,
      }
    ]
  },
  {
    name: 'אופטיקה',
    icon: '🔭',
    description: 'משקפי ראיית לילה, כוונות וציוד תצפית',
    order: 2,
    isActive: true,
    subcategories: [
      {
        id: 'night_vision',
        name: 'משקפי ראיית לילה',
        description: 'AN/PVS-14, AN/PVS-31',
        parentCategoryId: '',
        order: 1,
        templates: [],
        isActive: true,
      },
      {
        id: 'scopes',
        name: 'כוונות',
        description: 'ACOG, EOTech, אלביט',
        parentCategoryId: '',
        order: 2,
        templates: [],
        isActive: true,
      }
    ]
  },
  {
    name: 'קשר',
    icon: '📡',
    description: 'קשרים, מכשירי תקשורת וציוד אלקטרוני',
    order: 3,
    isActive: true,
    subcategories: [
      {
        id: 'personal_radios',
        name: 'קשרים אישיים',
        description: '709, 710',
        parentCategoryId: '',
        order: 1,
        templates: [],
        isActive: true,
      },
      {
        id: 'vehicle_radios',
        name: 'קשרי רכב',
        description: 'מגן מכלול, נר לילה וכדומה',
        parentCategoryId: '',
        order: 2,
        templates: [],
        isActive: true,
      }
    ]
  },
  {
    name: 'הגנה אישית',
    icon: '🛡️',
    description: 'אפודי מגן, קסדות וציוד הגנה',
    order: 4,
    isActive: true,
    subcategories: [
      {
        id: 'body_armor',
        name: 'אפודי מגן',
        description: 'אפודים קרמיים ובליסטיים',
        parentCategoryId: '',
        order: 1,
        templates: [],
        isActive: true,
      },
      {
        id: 'helmets',
        name: 'קסדות',
        description: 'קסדות בליסטיות וקרביות',
        parentCategoryId: '',
        order: 2,
        templates: [],
        isActive: true,
      }
    ]
  }
];
