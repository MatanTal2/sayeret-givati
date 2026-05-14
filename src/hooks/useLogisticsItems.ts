'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LogisticsItem } from '@/types/logistics';
import { listLogisticsItems } from '@/lib/logistics/itemsRepository';

export interface UseLogisticsItemsReturn {
  data: LogisticsItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLogisticsItems(): UseLogisticsItemsReturn {
  const [data, setData] = useState<LogisticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listLogisticsItems();
      setData(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
