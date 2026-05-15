'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import {
  listAmmunitionTemplates,
  subscribeAmmunitionTemplates,
} from '@/lib/ammunition/templatesService';
import type { AmmunitionType } from '@/types/ammunition';

export interface CreateAmmunitionTemplatePayload {
  name: string;
  description?: string;
  subcategory: AmmunitionType['subcategory'];
  allocation: AmmunitionType['allocation'];
  trackingMode: AmmunitionType['trackingMode'];
  securityLevel: AmmunitionType['securityLevel'];
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
  bulletsPerString?: number;
  stringsPerBruce?: number;
  status: AmmunitionType['status'];
}

export interface UseAmmunitionTemplatesReturn {
  templates: AmmunitionType[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: CreateAmmunitionTemplatePayload) => Promise<boolean>;
  update: (id: string, payload: CreateAmmunitionTemplatePayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useAmmunitionTemplates(): UseAmmunitionTemplatesReturn {
  const [templates, setTemplates] = useState<AmmunitionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct client-SDK listener replaces the previous API-route refetch
  // pattern. Rules allow authenticated read of `ammunitionTemplates`, so we
  // skip the server hop entirely — persistent cache + delta sync only.
  useEffect(() => {
    const unsub = subscribeAmmunitionTemplates(
      (rows) => {
        setTemplates(rows);
        setIsLoading(false);
      },
      (e) => {
        setError(e.message || 'שגיאה בטעינת תבניות תחמושת');
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const rows = await listAmmunitionTemplates();
      setTemplates(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    }
  }, []);

  const create = useCallback(async (payload: CreateAmmunitionTemplatePayload) => {
    try {
      const res = await apiFetch('/api/ammunition-templates', {
        method: 'POST',
        body: JSON.stringify({ payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'יצירת תבנית נכשלה');
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const update = useCallback(async (id: string, payload: CreateAmmunitionTemplatePayload) => {
    try {
      const res = await apiFetch(`/api/ammunition-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'עדכון תבנית נכשל');
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/ammunition-templates/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'מחיקת תבנית נכשלה');
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return false;
    }
  }, []);

  return { templates, isLoading, error, refresh, create, update, remove };
}
