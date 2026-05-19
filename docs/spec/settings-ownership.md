# Settings ownership: `/admin` vs `/management`

The project has two settings surfaces:

- `/admin` — owned by ADMIN and SYSTEM_MANAGER. Touches identity boundaries (who is allowed to register, how identity-bearing fields are shaped).
- `/management` — owned by MANAGER (and ADMIN / SYSTEM_MANAGER, who can do everything). Touches day-to-day operations (rounds, ammo recipient list, equipment templates).

Historically the ammo-recipient editor was duplicated on both surfaces — admins were managing an operational setting because the management UI did not exist yet. As of the multi-recipient migration (`feat/ammo-multi-recipient-and-settings-split`) it lives **only** on `/management`. Use the matrix below to decide where a new setting belongs before you start coding.

## Matrix

| Setting | Route | Why |
|---|---|---|
| `systemConfig.teams` | `/admin` | Identity/onboarding boundary — registration validates the user's team against this list. |
| `authorized_personnel` | `/admin` | Pre-registration allowlist; gated by hash of military personal number. |
| `systemConfig.ammoNotificationRecipientUserIds` | `/management` | Operational — managers own ammo lifecycle (reports + training plan approvals). |
| `systemConfig.roundOpen` | `/management` | Operational — managers run rounds and toggle this at start/end. |
| Equipment templates (`equipmentTemplates`) | `/management` | Operational catalog. |
| Logistics templates (`logisticsTemplates`) | `/management` | Operational catalog. |
| Permission grants (`permissionGrants`) | `/management` | Operational delegation; admins still grant top-level roles via `/admin`. |
| Ammo templates (`ammunitionTemplates`) | `/management` | Operational catalog. |

## Reasoning

Two short rules of thumb:

1. **Identity / who-can-get-in → `/admin`.** If the setting decides whether someone can sign up, what high-level role they carry, or what the system uses to recognise them, it belongs on `/admin`.
2. **Operations / how-we-run-the-unit → `/management`.** If the setting describes how today's work runs (rounds, what equipment exists, who approves an ammo report), it belongs on `/management`.

When you can't classify cleanly, prefer `/management`. It's the surface that day-to-day operators see; admins always have visibility there too.

## Future-additions checklist

Before adding a new setting to `systemConfig` or anywhere on the two surfaces:

- [ ] Identify the user type that should *own* the setting (admin vs manager).
- [ ] Place the UI on the corresponding surface only — no duplicates.
- [ ] Add a row to the matrix above.
- [ ] If the setting is conceptually an operational primitive that admins might also need, expose a *read-only* mirror on `/admin` rather than a second edit path.
