'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import {
  AlertCircleIcon,
  ChevronDownIcon,
  KeyIcon,
  MailIcon,
  PhoneIcon,
  RefreshCwIcon,
  ShieldOffIcon,
  TrashIcon,
  UndoIcon,
  UserPlusIcon,
  UserXIcon,
  ActivityIcon,
} from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { fetchCredentialAuditLog } from '@/lib/credentialAuditClient';
import type { CredentialAuditEntryWithId } from '@/lib/credentialAuditClient';
import type { CredentialAuditEventType } from '@/types/credentialAudit';
import { cn } from '@/lib/cn';

const EVENT_ICON: Record<CredentialAuditEventType, React.ComponentType<{ className?: string }>> = {
  ACCOUNT_CREATED: UserPlusIcon,
  PASSWORD_CHANGED: KeyIcon,
  PHONE_CHANGED: PhoneIcon,
  EMAIL_CHANGED: MailIcon,
  PHONE_FORCE_RESET: ShieldOffIcon,
  SESSIONS_REVOKED: UserXIcon,
  ACCOUNT_DELETION_REQUESTED: TrashIcon,
  ACCOUNT_DELETION_CANCELLED: UndoIcon,
  ACCOUNT_DELETED: TrashIcon,
};

const EVENT_LABEL: Record<CredentialAuditEventType, string> = {
  ACCOUNT_CREATED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_ACCOUNT_CREATED,
  PASSWORD_CHANGED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_PASSWORD_CHANGED,
  PHONE_CHANGED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_PHONE_CHANGED,
  EMAIL_CHANGED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_EMAIL_CHANGED,
  PHONE_FORCE_RESET: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_PHONE_FORCE_RESET,
  SESSIONS_REVOKED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_SESSIONS_REVOKED,
  ACCOUNT_DELETION_REQUESTED:
    TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_ACCOUNT_DELETION_REQUESTED,
  ACCOUNT_DELETION_CANCELLED:
    TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_ACCOUNT_DELETION_CANCELLED,
  ACCOUNT_DELETED: TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_ACCOUNT_DELETED,
};

function formatTimestamp(ts: Timestamp | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  try {
    const d = ts.toDate();
    return `${d.toLocaleDateString('he-IL')} ${d.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return '';
  }
}

/**
 * Renders the signed-in user's credential audit log inside a collapsible
 * disclosure. Reads from `GET /api/auth/audit` which scopes to the actor.
 *
 * The user is intentionally shown ip + user-agent for each entry so they
 * can recognise unfamiliar devices/sessions and escalate. Plaintext old/new
 * phone numbers are never returned by the API — only hashes — so the
 * metadata field is currently elided from the UI.
 */
export default function AccountActivitySection() {
  const { enhancedUser } = useAuth();
  const [entries, setEntries] = useState<CredentialAuditEntryWithId[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCredentialAuditLog({ limit: 25 });
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enhancedUser?.uid) return;
    load();
  }, [enhancedUser?.uid, load]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <Disclosure>
        {({ open }) => (
          <>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-100 rounded-lg">
                <ActivityIcon className="w-5 h-5 text-info-600" />
              </div>
              <DisclosureButton className="flex-1 flex items-center gap-2 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded">
                <h2 className="text-xl font-bold text-neutral-900">
                  {TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY}
                </h2>
                {entries && (
                  <span className="text-sm text-neutral-500">({entries.length})</span>
                )}
                <ChevronDownIcon
                  className={cn(
                    'w-5 h-5 text-neutral-500 transition-transform ms-auto',
                    open && 'rotate-180',
                  )}
                />
              </DisclosureButton>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="btn-ghost text-sm flex items-center gap-1 disabled:opacity-60"
                aria-label={TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_REFRESH}
                title={TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_REFRESH}
              >
                <RefreshCwIcon
                  className={cn('w-4 h-4', loading && 'animate-spin')}
                  aria-hidden="true"
                />
              </button>
            </div>

            <DisclosurePanel className="mt-4">
              <p className="text-sm text-neutral-600 mb-4">
                {TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_DESCRIPTION}
              </p>
              <AccountActivityBody
                entries={entries}
                loading={loading}
                error={error}
                onRetry={load}
                selfUid={enhancedUser?.uid}
              />
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
}

interface BodyProps {
  entries: CredentialAuditEntryWithId[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selfUid: string | undefined;
}

function AccountActivityBody({ entries, loading, error, onRetry, selfUid }: BodyProps) {
  if (loading && entries === null) {
    return (
      <div className="text-sm text-neutral-500 py-4 text-center">
        {TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_LOADING}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-4 border border-danger-200 rounded-xl bg-danger-50">
        <div className="flex items-center gap-2 text-sm text-danger-700">
          <AlertCircleIcon className="w-4 h-4" aria-hidden="true" />
          <span>{TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_ERROR}</span>
        </div>
        <button type="button" onClick={onRetry} className="btn-ghost text-sm text-danger-700">
          {TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_RETRY}
        </button>
      </div>
    );
  }
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 border border-dashed border-neutral-200 rounded-xl text-center">
        <ActivityIcon className="w-6 h-6 text-neutral-400" aria-hidden="true" />
        <p className="text-sm text-neutral-600">{TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_EMPTY}</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
      {entries.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} selfUid={selfUid} />
      ))}
    </ul>
  );
}

function ActivityRow({
  entry,
  selfUid,
}: {
  entry: CredentialAuditEntryWithId;
  selfUid: string | undefined;
}) {
  const Icon = EVENT_ICON[entry.eventType] ?? KeyIcon;
  const label = EVENT_LABEL[entry.eventType] ?? entry.eventType;
  const actorIsSelf = entry.actorUid === selfUid;
  const actorLabel = actorIsSelf
    ? TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_ACTOR_SELF
    : TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_ACTOR_ADMIN;
  const when = formatTimestamp(entry.timestamp);
  return (
    <li className="p-4 hover:bg-neutral-50">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-neutral-100 rounded-lg flex-shrink-0">
          <Icon className="w-4 h-4 text-neutral-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-neutral-900 text-sm">{label}</span>
            <span className="text-xs text-neutral-500">{actorLabel}</span>
          </div>
          {when && <div className="text-xs text-neutral-500 mt-0.5">{when}</div>}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500 mt-1">
            {entry.ip && (
              <span>
                <span className="font-medium">{TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_IP}:</span>{' '}
                <span className="font-mono">{entry.ip}</span>
              </span>
            )}
            {entry.userAgent && (
              <span className="truncate max-w-md" title={entry.userAgent}>
                <span className="font-medium">
                  {TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_DEVICE}:
                </span>{' '}
                {entry.userAgent}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
