'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import { getGuardSchedule } from '@/lib/db/guardScheduleClient';
import type { GuardSchedule } from '@/types/guardSchedule';
import GuardSchedulerWizard from '../components/GuardSchedulerWizard';

export default function GuardSchedulerByIdPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [schedule, setSchedule] = useState<GuardSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const got = await getGuardSchedule(id);
        if (!got) throw new Error('Schedule not found');
        if (!cancelled) setSchedule(got);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <AuthGuard>
      <AppShell
        title={schedule?.title || TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE}
        subtitle={TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.SUBTITLE}
        showBackArrow
      >
        <div className="mx-auto max-w-5xl py-4">
          {loading && <p className="text-sm text-neutral-500">…</p>}
          {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
          {schedule && <GuardSchedulerWizard initial={schedule} />}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
