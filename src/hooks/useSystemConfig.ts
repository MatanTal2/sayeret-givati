'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import type { SystemConfig } from '@/types/ammunition';

export interface SystemConfigSavePayload {
  ammoNotificationRecipientUserId?: string;
  teams?: string[];
}

export interface UseSystemConfigReturn {
  config: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
  save: (payload: SystemConfigSavePayload) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSystemConfig(): UseSystemConfigReturn {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/system-config', { method: 'GET' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'שגיאה בטעינת הגדרות מערכת');
      }
      setConfig(json.config ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (payload: SystemConfigSavePayload) => {
      setError(null);
      try {
        const res = await apiFetch('/api/system-config', {
          method: 'PUT',
          body: JSON.stringify({ payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'שגיאה בשמירת הגדרות');
        }
        setConfig(json.config ?? null);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
        return false;
      }
    },
    []
  );

  return { config, isLoading, error, save, refresh };
}
