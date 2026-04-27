'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchUsers, type UserSearchResult } from '@/lib/userService';

interface UserSearchInputProps {
  value: UserSearchResult | null;
  onChange: (user: UserSearchResult | null) => void;
  placeholder?: string;
  excludeUserIds?: string[];
}

export default function UserSearchInput({
  value,
  onChange,
  placeholder,
  excludeUserIds,
}: UserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (value || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchUsers(query, 10);
        const filtered = excludeUserIds
          ? found.filter((u) => !excludeUserIds.includes(u.uid))
          : found;
        setResults(filtered);
        setIsOpen(true);
      } catch (e) {
        console.error('User search failed', e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, value, excludeUserIds]);

  // Click-outside close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50">
        <div className="text-sm">
          <div className="font-medium text-neutral-900">{value.displayName}</div>
          <div className="text-xs text-neutral-500">{value.email}</div>
        </div>
        <button
          type="button"
          onClick={() => { onChange(null); setQuery(''); }}
          className="p-1 rounded-md text-neutral-500 hover:bg-neutral-200"
          aria-label="clear"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full ps-9 pe-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
        />
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searching && results.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500 text-center">...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500 text-center">אין תוצאות</div>
          ) : (
            results.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => { onChange(u); setIsOpen(false); setQuery(''); }}
                className="w-full text-start px-3 py-2 hover:bg-neutral-50 transition-colors"
              >
                <div className="text-sm font-medium text-neutral-900">{u.displayName}</div>
                <div className="text-xs text-neutral-500">{u.email}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
