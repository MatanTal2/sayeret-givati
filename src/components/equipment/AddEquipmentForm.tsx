'use client';

import React, { useState, useEffect } from 'react';
import { ItemType } from '@/types/equipment';
import { ItemTypesService } from '@/lib/itemTypesService';
import { EquipmentService, CreateEquipmentData } from '@/lib/equipmentService';
import TemplateSelector from './TemplateSelector';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface FormData {
  id: string;
  itemTypeId: string;
  assignedUserId: string;
  assignedUserName: string;
  equipmentDepot: string;
  status: string;
  imageUrl: string;
}

interface FormErrors {
  id?: string;
  itemTypeId?: string;
  assignedUserId?: string;
  equipmentDepot?: string;
  status?: string;
  general?: string;
}

interface AddEquipmentFormProps {
  onSuccess?: (equipmentId: string) => void;
  onCancel?: () => void;
}

const AddEquipmentForm: React.FC<AddEquipmentFormProps> = ({ onSuccess, onCancel }) => {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ItemType | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<FormData>({
    id: '',
    itemTypeId: '',
    assignedUserId: '',
    assignedUserName: '',
    equipmentDepot: '',
    status: '',
    imageUrl: ''
  });

  // Load itemTypes on component mount
  useEffect(() => {
    loadItemTypes();
  }, []);

  const loadItemTypes = async () => {
    try {
      setIsLoadingTemplates(true);
      const templates = await ItemTypesService.getAllItemTypes();
      setItemTypes(templates);
    } catch (error) {
      console.error('Error loading item types:', error);
      setErrors({ general: 'Failed to load equipment templates' });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: ItemType) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      itemTypeId: template.id,
      equipmentDepot: template.defaultDepot,
      status: template.defaultStatus
    }));
    setErrors({}); // Clear errors when template changes
  };

  // Handle form field changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Generate suggested equipment ID based on template
  const generateSuggestedId = (template: ItemType): string => {
    const categoryPrefix = template.category.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    return `EQ-${categoryPrefix}-${timestamp}`;
  };

  // Auto-fill ID suggestion when template is selected
  useEffect(() => {
    if (selectedTemplate && !formData.id) {
      const suggestedId = generateSuggestedId(selectedTemplate);
      setFormData(prev => ({ ...prev, id: suggestedId }));
    }
  }, [selectedTemplate, formData.id]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Equipment ID is required';
    } else if (!/^[A-Z0-9-_]+$/i.test(formData.id)) {
      newErrors.id = 'Equipment ID can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.itemTypeId) {
      newErrors.itemTypeId = 'Please select an equipment template';
    }

    if (!formData.assignedUserId.trim()) {
      newErrors.assignedUserId = 'Assigned User ID is required';
    }

    if (!formData.equipmentDepot.trim()) {
      newErrors.equipmentDepot = 'Equipment depot is required';
    }

    if (!formData.status.trim()) {
      newErrors.status = 'Status is required';
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
    setErrors({});
    setSuccessMessage('');

    try {
      const equipmentData: CreateEquipmentData = {
        id: formData.id,
        itemTypeId: formData.itemTypeId,
        assignedUserId: formData.assignedUserId,
        assignedUserName: formData.assignedUserName || undefined,
        equipmentDepot: formData.equipmentDepot,
        status: formData.status,
        imageUrl: formData.imageUrl || undefined
      };

      const result = await EquipmentService.createEquipment(equipmentData);

      if (result.success) {
        setSuccessMessage(`Equipment created successfully: ${result.equipmentId}`);
        
        // Reset form
        setFormData({
          id: '',
          itemTypeId: '',
          assignedUserId: '',
          assignedUserName: '',
          equipmentDepot: '',
          status: '',
          imageUrl: ''
        });
        setSelectedTemplate(null);

        // Call success callback
        if (onSuccess && result.equipmentId) {
          onSuccess(result.equipmentId);
        }
      } else {
        setErrors({ general: result.message || 'Failed to create equipment' });
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      id: '',
      itemTypeId: '',
      assignedUserId: '',
      assignedUserName: '',
      equipmentDepot: '',
      status: '',
      imageUrl: ''
    });
    setSelectedTemplate(null);
    setErrors({});
    setSuccessMessage('');
  };

  if (isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading equipment templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          ➕ Add New Equipment
        </h2>
        <p className="text-gray-600 mt-1">
          Select a template and fill in the equipment details to add a new item to the inventory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Template Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Equipment Template *
          </label>
          <TemplateSelector
            templates={itemTypes}
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
            error={errors.itemTypeId}
          />
        </div>

        {/* Template Details (Read-only) */}
        {selectedTemplate && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">📋 Template Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Category:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.category}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Model:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.model}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Manufacturer:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.manufacturer}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Assignment Type:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.assignmentType}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Default Depot:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.defaultDepot}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Default Status:</span>
                <span className="ml-2 text-blue-700">{selectedTemplate.defaultStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Details Form */}
        {selectedTemplate && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Equipment Details
            </h3>

            {/* Equipment ID */}
            <div>
              <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700 mb-1">
                Equipment ID *
              </label>
              <input
                type="text"
                id="equipmentId"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.id ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., EQ-RADIO-001"
              />
              {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Unique identifier for this equipment item (auto-suggested based on template)
              </p>
            </div>

            {/* Assigned User ID */}
            <div>
              <label htmlFor="assignedUserId" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned User ID *
              </label>
              <input
                type="text"
                id="assignedUserId"
                value={formData.assignedUserId}
                onChange={(e) => handleInputChange('assignedUserId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.assignedUserId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., user-001 or team-alpha"
              />
              {errors.assignedUserId && <p className="mt-1 text-sm text-red-600">{errors.assignedUserId}</p>}
              <p className="mt-1 text-sm text-gray-500">
                User ID or team ID this equipment is assigned to
              </p>
            </div>

            {/* Assigned User Name (Optional) */}
            <div>
              <label htmlFor="assignedUserName" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned User Name
              </label>
              <input
                type="text"
                id="assignedUserName"
                value={formData.assignedUserName}
                onChange={(e) => handleInputChange('assignedUserName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., דני כהן or כיתה אלפא"
              />
              <p className="mt-1 text-sm text-gray-500">
                Display name for the assigned user (optional)
              </p>
            </div>

            {/* Equipment Depot */}
            <div>
              <label htmlFor="equipmentDepot" className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Depot *
              </label>
              <input
                type="text"
                id="equipmentDepot"
                value={formData.equipmentDepot}
                onChange={(e) => handleInputChange('equipmentDepot', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.equipmentDepot ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Radio Depot"
              />
              {errors.equipmentDepot && <p className="mt-1 text-sm text-red-600">{errors.equipmentDepot}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Storage depot for this equipment (pre-filled from template, can be modified)
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select status...</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="storage">Storage</option>
                <option value="work">Work</option>
                <option value="available">Available</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Current status of this equipment item
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://storage.googleapis.com/sayeret-givati/equipment/..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Firebase Storage URL for equipment photo (optional)
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={!selectedTemplate || isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating Equipment...</span>
              </>
            ) : (
              '✅ Create Equipment'
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔄 Reset Form
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ❌ Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEquipmentForm;