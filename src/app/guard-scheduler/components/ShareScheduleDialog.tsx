'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { TEXT_CONSTANTS } from '@/constants/text';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.SHARE_DIALOG;

interface Props {
  excludeUid: string;
  onCancel: () => void;
  onConfirm: (recipientUid: string) => Promise<void>;
}

interface UserCandidate {
  uid: string;
  displayName: string;
}

export default function ShareScheduleDialog({ excludeUid, onCancel, onConfirm }: Props) {
  const [users, setUsers] = useState<UserCandidate[]>([]);
  const [search, setSearch] = useState('');
  const [pickedUid, setPickedUid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getDocs(query(collection(db, COLLECTIONS.USERS), orderBy('lastName')));
      const list = snap.docs
        .map((d) => {
          const data = d.data() as { firstName?: string; lastName?: string };
          const displayName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || d.id;
          return { uid: d.id, displayName };
        })
        .filter((u) => u.uid !== excludeUid);
      if (!cancelled) setUsers(list);
    })();
    return () => { cancelled = true; };
  }, [excludeUid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.displayName.toLowerCase().includes(q));
  }, [users, search]);

  const submit = async () => {
    if (!pickedUid) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(pickedUid);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="fixed left-1/2 top-1/2 z-50 w-[min(480px,90vw)] -translate-x-1/2 -translate-y-1/2 card-base p-5 modal-enter"
      >
        <h2 id="share-title" className="text-lg font-semibold text-neutral-900">{T.TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-600">{T.DESCRIPTION}</p>
        <input
          type="search"
          className="input-base mt-3"
          placeholder={T.SEARCH_PLACEHOLDER}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-200">
          {filtered.map((u) => (
            <li key={u.uid}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-neutral-50">
                <input
                  type="radio"
                  name="recipient"
                  value={u.uid}
                  checked={pickedUid === u.uid}
                  onChange={() => setPickedUid(u.uid)}
                />
                <span className="text-sm text-neutral-800">{u.displayName}</span>
              </label>
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="mt-2 text-sm text-danger-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>{T.CANCEL}</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!pickedUid || submitting}
            onClick={submit}
          >
            {T.SHARE}
          </button>
        </div>
      </div>
    </>
  );
}
