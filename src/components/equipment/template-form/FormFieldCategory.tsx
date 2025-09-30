/**
 * Category Field Component with Add New functionality
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { FormField, Button } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Category } from './types';
import { CategoriesService } from '@/lib/categoriesService';
import { useAuth } from '@/contexts/AuthContext';

interface FormFieldCategoryProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  onCategoriesRefresh: () => void;
  error?: string;
  disabled?: boolean;
}

export default function FormFieldCategory({
  value,
  onChange,
  categories,
  onCategoriesRefresh,
  error,
  disabled = false
}: FormFieldCategoryProps) {
  const { enhancedUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !enhancedUser) return;
    
    setIsAdding(true);
    try {
      const result = await CategoriesService.createCategory({
        name: newCategoryName.trim()
      }, enhancedUser.uid);
      
      if (result.success) {
        await onCategoriesRefresh();
        setNewCategoryName('');
        setShowAddModal(false);
      } else {
        console.error('Failed to create category:', result.error);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORY}
        required
        error={error}
      >
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">
              {categories.length === 0 
                ? 'אין קטגוריות עדיין - צור ראשונה' 
                : TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SELECT_CATEGORY
              }
            </option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ADD_NEW_CATEGORY}
          </button>
        </div>
      </FormField>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ADD_NEW_CATEGORY}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ENTER_CATEGORY_NAME}
              </p>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CATEGORY_NAME_PLACEHOLDER}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  disabled={isAdding}
                >
                  {TEXT_CONSTANTS.CONFIRMATIONS.CANCEL}
                </Button>
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isAdding || !newCategoryName.trim()}
                  isLoading={isAdding}
                >
                  {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ADD}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
