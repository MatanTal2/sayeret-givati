'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { TEXT_CONSTANTS } from '@/constants/text';
import EquipmentErrorBoundary from '@/components/equipment/EquipmentErrorBoundary';
import EquipmentList from '@/components/equipment/EquipmentList';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';
import AddEquipmentModal from '@/components/equipment/AddEquipmentModal';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment } from '@/types/equipment';

/**
 * Equipment Page - צלם
 * Military equipment management with serial numbers
 * Step 1.2: Basic Equipment Interface Implementation
 */
export default function EquipmentPage() {
  const {
    equipment,
    loading,
    error,
    refreshEquipment,
    addEquipment,
  } = useEquipment();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEquipment();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle transfer (placeholder - will be implemented in future steps)
  const handleTransfer = (equipmentId: string) => {
    console.log('Transfer equipment:', equipmentId);
    // TODO: Open transfer modal/form in future steps
  };

  // Handle status update (placeholder - will be implemented in future steps)
  const handleUpdateStatus = (equipmentId: string) => {
    console.log('Update status:', equipmentId);
    // TODO: Open status update modal/form in future steps
  };

  // Handle view history (placeholder - will be implemented in future steps)
  const handleViewHistory = (equipmentId: string) => {
    console.log('View history:', equipmentId);
    // TODO: Open history modal/view in future steps
  };

  // Handle add equipment
  const handleAddEquipment = async (equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'history'>) => {
    try {
      await addEquipment(equipmentData);
      // Refresh the list to show the new equipment
      await refreshEquipment();
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  return (
    <AuthGuard>
      <EquipmentErrorBoundary>
        <div className="min-h-screen bg-gray-50" dir="rtl">
          {/* Header */}
          <Header 
            title={`🎖️ ${TEXT_CONSTANTS.FEATURES.EQUIPMENT.TITLE}`}
            subtitle={TEXT_CONSTANTS.FEATURES.EQUIPMENT.DESCRIPTION}
            showAuth={true}
          />

          {/* Main Content */}
          <main className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Page Controls */}
              <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    ➕ {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW}
                  </button>
                </div>
                <div>
                  {/* Development Badge */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    🚧 {TEXT_CONSTANTS.FEATURES.EQUIPMENT.STEP_INTERFACE_DEV}
                  </span>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 
                             disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
                             focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {loading || isRefreshing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.REFRESHING}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🔄</span>
                      <span>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.REFRESH}</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Equipment Content */}
              {loading && !equipment.length ? (
                <EquipmentLoadingState count={6} />
              ) : (
                <EquipmentList
                  equipment={equipment}
                  loading={loading}
                  error={error}
                  onTransfer={handleTransfer}
                  onUpdateStatus={handleUpdateStatus}
                  onViewHistory={handleViewHistory}
                  onRefresh={handleRefresh}
                />
              )}

              {/* Development Info */}
              <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                  <div className="text-blue-700">
                    <strong>🎯 Development Status:</strong> {TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_UI_COMPLETED}
                  </div>
                  <div className="text-blue-600">
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.NEXT_FORMS_ACTIONS}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Add Equipment Modal */}
          <AddEquipmentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddEquipment}
            loading={loading}
          />
        </div>
      </EquipmentErrorBoundary>
    </AuthGuard>
  );
}