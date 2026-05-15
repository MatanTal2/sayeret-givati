'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import {
  subscribeAmmunitionStock,
  subscribeSerialAmmunitionItems,
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

export interface AssignFromCentralPayload {
  templateId: string;
  target: { holderType: 'USER' | 'TEAM'; holderId: string };
  bruceCount?: number;
  quantity?: number;
  serials?: string[];
  note?: string;
}

export interface ReturnToCentralPayload {
  templateId: string;
  source: { holderType: 'USER' | 'TEAM'; holderId: string };
  bruceCount?: number;
  quantity?: number;
  serials?: string[];
  note?: string;
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
  assignFromCentral: (payload: AssignFromCentralPayload) => Promise<boolean>;
  returnToCentral: (payload: ReturnToCentralPayload) => Promise<boolean>;
}

export function useAmmunitionInventory(): UseAmmunitionInventoryReturn {
  const [stock, setStock] = useState<AmmunitionStock[]>([]);
  const [items, setItems] = useState<AmmunitionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Two onSnapshot listeners (stock + serial items). Persistent IndexedDB cache
  // paints initial state synchronously on cold mount and across navigations;
  // server deltas keep both lists current without per-mutation refetch.
  useEffect(() => {
    let gotStock = false;
    let gotItems = false;
    const finish = () => {
      if (gotStock && gotItems) setIsLoading(false);
    };

    const unsubStock = subscribeAmmunitionStock(
      (rows) => {
        setStock(rows);
        gotStock = true;
        finish();
      },
      (err) => {
        setError(err.message || 'שגיאה בטעינת מלאי');
        gotStock = true;
        finish();
      }
    );
    const unsubItems = subscribeSerialAmmunitionItems(
      (rows) => {
        setItems(rows);
        gotItems = true;
        finish();
      },
      (err) => {
        setError(err.message || 'שגיאה בטעינת מלאי');
        gotItems = true;
        finish();
      }
    );

    return () => {
      unsubStock();
      unsubItems();
    };
  }, []);

  // Force-resync escape hatch. Listener owns state; this exists for callers
  // that want an explicit one-shot read (e.g. after a corrupted cache).
  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [s, i] = await Promise.all([listAmmunitionStock(), listSerialAmmunitionItems()]);
      setStock(s);
      setItems(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת מלאי');
    }
  }, []);

  const upsertStock = useCallback(async (payload: UpsertStockPayload) => {
    try {
      const res = await apiFetch('/api/ammunition-inventory', {
        method: 'POST',
        body: JSON.stringify({ kind: 'stock', payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'עדכון מלאי נכשל');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const deleteStock = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ kind: 'stock' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'מחיקת מלאי נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const createSerialItem = useCallback(async (payload: CreateSerialItemPayload) => {
    try {
      const res = await apiFetch('/api/ammunition-inventory', {
        method: 'POST',
        body: JSON.stringify({ kind: 'item', payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'יצירת פריט נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const updateSerialItem = useCallback(
    async (serial: string, payload: UpdateSerialItemPayload) => {
      try {
        const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
          method: 'PUT',
          body: JSON.stringify({ kind: 'item', payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'עדכון פריט נכשל');
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    []
  );

  const deleteSerialItem = useCallback(async (serial: string) => {
    try {
      const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
        method: 'DELETE',
        body: JSON.stringify({ kind: 'item' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'מחיקת פריט נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const returnSerialItemToMgr = useCallback(async (serial: string) => {
    try {
      const res = await apiFetch(`/api/ammunition-inventory/${encodeURIComponent(serial)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'return-to-mgr' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'החזרה לאחראי תחמושת נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const assignFromCentral = useCallback(async (payload: AssignFromCentralPayload) => {
    try {
      const res = await apiFetch('/api/ammunition-inventory', {
        method: 'POST',
        body: JSON.stringify({ action: 'assign_from_central', payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'הקצאה ממלאי מרכזי נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const returnToCentral = useCallback(async (payload: ReturnToCentralPayload) => {
    try {
      const res = await apiFetch('/api/ammunition-inventory', {
        method: 'POST',
        body: JSON.stringify({ action: 'return_to_central', payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'החזרה למלאי מרכזי נכשלה');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

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
    assignFromCentral,
    returnToCentral,
  };
}
