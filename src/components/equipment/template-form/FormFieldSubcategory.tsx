/**
 * Subcategory Field Component with Add New functionality
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { FormField, Button } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Subcategory } from './types';
import { CategoriesService } from '@/lib/categoriesService';
import { useAuth } from '@/contexts/AuthContext';

interface FormFieldSubcategoryProps {
  value: string;
  onChange: (value: string) => void;
  subcategories: Subcategory[];
  selectedCategoryId: string;
  onCategoriesRefresh: () => void;
  error?: string;
  disabled?: boolean;
}

export default function FormFieldSubcategory({
  value,
  onChange,
  subcategories,
  selectedCategoryId,
  onCategoriesRefresh,
  error,
  disabled = false
}: FormFieldSubcategoryProps) {
  const { enhancedUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryId || !enhancedUser) return;
    
    setIsAdding(true);
    try {
      const result = await CategoriesService.createSubcategory(selectedCategoryId, {
        name: newSubcategoryName.trim()
      }, enhancedUser.uid);
      
      if (result.success) {
        await onCategoriesRefresh();
        setNewSubcategoryName('');
        setShowAddModal(false);
      } else {
        console.error('Failed to create subcategory:', result.error);
      }
    } catch (error) {
      console.error('Error creating subcategory:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const isSubcategoryDisabled = disabled || !selectedCategoryId || subcategories.length === 0;

  return (
    <>
      <FormField
        label={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SUBCATEGORY}
        required
        error={error}
      >
        <div className="space-y-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isSubcategoryDisabled}
          >
            <option value="">
              {!selectedCategoryId 
                ? 'בחר קטגוריה תחילה'
                : subcategories.length === 0 
                  ? 'אין תת-קטגוריות עדיין - צור ראשונה'
                  : TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SELECT_SUBCATEGORY
              }
            </option>
            {subcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ADD_NEW_SUBCATEGORY}
            </button>
          )}
        </div>
      </FormField>

      {/* Add Subcategory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ADD_NEW_SUBCATEGORY}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.ENTER_SUBCATEGORY_NAME}
              </p>
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.SUBCATEGORY_NAME_PLACEHOLDER}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
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
                    setNewSubcategoryName('');
                  }}
                  disabled={isAdding}
                >
                  {TEXT_CONSTANTS.CONFIRMATIONS.CANCEL}
                </Button>
                <Button
                  type="button"
                  onClick={handleAddSubcategory}
                  disabled={isAdding || !newSubcategoryName.trim()}
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
