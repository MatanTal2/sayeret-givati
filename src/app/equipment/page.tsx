'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import AddEquipmentForm from '@/components/equipment/AddEquipmentForm';
import { EquipmentService } from '@/lib/equipmentService';
import { Equipment } from '@/types/equipment';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Package, List, Plus, BarChart3, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Equipment Page - צלם
 * Military equipment management with serial numbers
 * Add new equipment and view existing inventory
 */
// Equipment page tabs configuration
const EQUIPMENT_TABS = [
  {
    id: 'list',
    label: 'רשימת ציוד',
    icon: List,
    description: 'צפייה וניהול מלאי הציוד הקיים'
  },
  {
    id: 'add',
    label: 'הוסף ציוד',
    icon: Plus,
    description: 'הוספת פריטי ציוד חדשים למערכת'
  }
] as const;

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  // Load equipment on component mount
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setIsLoading(true);
      setError('');
      const equipmentList = await EquipmentService.getAllEquipment();
      setEquipment(equipmentList);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('Failed to load equipment list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquipmentAdded = () => {
    // Refresh the equipment list when new equipment is added
    loadEquipment();
    // Switch to list view to show the new equipment
    setActiveTab('list');
  };

  const groupEquipmentByCategory = (equipmentList: Equipment[]) => {
    return equipmentList.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Equipment[]>);
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      radio: '📻',
      optics: '🔍',
      extraction_gear: '🪢',
      weapons: '🔫',
      protective_gear: '🛡️',
      communication: '📡',
      navigation: '🧭',
      medical: '🏥',
      tools: '🔧',
      general: '📦'
    };
    return iconMap[category] || '📦';
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      storage: 'bg-gray-100 text-gray-800',
      work: 'bg-purple-100 text-purple-800',
      available: 'bg-green-100 text-green-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getAssignmentTypeColor = (assignmentType: string): string => {
    return assignmentType === 'personal' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const categorizedEquipment = groupEquipmentByCategory(equipment);
  const activeTabData = EQUIPMENT_TABS.find(tab => tab.id === activeTab);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header 
          title="ניהול ציוד צבאי"
          subtitle="מערכת מעקב וניהול ציוד עם מספרים סידוריים"
          showAuth={true}
        />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Welcome message */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  שלום, {user?.firstName || 'משתמש'}
                </h1>
                <p className="text-gray-600 text-sm">
                  ניהול מלאי ציוד צבאי
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              ברוך הבא למערכת ניהול הציוד של סיירת גבעתי. כאן תוכל לצפות, להוסיף ולנהל את כל פריטי הציוד הצבאי.
            </p>
          </div>

          {/* Tabbed Interface */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {EQUIPMENT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600 bg-purple-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.id === 'list' && equipment.length > 0 && (
                        <span className="mr-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {equipment.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTabData && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <activeTabData.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{activeTabData.label}</h2>
                      <p className="text-gray-600">{activeTabData.description}</p>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'list' && (
                    <div>
              {/* Equipment List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                  <span className="mr-2 text-gray-600">טוען ציוד...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-red-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <p className="text-red-800">שגיאה בטעינת הציוד</p>
                      <button
                        onClick={loadEquipment}
                        className="mt-2 text-red-600 hover:text-red-500 font-medium"
                      >
                        נסה שוב
                      </button>
                    </div>
                  </div>
                </div>
              ) : equipment.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">אין ציוד במערכת</h3>
                  <p className="text-gray-500 mb-6">
                    לא נמצאו פריטי ציוד במלאי. הוסף ציוד כדי להתחיל.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4 inline-block ml-2" />
                    הוסף ציוד ראשון
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-2xl font-bold text-gray-900">{equipment.length}</div>
                          <div className="text-sm text-gray-600">סה״כ ציוד</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {equipment.filter(item => item.assignmentType === 'personal').length}
                          </div>
                          <div className="text-sm text-gray-600">ציוד אישי</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {equipment.filter(item => item.assignmentType === 'team').length}
                          </div>
                          <div className="text-sm text-gray-600">ציוד קבוצתי</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="mr-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {Object.keys(categorizedEquipment).length}
                          </div>
                          <div className="text-sm text-gray-600">קטגוריות</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipment by Category */}
                  {Object.entries(categorizedEquipment).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <span className="ml-3 text-xl">{getCategoryIcon(category)}</span>
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span className="mr-3 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                            {items.length} פריטים
                          </span>
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                          <div key={item.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {item.manufacturer} {item.model}
                                  </h4>
                                  <span className="ml-3 text-sm font-mono text-gray-500">
                                    {item.id}
                                  </span>
                                  <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getAssignmentTypeColor(item.assignmentType)}`}>
                                    {item.assignmentType}
                                  </span>
                                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">מוקצה ל:</span>
                                    <div className="text-gray-900">
                                      {item.assignedUserName || item.assignedUserId}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">מחסן:</span>
                                    <div className="text-gray-900">{item.equipmentDepot}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">נרשם בתאריך:</span>
                                    <div className="text-gray-900">
                                      {new Date(item.registeredAt).toLocaleDateString('he-IL')}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">תבנית:</span>
                                    <div className="text-gray-900 font-mono text-xs">
                                      {item.itemTypeId}
                                    </div>
                                  </div>
                                </div>

                                {item.imageUrl && (
                                  <div className="mt-3">
                                    <span className="text-sm font-medium text-gray-600">תמונה:</span>
                                    <a 
                                      href={item.imageUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="mr-2 text-purple-600 hover:text-purple-500 text-sm"
                                    >
                                      צפה בתמונה
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
                    </div>
                  )}

                  {activeTab === 'add' && (
                    <AddEquipmentForm
                      onSuccess={handleEquipmentAdded}
                      onCancel={() => setActiveTab('list')}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            מערכת ניהול ציוד סיירת גבעתי • גרסה 1.0 • פותח עבור צה״ל
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}