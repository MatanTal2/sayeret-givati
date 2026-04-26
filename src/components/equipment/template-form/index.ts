/**
 * Template Form Components - Clean exports
 */

// Individual form components
export { default as FormHeader } from './FormHeader';
export { default as FormFieldBasicInfo } from './FormFieldBasicInfo';
export { default as FormFieldProductName } from './FormFieldProductName';
export { default as FormFieldCategory } from './FormFieldCategory';
export { default as FormFieldSubcategory } from './FormFieldSubcategory';
export { default as FormFieldLocation } from './FormFieldLocation';
export { default as FormFieldNotes } from './FormFieldNotes';
export { default as FormFieldRequiresDailyCheck } from './FormFieldRequiresDailyCheck';
export { default as FormFieldDefaultValues } from './FormFieldDefaultValues';
export { default as FormActions } from './FormActions';

// Types and interfaces
export type {
  TemplateFormData,
  Category,
  Subcategory,
  FormErrors,
} from './types';

export { initialFormData } from './types';
