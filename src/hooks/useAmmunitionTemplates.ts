'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { AmmunitionType } from '@/types/ammunition';
import type { ApiActor } from '@/lib/equipmentService';

export interface CreateAmmunitionTemplatePayload {
  name: string;
  description?: string;
  subcategory: AmmunitionType['subcategory'];
  allocation: AmmunitionType['allocation'];
  trackingMode: AmmunitionType['trackingMode'];
  securityLevel: AmmunitionType['securityLevel'];
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
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
  seedCanonical: () => Promise<{ created: number; skipped: number } | null>;
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

export function useAmmunitionTemplates(): UseAmmunitionTemplatesReturn {
  const { enhancedUser } = useAuth();
  const [templates, setTemplates] = useState<AmmunitionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ammunition-templates');
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
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch('/api/ammunition-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, payload }),
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
    [enhancedUser, refresh]
  );

  const update = useCallback(
    async (id: string, payload: CreateAmmunitionTemplatePayload) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch(`/api/ammunition-templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, payload }),
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
    [enhancedUser, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const actor = buildActor(enhancedUser);
      if (!actor) return false;
      try {
        const res = await fetch(`/api/ammunition-templates/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor }),
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
    [enhancedUser, refresh]
  );

  const seedCanonical = useCallback(async () => {
    const actor = buildActor(enhancedUser);
    if (!actor) return null;
    try {
      const res = await fetch('/api/ammunition-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, action: 'seed_canonical' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'זריעת תבניות קנוניות נכשלה');
      }
      await refresh();
      return { created: json.created ?? 0, skipped: json.skipped ?? 0 };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
      return null;
    }
  }, [enhancedUser, refresh]);

  return { templates, isLoading, error, refresh, create, update, remove, seedCanonical };
}
