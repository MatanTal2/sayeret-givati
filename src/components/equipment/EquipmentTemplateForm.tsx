'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { EquipmentType } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { EquipmentTypesService } from '@/lib/equipmentService';
import { CategoriesService } from '@/lib/categoriesService';

// Import decomposed components
import FormHeader from './template-form/FormHeader';
import FormFieldCategory from './template-form/FormFieldCategory';
import FormFieldSubcategory from './template-form/FormFieldSubcategory';
import FormFieldRequiresDailyCheck from './template-form/FormFieldRequiresDailyCheck';
import FormActions from './template-form/FormActions';
import { 
  EquipmentTemplateFormProps, 
  TemplateFormData, 
  Category, 
  FormErrors,
  initialFormData 
} from './template-form/types';

export default function EquipmentTemplateForm({
  isOpen,
  onClose,
  onSuccess
}: EquipmentTemplateFormProps) {
  const { enhancedUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string>('');

  // Check permissions
  const hasPermission = enhancedUser?.userType && [
    UserType.ADMIN,
    UserType.SYSTEM_MANAGER,
    UserType.MANAGER
  ].includes(enhancedUser.userType);

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const result = await CategoriesService.getCategories();
      if (result.success) {
        setCategories(result.categories || []);
        // Clear any previous errors since we got a successful response (even if empty)
        setCategoriesError('');
      } else {
        // Only set error for actual service failures, not empty collections
        if (result.error && !result.error.includes('permissions')) {
          setCategoriesError(result.error);
        } else {
          // Treat permissions errors as empty collections for now
          setCategories([]);
          setCategoriesError('');
        }
      }
    } catch (error) {
      console.log('Error loading categories, treating as empty:', error);
      // Treat any errors as empty collections to handle gracefully
      setCategories([]);
      setCategoriesError('');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleRefreshCategories = () => {
    loadCategories();
  };

  // Get subcategories for selected category
  const availableSubcategories = useMemo(() => {
    const selectedCategory = categories.find(cat => cat.id === formData.category);
    return selectedCategory?.subcategories || [];
  }, [categories, formData.category]);

  // Handle form field changes
  const handleFieldChange = (field: keyof TemplateFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset subcategory when category changes
      ...(field === 'category' && { subcategory: '' })
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME_REQUIRED;
    }

    if (!formData.category) {
      newErrors.category = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORY_REQUIRED;
    }

    if (!formData.subcategory) {
      newErrors.subcategory = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SUBCATEGORY_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !enhancedUser) {
      return;
    }

    setIsSubmitting(true);
    try {
      const templateData: Omit<EquipmentType, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        subcategory: formData.subcategory,
        notes: formData.notes || undefined,
        requiresDailyStatusCheck: formData.requiresDailyStatusCheck,
        isActive: true,
        templateCreatorId: enhancedUser.uid
      };

      const result = await EquipmentTypesService.createEquipmentType(templateData);
      
      if (result.success && result.data) {
        // Success - call onSuccess callback and close modal
        onSuccess?.(result.data as EquipmentType);
        onClose();
      } else {
        setErrors({ submit: result.message || TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setErrors({ submit: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {TEXT_CONSTANTS.MANAGEMENT.ACCESS_DENIED.TITLE}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {TEXT_CONSTANTS.MANAGEMENT.ACCESS_DENIED.MESSAGE}
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {TEXT_CONSTANTS.CONFIRMATIONS.CLOSE}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-auto">
          {/* Header */}
          <FormHeader onClose={onClose} isSubmitting={isSubmitting} />

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.BASIC_INFO || 'Basic Information'}
              </h4>
              
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME || 'Name'} *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.NAME_PLACEHOLDER || 'Enter equipment name'}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION || 'Description'}
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.DESCRIPTION_PLACEHOLDER || 'Optional description'}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORIES}
                </h4>
                <button
                  type="button"
                  onClick={handleRefreshCategories}
                  disabled={categoriesLoading}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.REFRESH}
                </button>
              </div>

              {categoriesError && (
                <p className="text-sm text-red-600">{categoriesError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldCategory
                  value={formData.category}
                  onChange={(value) => handleFieldChange('category', value)}
                  categories={categories}
                  onCategoriesRefresh={handleRefreshCategories}
                  error={errors.category}
                  disabled={isSubmitting || categoriesLoading}
                />

                <FormFieldSubcategory
                  value={formData.subcategory}
                  onChange={(value) => handleFieldChange('subcategory', value)}
                  subcategories={availableSubcategories}
                  selectedCategoryId={formData.category}
                  onCategoriesRefresh={handleRefreshCategories}
                  error={errors.subcategory}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Notes and Daily Check */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">
                מידע נוסף
              </h4>

              {/* Requires Daily Status Check - moved to where id field was */}
              <FormFieldRequiresDailyCheck
                value={formData.requiresDailyStatusCheck}
                onChange={(value) => handleFieldChange('requiresDailyStatusCheck', value)}
                disabled={isSubmitting}
              />

              {/* Notes Field */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES || 'הערות'}
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.COMMON_NOTES_PLACEHOLDER || 'הערות אופציונליות או הנחיות'}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <FormActions
              onCancel={onClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={!isSubmitting}
            />
          </form>
        </div>
      </div>
    </div>
  );
}