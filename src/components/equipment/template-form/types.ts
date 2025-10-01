/**
 * Shared types for Equipment Template Form components
 */

import { EquipmentType } from '@/types/equipment';

export interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  notes: string;
  requiresDailyStatusCheck: boolean;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface FormErrors {
  [key: string]: string;
}

export const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  category: '',
  subcategory: '',
  notes: '',
  requiresDailyStatusCheck: false
};

// Re-export the main props interface
export interface EquipmentTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (template: EquipmentType) => void;
}
