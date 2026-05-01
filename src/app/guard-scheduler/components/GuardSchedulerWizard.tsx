'use client';

import { useMemo, useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardSchedule } from '@/hooks/useGuardSchedule';
import type { GuardSchedule } from '@/types/guardSchedule';
import { useGuardSchedulerDraft, type GuardSchedulerDraft } from './useGuardSchedulerDraft';
import PostsEditor from './PostsEditor';
import PersonnelPicker from './PersonnelPicker';
import FreeTextNameInput from './FreeTextNameInput';
import ScheduleConfigForm from './ScheduleConfigForm';
import GeneratedScheduleTable from './GeneratedScheduleTable';
import ShareScheduleDialog from './ShareScheduleDialog';
import ExportPanel from './ExportPanel';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER;

const TABS = ['POSTS', 'PERSONNEL', 'CONFIG', 'PREVIEW', 'EXPORT'] as const;
type Tab = (typeof TABS)[number];

function defaultDraft(): GuardSchedulerDraft {
  const now = new Date();
  const start = new Date(now);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 12);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    version: 1,
    title: '',
    posts: [],
    roster: [],
    config: {
      startAt: fmt(start),
      endAt: fmt(end),
      shiftDurationHours: 2,
      algorithm: 'random_fair',
    },
  };
}

interface Props {
  initial?: GuardSchedule | null;
}

export default function GuardSchedulerWizard({ initial }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useGuardSchedulerDraft(
    initial
      ? {
          version: 1,
          title: initial.title,
          posts: initial.posts,
          roster: initial.roster,
          config: initial.config,
        }
      : defaultDraft(),
  );
  const [tab, setTab] = useState<Tab>('POSTS');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    schedule,
    working,
    savedId,
    generate,
    regenerate,
    manualSwap,
    lockAssignment,
    save,
    persistEdits,
    shareCopy,
    exportText,
    exportCsv,
  } = useGuardSchedule(initial?.id);

  // Auto-load existing draft into the working result on first preview without
  // forcing the user to go through the steps if they're editing a saved schedule.
  const canGenerate = draft.posts.length > 0 && draft.roster.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) {
      setGenerationError(
        draft.posts.length === 0 ? T.ERRORS.NO_POSTS : T.ERRORS.NO_ROSTER,
      );
      return;
    }
    if (draft.config.startAt >= draft.config.endAt) {
      setGenerationError(T.ERRORS.INVALID_DATES);
      return;
    }
    setGenerationError(null);
    generate({ posts: draft.posts, roster: draft.roster, config: draft.config });
    setTab('PREVIEW');
  };

  const handleSave = async (title: string): Promise<string> => {
    setSaving(true);
    try {
      const id = savedId ? '' : await save(title);
      if (savedId) {
        await persistEdits();
        return savedId;
      }
      return id;
    } finally {
      setSaving(false);
    }
  };

  const tabIndex = useMemo(() => TABS.indexOf(tab), [tab]);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2" aria-label="wizard">
        {TABS.map((step, i) => (
          <button
            key={step}
            type="button"
            onClick={() => setTab(step)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              i === tabIndex
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            aria-current={i === tabIndex ? 'step' : undefined}
          >
            {`${i + 1}. ${T.STEPS[step as keyof typeof T.STEPS]}`}
          </button>
        ))}
      </nav>

      {tab === 'POSTS' && (
        <PostsEditor
          posts={draft.posts}
          onChange={(posts) => setDraft({ ...draft, posts })}
        />
      )}

      {tab === 'PERSONNEL' && (
        <div className="space-y-6">
          <PersonnelPicker
            selected={draft.roster}
            onChange={(roster) => setDraft({ ...draft, roster })}
          />
          <FreeTextNameInput
            selected={draft.roster}
            onChange={(roster) => setDraft({ ...draft, roster })}
          />
          {draft.roster.length === 0 && (
            <p className="text-sm text-warning-600">{T.PERSONNEL.EMPTY}</p>
          )}
        </div>
      )}

      {tab === 'CONFIG' && (
        <div className="space-y-4">
          <ScheduleConfigForm
            config={draft.config}
            onChange={(config) => setDraft({ ...draft, config })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {`${T.STEPS.PREVIEW} ←`}
            </button>
            {generationError && (
              <p role="alert" className="text-sm text-danger-600">{generationError}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'PREVIEW' && working && (
        <GeneratedScheduleTable
          result={working}
          roster={draft.roster}
          onSwap={manualSwap}
          onLockToggle={lockAssignment}
          onRegenerateFresh={() => regenerate({ preserveLocks: false })}
          onRegenerateKeepLocks={() => regenerate({ preserveLocks: true })}
        />
      )}
      {tab === 'PREVIEW' && !working && !schedule && (
        <p className="text-sm text-neutral-500">{T.PREVIEW.EMPTY}</p>
      )}

      {tab === 'EXPORT' && (
        <ExportPanel
          title={draft.title}
          onTitleChange={(title) => setDraft({ ...draft, title })}
          buildText={(title) => exportText(title)}
          buildCsv={(title) => exportCsv(title)}
          onSave={handleSave}
          onShareClick={() => setShowShareDialog(true)}
          canSave={!!working}
          isSaved={!!savedId}
          saving={saving}
        />
      )}

      {showShareDialog && user?.uid && (
        <ShareScheduleDialog
          excludeUid={user.uid}
          onCancel={() => setShowShareDialog(false)}
          onConfirm={async (recipientUid) => {
            await shareCopy(recipientUid);
            setShowShareDialog(false);
          }}
        />
      )}
    </div>
  );
}
