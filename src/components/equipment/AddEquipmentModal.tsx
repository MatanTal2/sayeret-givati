'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, ChevronDown, RefreshCw } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { TEXT_CONSTANTS } from '@/constants/text';
import { 
  validateEquipmentId, 
  validateUserName,
  validateUnitName,
  validateLocation 
} from '@/lib/equipmentValidation';
import { type EquipmentTemplate } from '@/data/equipmentTemplates';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useUsers } from '@/hooks/useUsers';
import EquipmentTemplateForm from './EquipmentTemplateForm';
import { EquipmentType, EquipmentStatus, EquipmentCondition } from '@/types/equipment';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (equipment: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>) => Promise<void>;
  loading?: boolean;
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

// Searchable Dropdown Component
interface SearchableDropdownProps {
  value: string;
  onChange?: (value: string) => void;
  onSelect?: (option: { id: string; label: string; subtitle?: string }) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  isOpen: boolean;
  onToggle: () => void;
  options: { id: string; label: string; subtitle?: string }[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
}

function SearchableDropdown({
  value,
  onChange,
  onSelect,
  onSearchChange,
  searchTerm,
  isOpen,
  onToggle,
  options,
  placeholder,
  error,
  disabled = false,
  loading = false
}: SearchableDropdownProps) {
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onToggle}
          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          disabled={disabled}
        >
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">טוען...</div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-gray-500">לא נמצאו תוצאות</div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (onSelect) {
                    onSelect(option);
                  } else if (onChange) {
                    onChange(option.label);
                  }
                }}
                className="w-full px-3 py-2 text-right hover:bg-purple-50 focus:bg-purple-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.subtitle && (
                  <div className="text-sm text-gray-600">{option.subtitle}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

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
  const [isClassifiedEquipment, setIsClassifiedEquipment] = useState(false); // צלם/צופן checkbox
  const [showTemplates, setShowTemplates] = useState(true);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  
  // Dropdown states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  
  // Category collapse states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Refs for dropdown management
  const nameDropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get user authentication context
  const { enhancedUser } = useAuth();

  // Helper function to get template display properties
  const getTemplateDisplayProps = (template: EquipmentType | EquipmentTemplate) => {
    if ('productName' in template) {
      // Old EquipmentTemplate format
      const equipmentTemplate = template as EquipmentTemplate & { 
        icon?: string; 
        idPrefix?: string; 
        defaultLocation?: string; 
      };
      return {
        icon: equipmentTemplate.icon || '⚙️',
        idPrefix: equipmentTemplate.idPrefix || 'EQ',
        defaultLocation: equipmentTemplate.defaultLocation || 'מחסן',
        description: equipmentTemplate.description || equipmentTemplate.name
      };
    } else {
      // New EquipmentType format
      const equipmentType = template as EquipmentType;
      return {
        icon: '⚙️', // Default icon for Firestore templates
        idPrefix: equipmentType.name.substring(0, 3).toUpperCase(),
        defaultLocation: 'מחסן', // Default location
        description: equipmentType.description || equipmentType.notes || equipmentType.name
      };
    }
  };
  
  // Get users data for name autocomplete
  const { users, loading: usersLoading } = useUsers();
  
  // Get templates with Firestore integration and caching
  const { 
    templates, 
    templatesByCategory, 
    loading: templatesLoading, 
    error: templatesError,
    refreshTemplates,
    invalidateCache
  } = useTemplates();

  // Extract unique categories from templates for the form dropdown
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    templates.forEach(template => {
      if (template.category && template.category !== 'לא נמצא') {
        categorySet.add(template.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [templates]);

  // Check if user has manager permissions (manager, system_manager, admin)
  const hasManagerPermissions = enhancedUser?.userType && [
    UserType.MANAGER,
    UserType.SYSTEM_MANAGER, 
    UserType.ADMIN
  ].includes(enhancedUser.userType);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      const newFormData = { 
        ...initialFormData,
        // Auto-fill current user's name if available
        currentHolder: enhancedUser ? `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim() : ''
      };
      setFormData(newFormData);
      setErrors({});
      setSelectedTemplate(null);
      setShowTemplates(true);
      setShowNameDropdown(false);
      setShowUnitDropdown(false);
      setNameSearchTerm('');
      setUnitSearchTerm('');
      
      // Set first category expanded by default
      const categories = Object.keys(templatesByCategory);
      if (categories.length > 0) {
        setExpandedCategories(new Set([categories[0]]));
      }
    }
  }, [isOpen, enhancedUser, templatesByCategory]);

  // Handle template selection
  const handleTemplateSelect = (template: EquipmentType | EquipmentTemplate) => {
    setSelectedTemplate(template as EquipmentTemplate);
    setShowTemplates(false);
    
    // Pre-fill form with template data
    if ('productName' in template) {
      // Old EquipmentTemplate format (legacy) - but we'll use simplified logic
      const equipmentTemplate = template as EquipmentTemplate;
      setFormData({
        serialNumber: `${equipmentTemplate.name.replace(/\s+/g, '_')}_${Date.now()}`,
        equipmentType: equipmentTemplate.id,
        productName: equipmentTemplate.name,
        category: equipmentTemplate.category,
        currentHolder: enhancedUser ? `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim() : '',
        assignedUnit: '',
        location: 'מחסן',
        status: EquipmentStatus.AVAILABLE,
        condition: EquipmentCondition.NEW,
        notes: equipmentTemplate.notes || ''
      });
    } else {
      // New EquipmentType format from Firestore
      const equipmentType = template as EquipmentType;
      setFormData({
        serialNumber: `${equipmentType.name.replace(/\s+/g, '_')}_${Date.now()}`,
        equipmentType: equipmentType.id,
        productName: equipmentType.name,
        category: equipmentType.category,
        currentHolder: enhancedUser ? `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim() : '',
        assignedUnit: '',
        location: '',
        status: EquipmentStatus.AVAILABLE,
        condition: EquipmentCondition.NEW,
        notes: equipmentType.notes || ''
      });
    }
  };

  // Handle manual entry (skip templates)
  const handleSkipTemplates = () => {
    setSelectedTemplate(null);
    setShowTemplates(false);
  };


  // Handle create new template
  const handleCreateNewTemplate = () => {
    setShowCreateTemplate(true);
  };

  // Handle template created successfully
  const handleTemplateCreated = async (template: EquipmentType) => {
    console.log('✅ Template created:', template);
    setShowCreateTemplate(false);
    
    // Invalidate cache and refresh templates from Firestore
    console.log('🔄 Templates refreshed after creation');
    invalidateCache();
    await refreshTemplates();
    
    // Optionally auto-select the new template
    // setSelectedTemplate(template as EquipmentTemplate);
    // setShowTemplates(false);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = user.fullName.toLowerCase();
    const searchLower = nameSearchTerm.toLowerCase();
    return fullName.includes(searchLower);
  }).slice(0, 5); // Show up to 5 suggestions

  // Handle name selection from dropdown
  const handleNameSelect = (option: { id: string; label: string; subtitle?: string }) => {
    setFormData(prev => ({ ...prev, currentHolder: option.label }));
    setNameSearchTerm('');
    setShowNameDropdown(false);
    // Clear error when user selects a name
    if (errors.currentHolder) {
      setErrors(prev => ({ ...prev, currentHolder: '' }));
    }
  };

  // Handle unit selection (placeholder for now)
  const handleUnitSelect = (option: { id: string; label: string; subtitle?: string }) => {
    setFormData(prev => ({ ...prev, assignedUnit: option.label }));
    setUnitSearchTerm('');
    setShowUnitDropdown(false);
    // Clear error when user selects a unit
    if (errors.assignedUnit) {
      setErrors(prev => ({ ...prev, assignedUnit: '' }));
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target as Node)) {
        setShowNameDropdown(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Serial number validation - required only for classified equipment (צלם/צופן)
    if (isClassifiedEquipment) {
      const serialValidation = validateEquipmentId(formData.serialNumber);
      if (!serialValidation.isValid) {
        newErrors.serialNumber = serialValidation.error || 'מספר סידורי לא תקין';
      }
    } else if (formData.serialNumber.trim()) {
      // If not classified but serial number is provided, validate it
      const serialValidation = validateEquipmentId(formData.serialNumber);
      if (!serialValidation.isValid) {
        newErrors.serialNumber = serialValidation.error || 'מספר סידורי לא תקין';
      }
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

    // Location validation - now optional
    if (formData.location.trim()) {
      const locationValidation = validateLocation(formData.location);
      if (!locationValidation.isValid) {
        newErrors.location = locationValidation.error || 'מיקום לא תקין';
      }
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
      const now = serverTimestamp() as Timestamp;
      
      const equipmentData = {
        ...restFormData,
        id: serialNumber, // Use serial number as ID
        equipmentType: formData.equipmentType || 'manual_entry', // Default for manual entries
        currentHolderId: enhancedUser?.uid || '', // User UID for queries and permissions
        acquisitionDate: now,
        dateSigned: now,
        lastSeen: now,
        lastReportUpdate: now,
        signedBy: enhancedUser ? `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim() : 'מערכת',
        // Remove trackingHistory - will be created by the service
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
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
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
            {/* Action Buttons - Only visible for managers */}
            {hasManagerPermissions && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleSkipTemplates}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  יצירה ידנית
                </button>
                <button
                  onClick={handleCreateNewTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  צור תבנית חדשה
                </button>
              </div>
            )}

            {/* Status and Refresh Section */}
            <div className="flex items-center justify-between mb-4">
              {/* Template Count */}
              <span className="text-sm text-gray-500">
                {templates.length} תבניות
              </span>
              
              {/* Refresh Button */}
              <button
                onClick={refreshTemplates}
                disabled={templatesLoading}
                className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${templatesLoading ? 'animate-spin' : ''}`} />
                רענן
              </button>
            </div>

            {/* Error Display */}
            {templatesError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ❌ שגיאה בטעינת תבניות: {templatesError}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  לא ניתן לטעון תבניות ממסד הנתונים
                </p>
              </div>
            )}

            {/* Empty State */}
            {templates.length === 0 && !templatesLoading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">אין תבניות זמינות</h3>
                <p className="text-gray-500 mb-4">
                  לא נמצאו תבניות ציוד במסד הנתונים
                </p>
                {hasManagerPermissions && (
                  <button
                    onClick={handleCreateNewTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    צור תבנית ראשונה
                  </button>
                )}
              </div>
            )}

            {/* Template Categories - Collapsible Layout */}
            {templates.length > 0 && (
              <div className="space-y-3">
                {Object.entries(templatesByCategory).map(([category, templates]) => {
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between text-right hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      <ChevronDown 
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Category Content - Collapsible */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2">
                          {templates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              className="w-full p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-right group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getTemplateDisplayProps(template).icon}</span>
                                <div className="flex-1 min-w-0 space-y-1">
                                  {/* Template Name */}
                                  <h4 className="font-medium text-gray-900 group-hover:text-purple-700 truncate">
                                    {template.name}
                                  </h4>
                                  
                                  {/* Category and Subcategory */}
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                      {template.category}
                                    </span>
                                    {template.subcategory && (
                                      <span className="text-gray-400">›</span>
                                    )}
                                    {template.subcategory && (
                                      <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded">
                                        {template.subcategory}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Description or Notes */}
                                  {getTemplateDisplayProps(template).description && (
                                    <p className="text-sm text-gray-600 truncate">
                                      {getTemplateDisplayProps(template).description}
                                    </p>
                                  )}
                                  
                                  {/* Daily Status Check Badge */}
                                  {template.requiresDailyStatusCheck && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600">
                                      <span className="bg-amber-50 px-2 py-0.5 rounded">
                                        ⚠️ דורש דיווח יומי
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}

            {/* Manual Entry Option for Non-Managers */}
            {!hasManagerPermissions && (
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
            )}
          </div>
        ) : (
          /* Equipment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Template Indicator */}
            {selectedTemplate && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTemplateDisplayProps(selectedTemplate).icon}</span>
                  <div>
                    <h4 className="font-medium text-purple-900">
                      תבנית: {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-purple-700">
                      {getTemplateDisplayProps(selectedTemplate).description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Serial Number with Classification Checkbox */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                מספר סידורי {isClassifiedEquipment ? '*' : '(אופציונלי)'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isClassifiedEquipment}
                  onChange={(e) => setIsClassifiedEquipment(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">צלם/צופן</span>
              </label>
            </div>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.serialNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={isClassifiedEquipment ? "לדוגמה: EQ-2024-001" : "לדוגמה: EQ-2024-001 (אופציונלי)"}
              disabled={isSubmitting}
            />
            {errors.serialNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>
            )}
            {isClassifiedEquipment && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ ציוד מסווג דורש מספר סידורי
              </p>
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
                disabled={isSubmitting || templatesLoading}
              >
                <option value="">בחר קטגוריה</option>
                {availableCategories.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                {availableCategories.length === 0 && !templatesLoading && (
                  <option value="" disabled>אין קטגוריות זמינות</option>
                )}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={nameDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מחזיק נוכחי *
              </label>
              {hasManagerPermissions ? (
                <SearchableDropdown
                  value={formData.currentHolder}
                  onSelect={handleNameSelect}
                  onSearchChange={(search) => {
                    setNameSearchTerm(search);
                    setShowNameDropdown(true);
                  }}
                  searchTerm={nameSearchTerm}
                  isOpen={showNameDropdown}
                  onToggle={() => setShowNameDropdown(!showNameDropdown)}
                  options={filteredUsers.map(user => ({
                    id: user.uid,
                    label: user.fullName,
                    subtitle: `${user.rank} • ${user.role}`
                  }))}
                  placeholder="חפש או הקלד שם"
                  error={errors.currentHolder}
                  disabled={isSubmitting}
                  loading={usersLoading}
                />
              ) : (
                <>
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
                </>
              )}
            </div>

            <div ref={unitDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                יחידה *
              </label>
              {hasManagerPermissions ? (
                <SearchableDropdown
                  value={formData.assignedUnit}
                  onSelect={handleUnitSelect}
                  onSearchChange={(search) => {
                    setUnitSearchTerm(search);
                    setShowUnitDropdown(true);
                  }}
                  searchTerm={unitSearchTerm}
                  isOpen={showUnitDropdown}
                  onToggle={() => setShowUnitDropdown(!showUnitDropdown)}
                  options={[
                    // TODO: implement units fetching
                    { id: '1', label: 'פלוגה א\'', subtitle: 'פלוגת חי"ר' },
                    { id: '2', label: 'פלוגה ב\'', subtitle: 'פלוגת חי"ר' },
                    { id: '3', label: 'פלוגה ג\'', subtitle: 'פלוגת חי"ר' },
                    { id: '4', label: 'מטה הגדוד', subtitle: 'יחידת מטה' },
                    { id: '5', label: 'מחלקת טכ"ל', subtitle: 'תמיכה לוגיסטית' }
                  ].filter(unit => 
                    unit.label.toLowerCase().includes(unitSearchTerm.toLowerCase())
                  )}
                  placeholder="חפש או הקלד יחידה"
                  error={errors.assignedUnit}
                  disabled={isSubmitting}
                  loading={false}
                />
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיקום (אופציונלי)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="לדוגמה: מחסן נשק - בסיס (אופציונלי)"
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

      {/* Template Creation Form */}
      <EquipmentTemplateForm
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        onSuccess={handleTemplateCreated}
      />
    </div>
  );
}
