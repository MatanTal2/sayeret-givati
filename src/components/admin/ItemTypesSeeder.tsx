'use client';

import React, { useState } from 'react';
import { ItemTypesService, MOCK_ITEM_TYPES } from '@/lib/itemTypesService';
import { ItemType } from '@/types/equipment';
// import { seedItemTypesCollection } from '@/scripts/seedItemTypes';

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
 * Admin component for seeding the itemTypes collection
 * Provides UI controls for populating and verifying the collection
 */
const ItemTypesSeeder: React.FC = () => {
  const [status, setStatus] = useState<SeedingStatus>({
    isSeeding: false,
    isVerifying: false,
    message: '',
    results: null
  });

  const [existingItems, setExistingItems] = useState<ItemType[]>([]);

  const handleSeedCollection = async () => {
    setStatus(prev => ({
      ...prev,
      isSeeding: true,
      message: 'Starting itemTypes collection seeding...',
      results: null
    }));

    try {
      // Check if collection is already populated
      const isEmpty = await ItemTypesService.isCollectionEmpty();
      
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
      const result = await ItemTypesService.seedItemTypes(MOCK_ITEM_TYPES);
      
      setStatus(prev => ({
        ...prev,
        isSeeding: false,
        message: `✅ Seeding completed! ${result.successful.length} successful, ${result.failed.length} failed`,
        results: {
          successful: result.successful.length,
          failed: result.failed.length,
          details: [
            ...result.successful.map(item => ({ id: item.itemType.id })),
            ...result.failed.map(item => ({ id: item.itemType.id, error: item.error }))
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
      message: 'Verifying itemTypes collection...'
    }));

    try {
      const items = await ItemTypesService.getAllItemTypes();
      setExistingItems(items);
      
      setStatus(prev => ({
        ...prev,
        isVerifying: false,
        message: `📋 Found ${items.length} item types in collection`
      }));

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isVerifying: false,
        message: `❌ Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🏗️ ItemTypes Collection Management
      </h3>
      
      <p className="text-gray-600 mb-6">
        Manage the equipment item types collection. This collection contains templates 
        for standard military equipment that can be used when creating new equipment entries.
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

      {/* Existing Items Display */}
      {existingItems.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800">
              📋 Current ItemTypes Collection ({existingItems.length} items)
            </h4>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {existingItems.map((item, index) => (
              <div key={item.id} className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <div className="text-gray-600 font-mono text-xs">{item.id}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Equipment:</span>
                    <div className="text-gray-600">{item.manufacturer} {item.model}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <div className="text-gray-600">{item.category}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assignment:</span>
                    <div className="text-gray-600">{item.assignmentType}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <span className="font-medium text-gray-700">Depot:</span>
                    <span className="text-gray-600 ml-1">{item.defaultDepot}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="text-gray-600 ml-1">{item.defaultStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mock Data Preview */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">
            📦 Mock Data Preview ({MOCK_ITEM_TYPES.length} items)
          </h4>
        </div>
        <div className="p-4">
          <div className="grid gap-3">
            {MOCK_ITEM_TYPES.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Equipment:</span>
                    <div className="text-gray-600">{item.manufacturer} {item.model}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="text-gray-600 ml-1">{item.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assignment:</span>
                    <span className="text-gray-600 ml-1">{item.assignmentType}</span>
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

export default ItemTypesSeeder;