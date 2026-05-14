'use client';

import { ReactNode } from 'react';

interface NotificationToggleRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}

/**
 * Single row in the Settings → Notifications section. Optimistic toggle that
 * the parent persists via PATCH /api/users/profile. `saving` reflects an
 * in-flight network call so the button visibly waits and ignores re-clicks.
 *
 * UI only — the toggled flag controls future delivery; nothing is sent today.
 */
export default function NotificationToggleRow({
  icon,
  title,
  description,
  enabled,
  saving,
  onToggle,
}: NotificationToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <h3 className="font-medium text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={onToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          saving ? 'cursor-wait opacity-60' : 'cursor-pointer'
        } ${enabled ? 'bg-primary-600' : 'bg-neutral-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
