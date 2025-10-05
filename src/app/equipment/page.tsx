'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { TEXT_CONSTANTS } from '@/constants/text';
import EquipmentErrorBoundary from '@/components/equipment/EquipmentErrorBoundary';
import EquipmentList from '@/components/equipment/EquipmentList';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';
import EquipmentModal from '@/components/equipment/EquipmentModal';
import TransferModal from '@/components/equipment/TransferModal';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment, EquipmentAction } from '@/types/equipment';
import { useAuth } from '@/contexts/AuthContext';
import { hasEquipmentManagementAccess, getUserPermissionLevel } from '@/utils/permissionUtils';
import { EquipmentService } from '@/lib/equipmentService';

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

  const { enhancedUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Permission checks
  const canManageEquipment = hasEquipmentManagementAccess(enhancedUser);
  const userPermissionLevel = getUserPermissionLevel(enhancedUser);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEquipment();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle transfer - open transfer modal
  const handleTransfer = async (equipmentId: string) => {
    const equipmentItem = equipment.find(item => item.id === equipmentId);
    if (equipmentItem) {
      setSelectedEquipment(equipmentItem);
      setShowTransferModal(true);
    }
  };

  // Handle transfer success
  const handleTransferSuccess = () => {
    setShowTransferModal(false);
    setSelectedEquipment(null);
    refreshEquipment(); // Refresh the equipment list
  };

  // Handle status update - open update modal
  const handleUpdateStatus = async (equipmentId: string) => {
    const equipmentToUpdate = equipment.find(item => item.id === equipmentId);
    if (equipmentToUpdate) {
      setSelectedEquipment(equipmentToUpdate);
      setShowUpdateModal(true);
    }
  };

  // Handle view history (placeholder - will be implemented in future steps)
  const handleViewHistory = (equipmentId: string) => {
    console.log('View history:', equipmentId);
    // TODO: Open history modal/view in future steps
  };

  // Handle credit equipment (placeholder - will be implemented in future steps)
  const handleCredit = (equipmentId: string) => {
    console.log('Credit equipment:', equipmentId);
    // TODO: Open credit modal/form in future steps
    // This action should clear/credit the equipment from the current holder
  };

  // Handle add equipment
  const handleAddEquipment = async (equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>) => {
    try {
      // For now, use the current user as the signer (in production, get from auth context)
      const signedBy = 'מנהל-מערכת'; // TODO: Get from authentication context
      const success = await addEquipment(equipmentData, signedBy);
      if (!success) {
        throw new Error('Failed to add equipment');
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Handle update equipment
  const handleUpdateEquipment = async (equipmentId: string, updates: Partial<Equipment>) => {
    try {
      if (!enhancedUser) {
        throw new Error('User not authenticated');
      }

      const updatedBy = enhancedUser.uid;
      const updatedByName = `${enhancedUser.firstName || ''} ${enhancedUser.lastName || ''}`.trim();
      const userType = enhancedUser.userType?.toLowerCase();
      
      // Call the equipment service to update
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId,
        updates,
        updatedBy,
        updatedByName,
        EquipmentAction.STATUS_UPDATE, // Default action, could be made dynamic
        'Equipment updated via form', // Default notes
        userType
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to update equipment');
      }
      
      // Refresh the equipment list to show updated data
      await refreshEquipment();
      
      // Close the modal
      setShowUpdateModal(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  return (
    <AuthGuard>
      <EquipmentErrorBoundary>
        <div className="min-h-screen bg-neutral-50" dir="rtl">
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
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    ➕ {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW}
                  </button>
                </div>
                <div>
                  {/* Development Badge */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    🚧 {TEXT_CONSTANTS.FEATURES.EQUIPMENT.STEP_INTERFACE_DEV}
                  </span>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 
                             disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors
                             focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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

              {/* Development Tools */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-info-50 border border-info-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-info-800 mb-2">🧪 כלי פיתוח</h3>
                  <div className="space-y-2">
                    <a
                      href="/test-dashboard"
                      className="inline-block bg-info-600 text-white px-4 py-2 rounded-md hover:bg-info-700 transition-colors"
                    >
                      🚀 מרכז בדיקות מערכת
                    </a>
                    <p className="text-sm text-info-700">
                      ממשק מאוחד לכל בדיקות המערכת - ציוד, מסד נתונים, ואבטחה
                    </p>
                    {/* Permission Debug Info */}
                    <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-md">
                      <h4 className="font-medium text-warning-800 mb-1">🔒 מידע הרשאות</h4>
                      <div className="text-sm text-warning-700 space-y-1">
                        <p><strong>משתמש:</strong> {enhancedUser?.firstName} {enhancedUser?.lastName}</p>
                        <p><strong>סוג משתמש:</strong> {enhancedUser?.userType || 'לא מוגדר'}</p>
                        <p><strong>רמת הרשאה:</strong> {userPermissionLevel}</p>
                        <p><strong>יכול לנהל ציוד:</strong> {canManageEquipment ? '✅ כן' : '❌ לא'}</p>
                        <p className="text-xs mt-2">
                          רק משתמשים מסוג admin, system_manager, או manager יכולים להעביר/לעדכן ציוד בטאב &quot;ציוד נוסף&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  onCredit={handleCredit}
                  onRefresh={handleRefresh}
                />
              )}

              {/* Development Info */}
              <div className="mt-12 p-4 bg-info-50 border border-info-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                  <div className="text-info-700">
                    <strong>🎯 Development Status:</strong> {TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_UI_COMPLETED}
                  </div>
                  <div className="text-info-600">
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.NEXT_FORMS_ACTIONS}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Add Equipment Modal */}
          <EquipmentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddEquipment}
            loading={loading}
            mode="create"
          />

          {/* Update Equipment Modal */}
          <EquipmentModal
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
              setSelectedEquipment(null);
            }}
            onUpdate={handleUpdateEquipment}
            loading={loading}
            mode="update"
            existingEquipment={selectedEquipment || undefined}
          />

          {/* Transfer Equipment Modal */}
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => {
              setShowTransferModal(false);
              setSelectedEquipment(null);
            }}
            equipment={selectedEquipment}
            onTransferSuccess={handleTransferSuccess}
          />
        </div>
      </EquipmentErrorBoundary>
    </AuthGuard>
  );
}