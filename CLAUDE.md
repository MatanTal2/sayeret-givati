# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm test             # Run all Jest tests
npm run test:watch   # Jest in watch mode
npm run test:coverage # Jest with coverage report
```

To run a single test file:
```bash
npx jest src/lib/__tests__/adminUtils.test.ts
```

## Environment

Copy `ENV_SETUP.md` to `.env.local`. Required variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client SDK config
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `MESSAGING_SERVICE_SID` — OTP via SMS
- `GOOGLE_SHEETS_*` — optional, for daily status reporting

**Active infra blocker:** `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env.local` decodes to project `sayeret-givati` but the target is `sayeret-givati-1983`. Admin SDK paths are broken until a new service account key is generated from Firebase console.

## Architecture

Military equipment management system for Sayeret Givati. Hebrew RTL throughout (`<html lang="he" dir="rtl">`). Next.js 15 App Router, TypeScript, Firebase, Tailwind CSS, deployed to Vercel.

### Firestore access pattern

All Firestore reads use the **client SDK** (`db`, `auth` from `src/lib/firebase.ts`). There is no Server-side Firebase Admin SDK wired up yet — writes currently go through the same client SDK services. The `feature/refactor_firestorereadAndWrite` branch is building the server-write boundary (Server Actions → Admin SDK).

Firestore security rules are tightened locally but **not yet deployed** — run `firebase deploy --only firestore:rules` to activate them in production.

### Directory layout

| Path | Purpose |
|------|---------|
| `src/types/` | All TypeScript interfaces and enums (`equipment.ts`, `user.ts`, `admin.ts`, etc.) |
| `src/lib/` | Service layer — Firestore CRUD, business logic, utilities |
| `src/hooks/` | Custom React hooks that own component-level state and call lib services |
| `src/contexts/` | `AuthContext` (Firebase Auth + Firestore user profile), `NotificationContext` |
| `src/constants/` | Centralized config constants (collection names, admin config, text) |
| `src/data/` | Static data (equipment templates) |
| `src/app/` | Next.js App Router pages and layouts |
| `src/app/api/` | API routes: `auth/` (send-otp, verify-otp, register, verify-military-id), `sheets/` |
| `src/components/` | Shared UI components |
| `src/utils/` | Pure utility functions |

### Firestore collections

- `authorized_personnel` — pre-authorized soldiers (populated by admin before registration)
- `users` — registered user profiles (document ID = Firebase Auth UID)
- `equipmentTemplates` — equipment type definitions (templates)
- `equipment` — individual equipment items (document ID = serial number)
- `actionsLog` — audit trail for all mutations

### Auth flow

1. Registration: user provides military personal number → verified against `authorized_personnel` → Firebase Auth account created → user profile written to `users`
2. OTP: Twilio SMS via `/api/auth/send-otp` and `/api/auth/verify-otp` API routes
3. Session: `AuthContext` holds both the Firebase `User` and an `EnhancedAuthUser` (enriched with Firestore profile data)

### Equipment domain

Two-level model: `EquipmentType` (template in `equipmentTemplates`) and `Equipment` (item in `equipment`). The `Equipment.currentHolder` field stores a display name for UI; `Equipment.currentHolderId` stores the Firebase Auth UID for queries and permission checks.

### Testing

Jest with `ts-jest`, jsdom environment. Firebase is mocked at `src/lib/__mocks__/firebase.ts` — the `moduleNameMapper` in `jest.config.js` redirects all `firebase/*` imports to this mock for tests. Path alias `@/` maps to `src/`. Test files live in `src/lib/__tests__/`.

### Known open bugs (`docs/bugs.md`)

1. Name validation rejects `-` and `'` characters (CSV import and single-add)
2. Phone number input needs normalization (strip non-digits, collapse separators)
3. Admin panel update for `authorized_personnel` fields is partially implemented
4. `isRegistered` field not shown in admin panel list view

## Design & Style

**Single source of truth: `tailwind.config.js`** — all color, shadow, spacing, and animation tokens live here.

### Rules

- All colors must be referenced by Tailwind token key (e.g. `bg-primary-500`, `text-danger-600`) — no arbitrary values (`bg-[#7c3aed]`), no hardcoded hex in JSX.
- Colors not in the token system (e.g. `orange-*`) must be added to `tailwind.config.js` before use.
- For JS/TS contexts (Framer Motion, canvas, dynamic styles, tests) import from `src/constants/design.ts` — never copy hex values inline.
- Repeated multi-class patterns must use the `@layer components` classes defined in `globals.css` (`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `card-base`, `card-interactive`, `input-base`, `badge-base`, `modal-overlay`). Do not duplicate the pattern via `cn()` across files.
- RTL is set once on `<html dir="rtl">` in `src/app/layout.tsx`. Never add `dir="rtl"` to individual components. Prefer Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`) over `pl-`/`pr-`/`ml-`/`mr-` in new code.
- `src/lib/cn.ts` is the only permitted way to combine conditional class names.

### Token map (quick reference)

| Semantic use | Token |
|---|---|
| Brand / primary actions | `primary-500` (#7c3aed) through `primary-700` |
| Destructive / error | `danger-500` (#ef4444) through `danger-700` |
| Success / operational | `success-500` (#22c55e) |
| Warning / attention | `warning-500` (#f59e0b) |
| Informational | `info-500` (#3b82f6) |
| Neutral backgrounds | `neutral-50` / `neutral-100` |
| Neutral text | `neutral-700` / `neutral-900` |

Full token reference with all shades: `docs/design-system.md`

## Development Practices

- **File length:** any file exceeding 300 lines must be split into focused modules. Flag it in `docs/duplications.md`.
- **Firestore:** all reads and writes go through `src/lib/` service layer. No direct `getDoc`/`setDoc`/etc. calls in components or hooks.
- **Collection names:** must come from a constant — never a raw string. Currently defined per-service; central consolidation is tracked in `docs/duplications.md`.
- **Hebrew text:** all UI-visible strings live in `src/constants/text.ts`. No inline Hebrew strings in components.
- **Hooks pattern:** new hooks must follow the established `{ data, isLoading, error }` return shape used in `useEquipment`, `useUsers`, etc.
- **Test location:** `src/lib/__tests__/` for service/utility tests; `src/components/<domain>/__tests__/` for component tests.
- **No backward-compatibility shims:** delete dead code, rename freely, change APIs completely.
