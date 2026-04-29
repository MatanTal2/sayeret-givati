# useSystemConfig

**File:** `src/hooks/useSystemConfig.ts`
**Status:** Active (Phase 1 — Ammunition feature)

## Purpose

Client hook that reads `systemConfig/main` via the API and exposes a `save()`
helper for admin updates. Single source for the System Config tab.

## Return shape

```ts
{
  config: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
  save: (payload: SystemConfigSavePayload) => Promise<boolean>;
  refresh: () => Promise<void>;
}

interface SystemConfigSavePayload {
  ammoNotificationRecipientUserId?: string;
  teams?: string[];
}
```

## Behavior

- On mount: `GET /api/system-config` → populates `config`.
- `save(payload)`: builds an `ApiActor` from `useAuth().enhancedUser`, posts to
  `PUT /api/system-config`, replaces local `config` with the server's response.
  Returns `true` on success, `false` on any error (the message is stored in
  `error`).
- Returns `false` immediately if the user is not authenticated.

## API endpoints

- `GET /api/system-config` — public read for now (no actor required).
- `PUT /api/system-config` — admin-gated (`UserType.ADMIN | SYSTEM_MANAGER`).

## Consumers

- `SystemConfigPanel.tsx` (admin tab) — manages `teams[]`.
- `WelcomeModal.tsx` — reads `teams[]` to populate the onboarding dropdown.
- Phase 4 ammunition report submit will read the recipient on the server, not
  via this hook.

## Fields on `systemConfig/main`

- `ammoNotificationRecipientUserId: string` — recipient for ammunition alerts.
- `teams: string[]` — predefined team names. Source of the dropdown shown to
  users during onboarding (WelcomeModal). Edited in admin → System Config tab.
