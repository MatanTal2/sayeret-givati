'use client';

import React, { useState } from 'react';
import { EquipmentService, SAMPLE_EQUIPMENT_DATA } from '@/lib/equipmentService';
// import { seedEquipmentCollection } from '@/scripts/seedEquipment';
import { Equipment } from '@/types/equipment';

interface SeedingStatus {
  isSeeding: boolean;
  isVerifying: boolean;
  message: string;
  results: {
    successful: number;
    failed: number;
    details?: Array<{ id: string; error?: string }>;
  } | null;
}

/**
 * Admin component for seeding the equipment collection
 * Provides UI controls for populating and verifying the collection
 */
const EquipmentSeeder: React.FC = () => {
  const [status, setStatus] = useState<SeedingStatus>({
    isSeeding: false,
    isVerifying: false,
    message: '',
    results: null
  });

  const [existingEquipment, setExistingEquipment] = useState<Equipment[]>([]);

  const handleSeedCollection = async () => {
    setStatus(prev => ({
      ...prev,
      isSeeding: true,
      message: 'Starting equipment collection seeding...',
      results: null
    }));

    try {
      // Check if collection is already populated
      const isEmpty = await EquipmentService.isCollectionEmpty();
      
      if (!isEmpty) {
        setStatus(prev => ({
          ...prev,
          isSeeding: false,
          message: '⚠️ Collection already contains data. Use verification to view existing items.',
          results: null
        }));
        return;
      }

      // Seed the collection
      const result = await EquipmentService.seedEquipment(SAMPLE_EQUIPMENT_DATA);
      
      setStatus(prev => ({
        ...prev,
        isSeeding: false,
        message: `✅ Seeding completed! ${result.successful.length} successful, ${result.failed.length} failed`,
        results: {
          successful: result.successful.length,
          failed: result.failed.length,
          details: [
            ...result.successful.map(item => ({ id: item.equipment.id })),
            ...result.failed.map(item => ({ id: item.equipment.id, error: item.error }))
          ]
        }
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isSeeding: false,
        message: `❌ Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: null
      }));
    }
  };

  const handleVerifyCollection = async () => {
    setStatus(prev => ({
      ...prev,
      isVerifying: true,
      message: 'Verifying equipment collection...'
    }));

    try {
      const equipment = await EquipmentService.getAllEquipment();
      setExistingEquipment(equipment);
      
      setStatus(prev => ({
        ...prev,
        isVerifying: false,
        message: `📋 Found ${equipment.length} equipment items in collection`
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isVerifying: false,
        message: `❌ Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const handleCreateSample = async () => {
    setStatus(prev => ({
      ...prev,
      message: 'Creating sample equipment...'
    }));

    try {
      const sampleData = {
        id: `EQ-SAMPLE-${Date.now()}`,
        itemTypeId: "TEMPLATE_RADIO_PRC-152",
        assignedUserId: "sample-user",
        assignedUserName: "Sample User",
        status: "active",
        imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/sample.jpg"
      };

      const result = await EquipmentService.createEquipment(sampleData);
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          message: `✅ Sample equipment created: ${result.equipmentId}`
        }));
        // Refresh the list
        handleVerifyCollection();
      } else {
        setStatus(prev => ({
          ...prev,
          message: `❌ Failed to create sample: ${result.message}`
        }));
      }

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        message: `❌ Error creating sample: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const groupEquipmentByCategory = (equipment: Equipment[]) => {
    return equipment.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Equipment[]>);
  };

  const categorizedEquipment = groupEquipmentByCategory(existingEquipment);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🔧 Equipment Collection Management
      </h3>
      
      <p className="text-gray-600 mb-6">
        Manage the equipment collection. This collection contains individual equipment items 
        based on itemTypes templates, with specific assignments, statuses, and images.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleSeedCollection}
          disabled={status.isSeeding || status.isVerifying}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {status.isSeeding ? '🔄 Seeding...' : '📦 Seed Collection'}
        </button>

        <button
          onClick={handleVerifyCollection}
          disabled={status.isSeeding || status.isVerifying}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {status.isVerifying ? '🔄 Verifying...' : '🔍 Verify Collection'}
        </button>

        <button
          onClick={handleCreateSample}
          disabled={status.isSeeding || status.isVerifying}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ➕ Create Sample
        </button>
      </div>

      {/* Status Message */}
      {status.message && (
        <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-gray-700">{status.message}</p>
        </div>
      )}

      {/* Seeding Results */}
      {status.results && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">Seeding Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-green-700">
              ✅ Successful: {status.results.successful}
            </div>
            <div className="text-red-700">
              ❌ Failed: {status.results.failed}
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {existingEquipment.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Collection Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-700">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">{existingEquipment.length}</div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-700">Personal Items</div>
              <div className="text-2xl font-bold text-green-600">
                {existingEquipment.filter(item => item.assignmentType === 'personal').length}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-700">Team Items</div>
              <div className="text-2xl font-bold text-purple-600">
                {existingEquipment.filter(item => item.assignmentType === 'team').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Equipment Display */}
      {Object.keys(categorizedEquipment).length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800">
              📋 Current Equipment Collection ({existingEquipment.length} items)
            </h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(categorizedEquipment).map(([category, items]) => (
              <div key={category} className="border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-100 px-4 py-2">
                  <h5 className="font-medium text-gray-800 uppercase">
                    🏷️ {category} ({items.length} items)
                  </h5>
                </div>
                
                {items.map((item, index) => (
                  <div key={item.id} className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-gray-800">
                          {item.manufacturer} {item.model}
                        </div>
                        <div className="text-sm text-gray-600 font-mono">{item.id}</div>
                        <div className="text-sm text-gray-600">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.assignmentType === 'personal' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.assignmentType}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-700">Assigned:</span>
                          <span className="ml-1 text-gray-600">
                            {item.assignedUserName || item.assignedUserId}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Depot:</span>
                          <span className="ml-1 text-gray-600">{item.equipmentDepot}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Registered:</span>
                          <span className="ml-1 text-gray-600">
                            {new Date(item.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Data Preview */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">
            📦 Sample Data Preview ({SAMPLE_EQUIPMENT_DATA.length} items)
          </h4>
        </div>
        <div className="p-4">
          <div className="grid gap-3">
            {SAMPLE_EQUIPMENT_DATA.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <div className="text-gray-600 font-mono">{item.id}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Template:</span>
                    <div className="text-gray-600">{item.itemTypeId}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assigned:</span>
                    <div className="text-gray-600">{item.assignedUserName || item.assignedUserId}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSeeder;