'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import AddEquipmentForm from '@/components/equipment/AddEquipmentForm';
import { EquipmentService } from '@/lib/equipmentService';
import { Equipment } from '@/types/equipment';
import LoadingSpinner from '@/app/components/LoadingSpinner';

/**
 * Equipment Page - צלם
 * Military equipment management with serial numbers
 * Add new equipment and view existing inventory
 */
export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
      work: 'bg-blue-100 text-blue-800',
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🔧 Equipment Management</h1>
            <p className="text-gray-600 mt-2">
              Manage military equipment inventory with template-based creation and tracking
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Equipment List ({equipment.length})
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ➕ Add Equipment
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'list' && (
            <div>
              {/* Equipment List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">Loading equipment...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="text-red-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-800">{error}</p>
                      <button
                        onClick={loadEquipment}
                        className="mt-2 text-red-600 hover:text-red-500 font-medium"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : equipment.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-gray-500 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Found</h3>
                  <p className="text-gray-600 mb-6">
                    No equipment items in the inventory. Add some equipment to get started.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    ➕ Add First Equipment
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-blue-600">{equipment.length}</div>
                      <div className="text-gray-600">Total Equipment</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-green-600">
                        {equipment.filter(item => item.assignmentType === 'personal').length}
                      </div>
                      <div className="text-gray-600">Personal Items</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-purple-600">
                        {equipment.filter(item => item.assignmentType === 'team').length}
                      </div>
                      <div className="text-gray-600">Team Items</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.keys(categorizedEquipment).length}
                      </div>
                      <div className="text-gray-600">Categories</div>
                    </div>
                  </div>

                  {/* Equipment by Category */}
                  {Object.entries(categorizedEquipment).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <span className="mr-2">{getCategoryIcon(category)}</span>
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({items.length} item{items.length !== 1 ? 's' : ''})
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
                                    <span className="font-medium">Assigned to:</span>
                                    <div className="text-gray-900">
                                      {item.assignedUserName || item.assignedUserId}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Depot:</span>
                                    <div className="text-gray-900">{item.equipmentDepot}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Registered:</span>
                                    <div className="text-gray-900">
                                      {new Date(item.registeredAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Template:</span>
                                    <div className="text-gray-900 font-mono text-xs">
                                      {item.itemTypeId}
                                    </div>
                                  </div>
                                </div>

                                {item.imageUrl && (
                                  <div className="mt-3">
                                    <span className="text-sm font-medium text-gray-600">Image:</span>
                                    <a 
                                      href={item.imageUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-500 text-sm"
                                    >
                                      View Image
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
      </div>
    </AuthGuard>
  );
}