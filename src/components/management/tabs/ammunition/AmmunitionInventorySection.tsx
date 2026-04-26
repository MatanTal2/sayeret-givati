'use client';

import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import AmmunitionInventoryView from '@/components/ammunition/AmmunitionInventoryView';
import AddInventoryModal from '@/components/ammunition/AddInventoryModal';
import type { HolderType } from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

export default function AmmunitionInventorySection() {
  const { enhancedUser } = useAuth();
  const { templates } = useAmmunitionTemplates();
  const {
    stock,
    items,
    isLoading,
    error,
    upsertStock,
    deleteStock,
    createSerialItem,
    deleteSerialItem,
  } = useAmmunitionInventory();
  const [showAdd, setShowAdd] = useState(false);

  const isAdminOrManager =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const canMutate = (entry: { templateId: string; holderType: HolderType; holderId: string }) => {
    if (!enhancedUser) return false;
    if (isAdminOrManager) return true;
    if (enhancedUser.userType === UserType.TEAM_LEADER) {
      if (entry.holderType === 'TEAM') return entry.holderId === enhancedUser.teamId;
      return true;
    }
    return entry.holderType === 'USER' && entry.holderId === enhancedUser.uid;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setShowAdd(true)} disabled={templates.length === 0}>
          <Plus className="w-4 h-4 ms-1" /> {T.ADD_NEW}
        </Button>
        <span className="text-xs text-neutral-500">
          סה&quot;כ {stock.length + items.length} רשומות
        </span>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : (
        <AmmunitionInventoryView
          templates={templates}
          stock={stock}
          items={items}
          showHolder
          canMutate={canMutate}
          onDeleteStock={(id) => deleteStock(id)}
          onDeleteItem={(serial) => deleteSerialItem(serial)}
        />
      )}

      {showAdd && (
        <AddInventoryModal
          templates={templates}
          allowHolderPicker
          onClose={() => setShowAdd(false)}
          onSubmitStock={async (payload) => upsertStock(payload)}
          onSubmitItem={async (payload) => createSerialItem(payload)}
        />
      )}
    </div>
  );
}
