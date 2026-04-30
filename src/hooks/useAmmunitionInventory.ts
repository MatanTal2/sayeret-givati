'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
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
  returnSerialItemToMgr: (serial: string) => Promise<boolean>;
}

export function useAmmunitionInventory(): UseAmmunitionInventoryReturn {
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
      try {
        const res = await apiFetch('/api/ammunition-inventory', {
          method: 'POST',
          body: JSON.stringify({ kind: 'stock', payload }),
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
    [refresh]
  );

  const deleteStock = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          body: JSON.stringify({ kind: 'stock' }),
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
    [refresh]
  );

  const createSerialItem = useCallback(
    async (payload: CreateSerialItemPayload) => {
      try {
        const res = await apiFetch('/api/ammunition-inventory', {
          method: 'POST',
          body: JSON.stringify({ kind: 'item', payload }),
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
    [refresh]
  );

  const updateSerialItem = useCallback(
    async (serial: string, payload: UpdateSerialItemPayload) => {
      try {
        const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'PUT',
          body: JSON.stringify({ kind: 'item', payload }),
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
    [refresh]
  );

  const deleteSerialItem = useCallback(
    async (serial: string) => {
      try {
        const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'DELETE',
          body: JSON.stringify({ kind: 'item' }),
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
    [refresh]
  );

  const returnSerialItemToMgr = useCallback(
    async (serial: string) => {
      try {
        const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'return-to-mgr' }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'החזרה לאחראי תחמושת נכשלה');
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [refresh]
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
    returnSerialItemToMgr,
  };
}
