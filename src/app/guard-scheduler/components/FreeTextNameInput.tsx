'use client';

import { useEffect, useMemo, useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { RosterPerson } from '@/types/guardSchedule';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.PERSONNEL;

interface Props {
  selected: RosterPerson[];
  onChange: (next: RosterPerson[]) => void;
}

function slugify(name: string): string {
  return `free-${name.replace(/\s+/g, '-')}`;
}

function parse(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export default function FreeTextNameInput({ selected, onChange }: Props) {
  const firestoreNames = useMemo(
    () => new Set(selected.filter((p) => p.source === 'firestore').map((p) => p.displayName.trim().toLowerCase())),
    [selected],
  );
  const initialText = useMemo(
    () =>
      selected
        .filter((p) => p.source === 'free_text')
        .map((p) => p.displayName)
        .join('\n'),
    // initial render only — keep textarea editable independent of upstream state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [text, setText] = useState(initialText);
  const [dedupedCount, setDedupedCount] = useState(0);

  useEffect(() => {
    const lines = parse(text);
    const before = lines.length;
    const filtered = lines.filter((name) => !firestoreNames.has(name.toLowerCase()));
    setDedupedCount(before - filtered.length);
    const freeTextPeople: RosterPerson[] = filtered.map((name) => ({
      id: slugify(name),
      source: 'free_text',
      displayName: name,
    }));
    const firestoreSelections = selected.filter((p) => p.source === 'firestore');
    onChange([...firestoreSelections, ...freeTextPeople]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <section className="space-y-2">
      <h3 className="text-base font-medium text-neutral-800">{T.FREE_TEXT_TITLE}</h3>
      <textarea
        className="input-base min-h-[120px]"
        placeholder={T.FREE_TEXT_PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-xs text-neutral-500">{T.FREE_TEXT_HINT}</p>
      {dedupedCount > 0 && (
        <p className="text-xs text-info-600">
          {T.DEDUP_NOTICE}: {dedupedCount}
        </p>
      )}
    </section>
  );
}
