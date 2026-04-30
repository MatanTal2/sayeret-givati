'use client';

import { useCallback, useEffect, useState } from 'react';
import { listPhoneBookEntries } from '@/lib/phoneBook/phoneBookService';
import type { PhoneBookEntry } from '@/types/phoneBook';

export interface UsePhoneBookReturn {
  entries: PhoneBookEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePhoneBook(): UsePhoneBookReturn {
  const [entries, setEntries] = useState<PhoneBookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listPhoneBookEntries();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בטעינת ספר טלפונים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, isLoading, error, refresh };
}
