/**
 * Template management tab component - extracted from management page
 */
import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import EquipmentTemplateForm from '@/components/equipment/EquipmentTemplateForm';
import { EquipmentType } from '@/types/equipment';

interface TemplateData {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  icon: string;
  usageCount: number;
  lastUsed: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export default function TemplateManagementTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data for templates
  const mockTemplates: TemplateData[] = [
    {
      id: 'template_1',
      name: 'רובה M4A1',
      description: 'רובה סער M4A1 סטנדרטי',
      categoryId: 'weapons',
      categoryName: 'נשק אישי',
      subcategoryId: 'rifles',
      subcategoryName: 'רובים',
      icon: '🔫',
      usageCount: 45,
      lastUsed: '2024-01-15',
      createdBy: 'יוסי כהן',
      createdAt: '2024-01-10',
      isActive: true
    },
    {
      id: 'template_2',
      name: 'אפוד טקטי',
      description: 'אפוד טקטי סטנדרטי לחי"ר',
      categoryId: 'protection',
      categoryName: 'הגנה אישית',
      subcategoryId: 'vests',
      subcategoryName: 'אפודים',
      icon: '🦺',
      usageCount: 32,
      lastUsed: '2024-01-14',
      createdBy: 'שרה לוי',
      createdAt: '2024-01-08',
      isActive: true
    },
    {
      id: 'template_3',
      name: 'קסדת לחימה',
      description: 'קסדה מתקדמת עם ציוד ראיית לילה',
      categoryId: 'protection',
      categoryName: 'הגנה אישית',
      subcategoryId: 'helmets',
      subcategoryName: 'קסדות',
      icon: '⛑️',
      usageCount: 28,
      lastUsed: '2024-01-13',
      createdBy: 'דוד אבן',
      createdAt: '2024-01-05',
      isActive: false
    }
  ];

  const mockCategories = [
    { id: 'weapons', name: 'נשק אישי', subcategories: [
      { id: 'rifles', name: 'רובים' },
      { id: 'pistols', name: 'אקדחים' },
      { id: 'grenades', name: 'רימונים' }
    ]},
    { id: 'protection', name: 'הגנה אישית', subcategories: [
      { id: 'vests', name: 'אפודים' },
      { id: 'helmets', name: 'קסדות' },
      { id: 'shields', name: 'מגנים' }
    ]},
    { id: 'communication', name: 'ציוד קשר', subcategories: [
      { id: 'radios', name: 'מכשירי קשר' },
      { id: 'antennas', name: 'אנטנות' }
    ]}
  ];

  // Filter templates based on search and category
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.categoryId === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || template.subcategoryId === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const handleEditTemplate = (template: TemplateData) => {
    console.log('Edit template:', template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    console.log('Delete template:', templateId);
  };

  const handleCreateTemplate = () => {
    setShowCreateForm(true);
  };

  const handleTemplateCreated = (template: EquipmentType) => {
    console.log('Template created:', template);
    // TODO: Refresh template list or add to local state
    // For now, just close the form
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">ניהול תבניות ציוד</h3>
          <p className="text-sm text-neutral-600">צור, ערוך ונהל תבניות לציוד צבאי</p>
        </div>
        <Button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TEMPLATE_FORM.CREATE_TEMPLATE}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <Layers className="w-8 h-8 text-primary-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-neutral-900">{mockTemplates.length}</div>
              <div className="text-sm text-neutral-600">סך התבניות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
              <span className="text-success-600 font-bold">✓</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-success-600">{mockTemplates.filter(t => t.isActive).length}</div>
              <div className="text-sm text-neutral-600">פעילות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-info-100 rounded-full flex items-center justify-center">
              <span className="text-info-600 font-bold">📊</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-info-600">{mockTemplates.reduce((sum, t) => sum + t.usageCount, 0)}</div>
              <div className="text-sm text-neutral-600">שימושים</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">📁</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-orange-600">{mockCategories.length}</div>
              <div className="text-sm text-neutral-600">קטגוריות</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">חיפוש</label>
            <input
              type="text"
              placeholder={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.SEARCH_TEMPLATES}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">קטגוריה</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all');
              }}
            >
              <option value="all">כל הקטגוריות</option>
              {mockCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">תת-קטגוריה</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={selectedCategory === 'all'}
            >
              <option value="all">כל התת-קטגוריות</option>
              {selectedCategory !== 'all' && mockCategories
                .find(cat => cat.id === selectedCategory)?.subcategories
                .map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
          <h4 className="text-lg font-medium text-neutral-900">תבניות ציוד ({filteredTemplates.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">תבנית</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">קטגוריה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">שימושים</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">שימוש אחרון</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center ml-3">
                        <span className="text-lg">{template.icon}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{template.name}</div>
                        <div className="text-sm text-neutral-500">{template.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{template.categoryName}</div>
                    <div className="text-sm text-neutral-500">{template.subcategoryName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{template.usageCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{template.lastUsed}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.isActive ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                    }`}>
                      {template.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="text-info-600 hover:text-info-900 ml-2"
                    >
                      ערוך
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      מחק
                    </button>
                    <button className="text-primary-600 hover:text-primary-900 ml-2">שכפל</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Layers className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">אין תבניות</h3>
          <p className="text-neutral-500 mb-4">לא נמצאו תבניות התואמות לחיפוש שלך</p>
          <button 
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            צור תבנית ראשונה
          </button>
        </div>
      )}

      {/* Template Creation Form */}
      <EquipmentTemplateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleTemplateCreated}
      />
    </div>
  );
}
