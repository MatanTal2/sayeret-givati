'use client';

import React, { useMemo, useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { Select } from '@/components/ui';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { usePhoneBook } from '@/hooks/usePhoneBook';
import { UserType } from '@/types/user';
import type { PhoneBookEntry } from '@/types/phoneBook';

const T = TEXT_CONSTANTS.FEATURES.PHONE_BOOK;
const ROLE_LABEL: Record<UserType, string> = {
  [UserType.ADMIN]: TEXT_CONSTANTS.PROFILE.ADMIN,
  [UserType.SYSTEM_MANAGER]: TEXT_CONSTANTS.PROFILE.SYSTEM_MANAGER,
  [UserType.MANAGER]: TEXT_CONSTANTS.PROFILE.MANAGER,
  [UserType.TEAM_LEADER]: TEXT_CONSTANTS.PROFILE.TEAM_LEADER,
  [UserType.USER]: TEXT_CONSTANTS.PROFILE.USER,
};

function initials(entry: PhoneBookEntry): string {
  const first = entry.firstName?.charAt(0) ?? '';
  const last = entry.lastName?.charAt(0) ?? '';
  const result = `${first}${last}`.trim();
  if (result) return result;
  return entry.displayName.charAt(0) || '?';
}

export default function PhoneBookPage() {
  return (
    <AuthGuard>
      <AppShell title={`📞 ${T.TITLE}`} subtitle={T.DESCRIPTION}>
        <PhoneBookContent />
      </AppShell>
    </AuthGuard>
  );
}

function PhoneBookContent() {
  const { entries, isLoading, error } = usePhoneBook();
  const { config: systemConfig } = useSystemConfig();
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState<string | null>(null);
  const [role, setRole] = useState<UserType | null>(null);

  const teamOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const t of systemConfig?.teams ?? []) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push({ value: t, label: t });
      }
    }
    for (const e of entries) {
      if (e.teamId && !seen.has(e.teamId)) {
        seen.add(e.teamId);
        out.push({ value: e.teamId, label: e.teamId });
      }
    }
    return out;
  }, [systemConfig?.teams, entries]);

  const roleOptions = useMemo(
    () =>
      [
        UserType.ADMIN,
        UserType.SYSTEM_MANAGER,
        UserType.MANAGER,
        UserType.TEAM_LEADER,
        UserType.USER,
      ].map((r) => ({ value: r, label: ROLE_LABEL[r] })),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (team && e.teamId !== team) return false;
      if (role && e.userType !== role) return false;
      if (q) {
        const hay = [
          e.displayName,
          e.firstName ?? '',
          e.lastName ?? '',
          e.phoneNumber ?? '',
          e.email ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, team, role]);

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-1 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T.SEARCH_PLACEHOLDER}
            className="w-full ps-9 pe-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Select
          value={team}
          onChange={(v) => setTeam(v)}
          options={teamOptions}
          placeholder={T.FILTER_TEAM_ALL}
          clearable
          ariaLabel={T.FILTER_TEAM}
        />
        <Select<UserType>
          value={role}
          onChange={(v) => setRole(v)}
          options={roleOptions}
          placeholder={T.FILTER_ROLE_ALL}
          clearable
          ariaLabel={T.FILTER_ROLE}
        />
      </div>

      <div className="text-xs text-neutral-500">
        {T.TOTAL.replace('{count}', String(filtered.length))}
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">{T.LOADING}</div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
          {T.EMPTY}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
          {T.EMPTY_FILTERED}
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-white">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_NAME}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_PHONE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_TEAM}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_ROLE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_EMAIL}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((e) => (
                <tr key={e.id} className={e.isRegistered ? 'hover:bg-neutral-50' : 'hover:bg-neutral-50 opacity-80'}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar entry={e} />
                      <div>
                        <div className="text-neutral-900">{e.displayName}</div>
                        {!e.isRegistered && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {T.UNREGISTERED_BADGE}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">
                    {e.phoneNumber ? (
                      <a className="text-primary-600 hover:underline" href={`tel:${e.phoneNumber}`}>
                        {e.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">{e.teamId || '—'}</td>
                  <td className="px-3 py-2">
                    {e.userType ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700">
                        {ROLE_LABEL[e.userType]}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {e.email ? (
                      <a className="text-primary-600 hover:underline" href={`mailto:${e.email}`}>
                        {e.email}
                      </a>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Avatar({ entry }: { entry: PhoneBookEntry }) {
  if (entry.photoURL) {
    return (
      <span
        role="img"
        aria-label={entry.displayName}
        style={{ backgroundImage: `url(${entry.photoURL})` }}
        className="w-8 h-8 rounded-full bg-cover bg-center border border-neutral-200 inline-block"
      />
    );
  }
  const init = initials(entry);
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium border border-primary-200">
      {init || <UserIcon className="w-4 h-4" />}
    </div>
  );
}
