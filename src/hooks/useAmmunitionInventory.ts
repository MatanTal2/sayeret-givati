'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAmmunitionStock,
  listSerialAmmunitionItems,
} from '@/lib/ammunition/inventoryService';
import type {
  AmmunitionItem,
  AmmunitionItemStatus,
  AmmunitionStock,
  BruceState,
  HolderType,
} from '@/types/ammunition';
import type { ApiActor } from '@/lib/equipmentService';

export interface UpsertStockPayload {
  templateId: string;
  holderType: HolderType;
  holderId: string;
  bruceCount?: number;
  openBruceState?: BruceState;
  quantity?: number;
}

export interface CreateSerialItemPayload {
  serial: string;
  templateId: string;
  holderType: HolderType;
  holderId: string;
}

export interface UpdateSerialItemPayload {
  newHolderType?: HolderType;
  newHolderId?: string;
  newStatus?: AmmunitionItemStatus;
}

export interface UseAmmunitionInventoryReturn {
  stock: AmmunitionStock[];
  items: AmmunitionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upsertStock: (payload: UpsertStockPayload) => Promise<boolean>;
  deleteStock: (id: string) => Promise<boolean>;
  createSerialItem: (payload: CreateSerialItemPayload) => Promise<boolean>;
  updateSerialItem: (serial: string, payload: UpdateSerialItemPayload) => Promise<boolean>;
  deleteSerialItem: (serial: string) => Promise<boolean>;
}

function buildActor(
  user: ReturnType<typeof useAuth>['enhancedUser']
): ApiActor | null {
  if (!user || !user.userType) return null;
  return {
    uid: user.uid,
    userType: user.userType,
    teamId: user.teamId,
    displayName:
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      undefined,
  };
}

export function useAmmunitionInventory(): UseAmmunitionInventoryReturn {
  const { enhancedUser } = useAuth();
  const [stock, setStock] = useState<AmmunitionStock[]>([]);
  const [items, setItems] = useState<AmmunitionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [s, i] = await Promise.all([
        listAmmunitionStock(),
        listSerialAmmunitionItems(),
      ]);
      setStock(s);
      setItems(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת מלאי');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsertStock = useCallback(
    async (payload: UpsertStockPayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch('/api/ammunition-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, kind: 'stock', payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'עדכון מלאי נכשל');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  const deleteStock = useCallback(
    async (id: string) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch(`/api/ammunition-inventory/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, kind: 'stock' }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'מחיקת מלאי נכשלה');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  const createSerialItem = useCallback(
    async (payload: CreateSerialItemPayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch('/api/ammunition-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, kind: 'item', payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'יצירת פריט נכשלה');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  const updateSerialItem = useCallback(
    async (serial: string, payload: UpdateSerialItemPayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, kind: 'item', payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'עדכון פריט נכשל');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  const deleteSerialItem = useCallback(
    async (serial: string) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, kind: 'item' }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'מחיקת פריט נכשלה');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [enhancedUser, refresh]
  );

  return {
    stock,
    items,
    isLoading,
    error,
    refresh,
    upsertStock,
    deleteStock,
    createSerialItem,
    updateSerialItem,
    deleteSerialItem,
  };
}
