'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ItemType, NewItemTypeForm } from '@/types/equipment';
import { ItemTypesService } from '@/lib/itemTypesService';
import { Package, Upload, Plus, Search, Download, AlertCircle, CheckCircle, X } from 'lucide-react';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface CsvUploadResult {
  successful: number;
  failed: number;
  errors: string[];
  successItems: string[];
}

interface ItemTypeFormData extends Omit<NewItemTypeForm, 'id'> {
  id: string;
}

const ASSIGNMENT_TYPE_OPTIONS = [
  { value: 'team', label: 'Team Assignment (קבוצתי)' },
  { value: 'personal', label: 'Personal Assignment (אישי)' }
] as const;

const DEFAULT_STATUS_OPTIONS = [
  'work',
  'active', 
  'available',
  'maintenance',
  'storage'
] as const;

const CATEGORY_OPTIONS = [
  'radio',
  'optics', 
  'extraction_gear',
  'weapons',
  'protective_gear',
  'communication',
  'navigation',
  'medical',
  'tools',
  'general'
] as const;

export default function ItemTypesManagement() {
  // State management
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'bulk' | 'list'>('single');
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [filteredItemTypes, setFilteredItemTypes] = useState<ItemType[]>([]);
  
  // Single add form state
  const [formData, setFormData] = useState<ItemTypeFormData>({
    id: '',
    category: '',
    model: '',
    manufacturer: '',
    assignmentType: 'team',
    defaultDepot: '',
    defaultImageUrl: '',
    defaultStatus: 'work'
  });

  // Bulk upload state
  const [csvPreview, setCsvPreview] = useState<ItemType[] | null>(null);
  const [uploadResult, setUploadResult] = useState<CsvUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');

  // Load item types on component mount
  useEffect(() => {
    fetchItemTypes();
  }, []);

  // Apply filters when search/filter changes
  useEffect(() => {
    let filtered = itemTypes;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (assignmentFilter) {
      filtered = filtered.filter(item => item.assignmentType === assignmentFilter);
    }
    
    setFilteredItemTypes(filtered);
  }, [itemTypes, searchTerm, categoryFilter, assignmentFilter]);

  const fetchItemTypes = async () => {
    try {
      const types = await ItemTypesService.getAllItemTypes();
      setItemTypes(types);
          } catch {
        setMessage({ type: 'error', text: 'Failed to load item types' });
      }
  };

  const clearMessage = () => setMessage(null);

  const resetForm = () => {
    setFormData({
      id: '',
      category: '',
      model: '',
      manufacturer: '',
      assignmentType: 'team',
      defaultDepot: '',
      defaultImageUrl: '',
      defaultStatus: 'work'
    });
  };

  const generateItemTypeId = (category: string, model: string) => {
    const cleanCategory = category.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const cleanModel = model.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return `TEMPLATE_${cleanCategory}_${cleanModel}`;
  };

  const handleFormChange = (field: keyof ItemTypeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate ID when category or model changes
    if (field === 'category' || field === 'model') {
      const newFormData = { ...formData, [field]: value };
      if (newFormData.category && newFormData.model) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          id: generateItemTypeId(newFormData.category, newFormData.model)
        }));
      }
    }
    
    if (message) clearMessage();
  };

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.category || !formData.model || !formData.assignmentType) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const itemType: ItemType = {
        id: formData.id || generateItemTypeId(formData.category, formData.model),
        category: formData.category,
        model: formData.model,
        manufacturer: formData.manufacturer || '',
        assignmentType: formData.assignmentType as 'team' | 'personal',
        defaultDepot: formData.defaultDepot || '',
        defaultImageUrl: formData.defaultImageUrl || undefined,
        defaultStatus: formData.defaultStatus
      };

      const result = await ItemTypesService.addItemType(itemType);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        resetForm();
        await fetchItemTypes(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add item type. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Template
  const csvTemplate = `category,model,manufacturer,assignmentType,defaultDepot,defaultImageUrl,defaultStatus
radio,PRC-152,Harris,team,Radio Depot,https://example.com/radio.jpg,work
optics,ACOG 4x32,Trijicon,personal,Optics Depot,,work
extraction_gear,Rope 30m,MilSpec,team,Equipment Depot,,active`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'item_types_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvFile = (file: File): Promise<ItemType[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have header and at least one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          // const expectedHeaders = ['category', 'model', 'manufacturer', 'assignmentType', 'defaultDepot', 'defaultImageUrl', 'defaultStatus'];
          
          // Validate required headers
          const requiredHeaders = ['category', 'model', 'assignmentType'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          const itemTypes: ItemType[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            if (values.length !== headers.length) {
              reject(new Error(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`));
              return;
            }

            const itemType: Partial<ItemType> = {};

            headers.forEach((header, index) => {
              const value = values[index];
              switch (header) {
                case 'category':
                  itemType.category = value;
                  break;
                case 'model':
                  itemType.model = value;
                  break;
                case 'manufacturer':
                  itemType.manufacturer = value;
                  break;
                case 'assignmentType':
                  if (value !== 'team' && value !== 'personal') {
                    reject(new Error(`Row ${i + 1}: assignmentType must be 'team' or 'personal', got '${value}'`));
                    return;
                  }
                  itemType.assignmentType = value as 'team' | 'personal';
                  break;
                case 'defaultDepot':
                  itemType.defaultDepot = value;
                  break;
                case 'defaultImageUrl':
                  itemType.defaultImageUrl = value || undefined;
                  break;
                case 'defaultStatus':
                  itemType.defaultStatus = value || 'work';
                  break;
              }
            });

            // Generate ID and validate required fields
            if (!itemType.category || !itemType.model || !itemType.assignmentType) {
              reject(new Error(`Row ${i + 1}: Missing required fields (category, model, assignmentType)`));
              return;
            }

            itemType.id = generateItemTypeId(itemType.category, itemType.model);
            itemTypes.push(itemType as ItemType);
          }
          
          resolve(itemTypes);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);
    setCsvPreview(null);
    setUploadResult(null);

    try {
      const itemTypes = await parseCsvFile(file);
      setCsvPreview(itemTypes);
      setMessage({ type: 'success', text: `Parsed ${itemTypes.length} item types from CSV. Review and confirm to add them.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to parse CSV file' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkConfirm = async () => {
    if (!csvPreview) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await ItemTypesService.bulkAddItemTypes(csvPreview);
      
      const successCount = result.successful.length;
      const failedCount = result.failed.length;
      
      setUploadResult({
        successful: successCount,
        failed: failedCount,
        errors: result.failed.map(f => f.error),
        successItems: result.successful.map(s => s.itemType.model)
      });

      if (successCount > 0) {
        await fetchItemTypes(); // Refresh the list
        setCsvPreview(null);
        setMessage({ 
          type: 'success', 
          text: `Successfully added ${successCount} item types. ${failedCount > 0 ? `${failedCount} failed.` : ''}` 
        });
      } else {
        setMessage({ type: 'error', text: 'No item types were added successfully.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add item types. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSingleAddForm = () => (
    <div className="space-y-6">
      <form onSubmit={handleSingleAdd} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <input
              type="text"
              id="model"
              value={formData.model}
              onChange={(e) => handleFormChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., PRC-152, ACOG 4x32"
              required
            />
          </div>

          {/* Manufacturer */}
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => handleFormChange('manufacturer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Harris, Trijicon"
            />
          </div>

          {/* Assignment Type */}
          <div>
            <label htmlFor="assignmentType" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Type *
            </label>
            <select
              id="assignmentType"
              value={formData.assignmentType}
              onChange={(e) => handleFormChange('assignmentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              {ASSIGNMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Depot */}
          <div>
            <label htmlFor="defaultDepot" className="block text-sm font-medium text-gray-700 mb-2">
              Default Depot
            </label>
            <input
              type="text"
              id="defaultDepot"
              value={formData.defaultDepot}
              onChange={(e) => handleFormChange('defaultDepot', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Radio Depot, Armory"
            />
          </div>

          {/* Default Status */}
          <div>
            <label htmlFor="defaultStatus" className="block text-sm font-medium text-gray-700 mb-2">
              Default Status
            </label>
            <select
              id="defaultStatus"
              value={formData.defaultStatus}
              onChange={(e) => handleFormChange('defaultStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {DEFAULT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Template ID Preview */}
        {formData.category && formData.model && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Template ID
            </label>
            <div className="font-mono text-sm text-gray-800 bg-white px-3 py-2 rounded border">
              {formData.id || generateItemTypeId(formData.category, formData.model)}
            </div>
          </div>
        )}

        {/* Default Image URL */}
        <div>
          <label htmlFor="defaultImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Default Image URL
          </label>
          <input
            type="url"
            id="defaultImageUrl"
            value={formData.defaultImageUrl}
            onChange={(e) => handleFormChange('defaultImageUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Item Type
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderBulkUpload = () => (
    <div className="space-y-6">
      {/* CSV Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-400 text-lg mr-3">ℹ️</div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
            <p className="text-sm text-blue-700 mb-3">
              Upload a CSV file with the following headers (in this exact order):
            </p>
            <code className="block text-xs bg-blue-100 p-2 rounded border text-blue-800 mb-3">
              category,model,manufacturer,assignmentType,defaultDepot,defaultImageUrl,defaultStatus
            </code>
            <button
              onClick={downloadTemplate}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center"
            >
              <Download className="w-3 h-3 mr-1" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
        <p className="text-gray-600 mb-4">Select a CSV file containing item types to import</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {isLoading ? 'Processing...' : 'Choose File'}
        </button>
      </div>

      {/* CSV Preview */}
      {csvPreview && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Preview - {csvPreview.length} Item Types</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCsvPreview(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            <div className="grid gap-2">
              {csvPreview.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{item.model}</span>
                  <div className="flex gap-2 text-xs text-gray-600">
                    <span className="bg-white px-2 py-1 rounded">{item.category}</span>
                    <span className={`px-2 py-1 rounded ${item.assignmentType === 'team' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {item.assignmentType}
                    </span>
                  </div>
                </div>
              ))}
              {csvPreview.length > 10 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  ... and {csvPreview.length - 10} more items
                </p>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleBulkConfirm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm & Add All
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Results</h3>
          <div className="space-y-3">
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{uploadResult.successful} item types added successfully</span>
            </div>
            {uploadResult.failed > 0 && (
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{uploadResult.failed} item types failed to add</span>
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Errors:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderItemTypesList = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by model, manufacturer, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Filter */}
          <div>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Types</option>
              <option value="team">Team Assignment</option>
              <option value="personal">Personal Assignment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredItemTypes.length} of {itemTypes.length} item types
        </p>
      </div>

      {/* Item Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItemTypes.map((itemType) => (
          <div key={itemType.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{itemType.model}</h3>
                <p className="text-sm text-gray-600">{itemType.manufacturer}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                itemType.assignmentType === 'team' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {itemType.assignmentType}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Category:</span> {itemType.category}
              </div>
              {itemType.defaultDepot && (
                <div>
                  <span className="font-medium">Depot:</span> {itemType.defaultDepot}
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span> {itemType.defaultStatus}
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="font-mono text-xs text-gray-500">{itemType.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItemTypes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No item types found</h3>
          <p className="text-gray-600">
            {searchTerm || categoryFilter || assignmentFilter 
              ? 'Try adjusting your search or filters'
              : 'Add your first item type to get started'
            }
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'single'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline-block ml-2" />
            Add Single Item Type
          </button>
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'bulk'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline-block ml-2" />
            Bulk Upload CSV
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'list'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline-block ml-2" />
            View All Item Types
          </button>
        </nav>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            )}
            <p className={`text-sm ${
              message.type === 'success' 
                ? 'text-green-700' 
                : 'text-red-700'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeSubTab === 'single' && renderSingleAddForm()}
        {activeSubTab === 'bulk' && renderBulkUpload()}
        {activeSubTab === 'list' && renderItemTypesList()}
      </div>
    </div>
  );
}