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
  save: (payload: { ammoNotificationRecipientUserId?: string }) => Promise<boolean>;
  refresh: () => Promise<void>;
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

- `SystemConfigTab.tsx` (only consumer for now).
- Phase 4 ammunition report submit will read the recipient on the server, not
  via this hook.
