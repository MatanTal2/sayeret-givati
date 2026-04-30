'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
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

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/ammunition-templates');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'שגיאה בטעינת תבניות תחמושת');
      }
      setTemplates(json.templates || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: CreateAmmunitionTemplatePayload) => {
      try {
        const res = await apiFetch('/api/ammunition-templates', {
          method: 'POST',
          body: JSON.stringify({ payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'יצירת תבנית נכשלה');
        }
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, payload: CreateAmmunitionTemplatePayload) => {
      try {
        const res = await apiFetch(`/api/ammunition-templates/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'עדכון תבנית נכשל');
        }
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch(`/api/ammunition-templates/${id}`, {
          method: 'DELETE',
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'מחיקת תבנית נכשלה');
        }
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    [refresh]
  );

  return { templates, isLoading, error, refresh, create, update, remove };
}
