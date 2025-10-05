'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentStatus, EquipmentCondition } from '@/types/equipment';

type ModalMode = 'create' | 'update';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (equipment: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>) => Promise<void>;
  onUpdate?: (equipmentId: string, updates: Partial<Equipment>) => Promise<void>;
  loading?: boolean;
  mode?: ModalMode;
  existingEquipment?: Equipment; // For update mode
}

interface FormData {
  serialNumber: string;
  equipmentType: string;
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
  equipmentType: '',
  productName: '',
  category: '',
  currentHolder: '',
  assignedUnit: '',
  location: '',
  status: EquipmentStatus.AVAILABLE,
  condition: EquipmentCondition.GOOD,
  notes: ''
};


export default function EquipmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onUpdate,
  mode = 'create',
  existingEquipment
}: EquipmentModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get user authentication context
  const { enhancedUser } = useAuth();

  // Initialize form data for update mode
  useEffect(() => {
    if (mode === 'update' && existingEquipment) {
      setFormData({
        serialNumber: existingEquipment.id,
        equipmentType: existingEquipment.equipmentType || '',
        productName: existingEquipment.productName,
        category: existingEquipment.category,
        currentHolder: existingEquipment.currentHolder,
        assignedUnit: existingEquipment.assignedUnit,
        location: existingEquipment.location,
        status: existingEquipment.status,
        condition: existingEquipment.condition,
        notes: existingEquipment.notes || ''
      });
    } else if (mode === 'create') {
      setFormData(initialFormData);
    }
  }, [mode, existingEquipment, isOpen]);

  // Check if field is editable in update mode
  const isFieldEditable = (fieldName: string): boolean => {
    if (mode === 'create') return true;
    
    // In update mode, only these fields are editable
    const editableFields = ['status', 'condition', 'location', 'notes'];
    return editableFields.includes(fieldName);
  };


  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string | EquipmentStatus | EquipmentCondition) => {
    if (!isFieldEditable(field)) return; // Prevent changes to read-only fields
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validation function (simplified for update mode)
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create') {
      // Full validation for create mode
      if (!formData.serialNumber.trim()) {
        newErrors.serialNumber = TEXT_CONSTANTS.FEATURES.EQUIPMENT.VALIDATION.SERIAL_REQUIRED;
      }
      if (!formData.productName.trim()) {
        newErrors.productName = TEXT_CONSTANTS.FEATURES.EQUIPMENT.VALIDATION.PRODUCT_NAME_REQUIRED;
      }
      if (!formData.currentHolder.trim()) {
        newErrors.currentHolder = TEXT_CONSTANTS.FEATURES.EQUIPMENT.VALIDATION.CURRENT_HOLDER_REQUIRED;
      }
    } else {
      // Minimal validation for update mode - only validate editable fields
      if (!formData.location.trim()) {
        newErrors.location = TEXT_CONSTANTS.FEATURES.EQUIPMENT.VALIDATION.LOCATION_REQUIRED;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'update' && existingEquipment && onUpdate) {
        // Update mode - only send editable fields
        const updates: Partial<Equipment> = {
          status: formData.status,
          condition: formData.condition,
          location: formData.location,
          notes: formData.notes
        };
        
        await onUpdate(existingEquipment.id, updates);
      } else if (onSubmit) {
        // Create mode - send full equipment data
        const { serialNumber, ...restFormData } = formData;
        const now = serverTimestamp() as Timestamp;
        
        const equipmentData = {
          ...restFormData,
          id: serialNumber,
          equipmentType: formData.equipmentType || 'manual_entry',
          currentHolderId: enhancedUser?.uid || '',
          acquisitionDate: now,
          dateSigned: now,
          lastSeen: now,
          lastReportUpdate: now,
          signedBy: enhancedUser ? `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim() : TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.SYSTEM_USER,
        };

        await onSubmit(equipmentData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting equipment:', error);
      setErrors({ submit: mode === 'update' ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.ERROR_MESSAGE : TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.CREATE_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isUpdateMode = mode === 'update';
  const modalTitle = isUpdateMode ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.TITLE : TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW;
  const modalSubtitle = isUpdateMode ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.SUBTITLE : TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.CREATE_SUBTITLE;
  const submitButtonText = isUpdateMode ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.SUBMIT_BUTTON : TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.CREATE_SUBMIT;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {modalTitle}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              {modalSubtitle}
            </p>
            {isUpdateMode && (
              <p className="text-xs text-warning-600 mt-1">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.EDITABLE_FIELDS_NOTE}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.SERIAL_NUMBER}
              {!isFieldEditable('serialNumber') && (
                <span className="text-xs text-neutral-500 mr-2">({TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.READONLY_FIELD})</span>
              )}
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.serialNumber ? 'border-danger-500' : 'border-neutral-300'
              } ${!isFieldEditable('serialNumber') ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : ''}`}
              placeholder={TEXT_CONSTANTS.EQUIPMENT_PAGE.EXAMPLE_RIFLE}
              disabled={isSubmitting || !isFieldEditable('serialNumber')}
              readOnly={!isFieldEditable('serialNumber')}
            />
            {errors.serialNumber && (
              <p className="text-danger-500 text-sm mt-1">{errors.serialNumber}</p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.PRODUCT_NAME}
              {!isFieldEditable('productName') && (
                <span className="text-xs text-neutral-500 mr-2">({TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.READONLY_FIELD})</span>
              )}
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => handleFieldChange('productName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.productName ? 'border-danger-500' : 'border-neutral-300'
              } ${!isFieldEditable('productName') ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : ''}`}
              disabled={isSubmitting || !isFieldEditable('productName')}
              readOnly={!isFieldEditable('productName')}
            />
            {errors.productName && (
              <p className="text-danger-500 text-sm mt-1">{errors.productName}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.FORM_LABELS.STATUS}
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={isSubmitting}
            >
              <option value={EquipmentStatus.AVAILABLE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.AVAILABLE}</option>
              <option value={EquipmentStatus.SECURITY}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.SECURITY}</option>
              <option value={EquipmentStatus.REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.REPAIR}</option>
              <option value={EquipmentStatus.LOST}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.LOST}</option>
              <option value={EquipmentStatus.PENDING_TRANSFER}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.PENDING_TRANSFER}</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.FORM_LABELS.CONDITION}
            </label>
            <select
              value={formData.condition}
              onChange={(e) => handleFieldChange('condition', e.target.value as EquipmentCondition)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={isSubmitting}
            >
              <option value={EquipmentCondition.GOOD}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.GOOD}</option>
              <option value={EquipmentCondition.NEEDS_REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.NEEDS_REPAIR}</option>
              <option value={EquipmentCondition.WORN}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_OPTIONS.WORN}</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOCATION}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.location ? 'border-danger-500' : 'border-neutral-300'
              }`}
              placeholder={TEXT_CONSTANTS.EQUIPMENT_PAGE.EXAMPLE_LOCATION}
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-danger-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.NOTES}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              rows={3}
              placeholder={TEXT_CONSTANTS.EQUIPMENT_PAGE.ADDITIONAL_NOTES}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800">
                ❌ {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.CANCEL}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.UPDATE.UPDATING : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
