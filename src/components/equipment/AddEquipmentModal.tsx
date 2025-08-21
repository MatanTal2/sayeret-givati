'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentCondition } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { 
  validateEquipmentId, 
  validateUserName,
  validateUnitName,
  validateLocation 
} from '@/lib/equipmentValidation';
import { 
  getTemplatesByCategory, 
  createEquipmentFromTemplate,
  type EquipmentTemplate 
} from '@/data/equipmentTemplates';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (equipment: Omit<Equipment, 'createdAt' | 'updatedAt' | 'history'>) => Promise<void>;
  loading?: boolean;
}

interface FormData {
  serialNumber: string;
  productName: string;
  category: string;
  currentHolder: string;
  assignedUnit: string;
  location: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  notes: string;
}

const initialFormData: FormData = {
  serialNumber: '',
  productName: '',
  category: '',
  currentHolder: '',
  assignedUnit: '',
  location: '',
  status: EquipmentStatus.AVAILABLE,
  condition: EquipmentCondition.GOOD,
  notes: ''
};

export default function AddEquipmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false 
}: AddEquipmentModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EquipmentTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  
  // Get templates organized by category
  const templatesByCategory = getTemplatesByCategory();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setSelectedTemplate(null);
      setShowTemplates(true);
    }
  }, [isOpen]);

  // Handle template selection
  const handleTemplateSelect = (template: EquipmentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    
    // Pre-fill form with template data
    const templateData = createEquipmentFromTemplate(template);
    setFormData({
      serialNumber: templateData.id,
      productName: templateData.productName,
      category: templateData.category,
      currentHolder: templateData.currentHolder,
      assignedUnit: templateData.assignedUnit,
      location: templateData.location,
      status: templateData.status,
      condition: templateData.condition,
      notes: templateData.notes || ''
    });
  };

  // Handle manual entry (skip templates)
  const handleSkipTemplates = () => {
    setSelectedTemplate(null);
    setShowTemplates(false);
  };

  // Back to template selection
  const handleBackToTemplates = () => {
    setShowTemplates(true);
    setSelectedTemplate(null);
    setFormData(initialFormData);
    setErrors({});
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Serial number validation
    const serialValidation = validateEquipmentId(formData.serialNumber);
    if (!serialValidation.isValid) {
      newErrors.serialNumber = serialValidation.error || 'מספר סידורי לא תקין';
    }

    // Product name validation
    if (!formData.productName.trim()) {
      newErrors.productName = 'שם המוצר נדרש';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'קטגוריה נדרשת';
    }

    // Current holder validation
    const holderValidation = validateUserName(formData.currentHolder);
    if (!holderValidation.isValid) {
      newErrors.currentHolder = holderValidation.error || 'מחזיק נוכחי לא תקין';
    }

    // Unit validation
    const unitValidation = validateUnitName(formData.assignedUnit);
    if (!unitValidation.isValid) {
      newErrors.assignedUnit = unitValidation.error || 'יחידה לא תקינה';
    }

    // Location validation
    const locationValidation = validateLocation(formData.location);
    if (!locationValidation.isValid) {
      newErrors.location = locationValidation.error || 'מיקום לא תקין';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare equipment data with id from serial number
      const { serialNumber, ...restFormData } = formData;
      const equipmentData = {
        ...restFormData,
        id: serialNumber, // Use serial number as ID
        dateSigned: new Date().toISOString(),
        lastReportUpdate: new Date().toISOString(),
        signedBy: 'מערכת', // System created
        trackingHistory: [] // Initialize empty tracking history
      };

      await onSubmit(equipmentData);
      onClose();
    } catch (error) {
      console.error('Error creating equipment:', error);
      setErrors({ submit: 'שגיאה ביצירת הציוד. נסה שוב.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {showTemplates ? 'בחר תבנית ציוד' : TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {showTemplates 
                ? 'בחר תבנית מוכנה או צור ציוד באופן ידני'
                : selectedTemplate
                  ? `יצירת ${selectedTemplate.name}`
                  : 'הוסף פריט ציוד חדש למערכת'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showTemplates && (
              <button
                onClick={handleBackToTemplates}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-purple-600"
                disabled={isSubmitting}
              >
                ← חזור לתבניות
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        {showTemplates ? (
          /* Template Selection */
          <div className="p-6">
            {/* Categories */}
            <div className="space-y-6">
              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-right group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-purple-700">
                              {template.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {template.idPrefix}-XXX
                              </span>
                              <span className="text-xs text-gray-500">
                                📍 {template.defaultLocation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Manual Entry Option */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSkipTemplates}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="text-center">
                  <span className="text-2xl mb-2 block">✏️</span>
                  <h4 className="font-medium text-gray-900">יצירה ידנית</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    צור ציוד חדש ללא תבנית מוכנה
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Equipment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Template Indicator */}
            {selectedTemplate && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <h4 className="font-medium text-purple-900">
                      תבנית: {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-purple-700">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מספר סידורי *
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.serialNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: EQ-2024-001"
              disabled={isSubmitting}
            />
            {errors.serialNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>
            )}
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם המוצר *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.productName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="לדוגמה: רובה M4A1"
                disabled={isSubmitting}
              />
              {errors.productName && (
                <p className="text-red-500 text-sm mt-1">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קטגוריה *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">בחר קטגוריה</option>
                <option value="נשק">נשק</option>
                <option value="אופטיקה">אופטיקה</option>
                <option value="תקשורת">תקשורת</option>
                <option value="הגנה">הגנה</option>
                <option value="ציוד">ציוד</option>
                <option value="אחר">אחר</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מחזיק נוכחי *
              </label>
              <input
                type="text"
                value={formData.currentHolder}
                onChange={(e) => handleInputChange('currentHolder', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.currentHolder ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="לדוגמה: רב״ט דוד כהן"
                disabled={isSubmitting}
              />
              {errors.currentHolder && (
                <p className="text-red-500 text-sm mt-1">{errors.currentHolder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                יחידה *
              </label>
              <input
                type="text"
                value={formData.assignedUnit}
                onChange={(e) => handleInputChange('assignedUnit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.assignedUnit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="לדוגמה: פלוגה א'"
                disabled={isSubmitting}
              />
              {errors.assignedUnit && (
                <p className="text-red-500 text-sm mt-1">{errors.assignedUnit}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיקום *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: מחסן נשק - בסיס"
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Status and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value={EquipmentStatus.AVAILABLE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_AVAILABLE}</option>
                <option value={EquipmentStatus.IN_USE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_IN_USE}</option>
                <option value={EquipmentStatus.MAINTENANCE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_MAINTENANCE}</option>
                <option value={EquipmentStatus.REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_REPAIR}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מצב
              </label>
              <select
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value={EquipmentCondition.NEW}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEW}</option>
                <option value={EquipmentCondition.EXCELLENT}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_EXCELLENT}</option>
                <option value={EquipmentCondition.GOOD}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_GOOD}</option>
                <option value={EquipmentCondition.FAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_FAIR}</option>
                <option value={EquipmentCondition.POOR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_POOR}</option>
                <option value={EquipmentCondition.NEEDS_REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEEDS_REPAIR}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              rows={3}
              placeholder="הערות נוספות על הציוד..."
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'יוצר...' : 'צור ציוד'}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>
  );
}
