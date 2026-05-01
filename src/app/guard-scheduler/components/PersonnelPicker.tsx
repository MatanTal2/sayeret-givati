'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { RosterPerson } from '@/types/guardSchedule';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.PERSONNEL;

interface UserCandidate {
  uid: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
}

interface Props {
  selected: RosterPerson[];
  onChange: (next: RosterPerson[]) => void;
}

function userToPerson(u: UserCandidate): RosterPerson {
  const displayName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.uid;
  return {
    id: u.uid,
    source: 'firestore',
    displayName,
    ...(u.firstName ? { firstName: u.firstName } : {}),
    ...(u.lastName ? { lastName: u.lastName } : {}),
    ...(u.rank ? { rank: u.rank } : {}),
  };
}

export default function PersonnelPicker({ selected, onChange }: Props) {
  const [users, setUsers] = useState<UserCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, COLLECTIONS.USERS), orderBy('lastName')));
        const list: UserCandidate[] = snap.docs.map((d) => {
          const data = d.data() as UserCandidate;
          return {
            uid: d.id,
            ...(data.firstName ? { firstName: data.firstName } : {}),
            ...(data.lastName ? { lastName: data.lastName } : {}),
            ...(data.rank ? { rank: data.rank } : {}),
          };
        });
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedIds = useMemo(() => new Set(selected.filter((p) => p.source === 'firestore').map((p) => p.id)), [selected]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q.toLowerCase()),
    );
  }, [users, search]);

  const toggle = (u: UserCandidate) => {
    if (selectedIds.has(u.uid)) {
      onChange(selected.filter((p) => !(p.source === 'firestore' && p.id === u.uid)));
    } else {
      onChange([...selected, userToPerson(u)]);
    }
  };

  const firestoreSelectedCount = selectedIds.size;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-neutral-800">{T.PICK_FROM_USERS}</h3>
        <span className="text-sm text-neutral-600">
          {T.SELECTED_COUNT.replace('{count}', String(firestoreSelectedCount))}
        </span>
      </div>
      <input
        type="search"
        className="input-base"
        placeholder={T.SEARCH_PLACEHOLDER}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="card-base max-h-72 overflow-y-auto p-2">
        {loading && <p className="p-2 text-sm text-neutral-500">…</p>}
        {!loading && filtered.length === 0 && (
          <p className="p-2 text-sm text-neutral-500">—</p>
        )}
        <ul className="divide-y divide-neutral-100">
          {filtered.map((u) => {
            const checked = selectedIds.has(u.uid);
            const display = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.uid;
            return (
              <li key={u.uid}>
                <label className="flex cursor-pointer items-center gap-2 px-2 py-2 hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(u)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-800">{display}</span>
                  {u.rank && <span className="text-xs text-neutral-500">· {u.rank}</span>}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
