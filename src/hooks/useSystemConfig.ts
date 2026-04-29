'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { SystemConfig } from '@/types/ammunition';
import type { ApiActor } from '@/lib/equipmentService';

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

export function useSystemConfig(): UseSystemConfigReturn {
  const { enhancedUser } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/system-config', { method: 'GET' });
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
      const actor = buildActor(enhancedUser);
      if (!actor) {
        setError('דרושה התחברות');
        return false;
      }
      setError(null);
      try {
        const res = await fetch('/api/system-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, payload }),
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
    [enhancedUser]
  );

  return { config, isLoading, error, save, refresh };
}
