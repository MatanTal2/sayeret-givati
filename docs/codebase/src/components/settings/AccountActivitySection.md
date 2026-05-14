# AccountActivitySection.tsx

**File:** `src/components/settings/AccountActivitySection.tsx`
**Status:** Active (Settings — Account Activity follow-up to PR-D)

## Purpose

Surfaces the signed-in user's `credentialAuditLog` inside the Settings page as a collapsible Headless UI `Disclosure`. The credential audit log is otherwise invisible to the user — this section is the user-facing read path for entries written by PR-B (`PASSWORD_CHANGED`), PR-C (`PHONE_CHANGED`), and PR-G (`ACCOUNT_DELETION_*`).

## Data flow

1. On mount (once `enhancedUser.uid` is known) calls `fetchCredentialAuditLog({ limit: 25 })` from `src/lib/credentialAuditClient.ts`.
2. The client wrapper calls `GET /api/auth/audit` (bearer-authed via `apiFetch`).
3. Server scopes the read to `actor.uid` and returns newest-first entries from `listCredentialAuditForUser`.
4. Component renders one row per entry with: event icon (lucide-react, per `EVENT_ICON` map), Hebrew label (per `EVENT_LABEL` map → `TEXT_CONSTANTS.SETTINGS.ACCOUNT_EVENT_*`), actor label (self vs. admin), formatted `he-IL` timestamp, and the `ip` + `userAgent` fields verbatim.

## States

| Branch | Trigger | Renders |
|--------|---------|---------|
| Loading (cold) | `loading && entries === null` | `ACCOUNT_ACTIVITY_LOADING` |
| Error | `error !== null` | error banner + retry button (`ACCOUNT_ACTIVITY_ERROR`/`RETRY`) |
| Empty | `entries.length === 0` | `ACCOUNT_ACTIVITY_EMPTY` |
| Populated | otherwise | divided `<ul>` of `<ActivityRow>` |

A spinning `RefreshCwIcon` button in the header allows manual reload regardless of state (disabled while in-flight). The disclosure header carries the entry count when known.

## Why ip + UA are surfaced to the user

This is intentional. The point of the section is to let the user spot foreign devices / sessions on their own account. Plaintext phone numbers are never returned (PR-C stores only SHA-256 hashes in `metadata`), so `metadata` is currently elided from the UI.

## Bilingual

Every visible string is keyed under `TEXT_CONSTANTS.SETTINGS.ACCOUNT_ACTIVITY_*` / `ACCOUNT_EVENT_*` (Hebrew) with mirrored entries in `TEXT_EN.SETTINGS.*` per `feedback_bilingual_text`.

## Related

- API: `docs/codebase/src/app/api/auth/audit/route.md` (GET section).
- Client wrapper: `src/lib/credentialAuditClient.ts` (`fetchCredentialAuditLog`).
- Service: `src/lib/db/server/credentialAuditService.ts` (`listCredentialAuditForUser`).
- Settings rollout: `project_settings_page.md`.
