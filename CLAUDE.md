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

OTP is provided by Firebase Phone Auth (no env vars). Phone provider must be enabled in Firebase Console → Authentication → Sign-in method, and the project must be on the Blaze plan. Add a test phone number in the console for local dev / CI.

`GOOGLE_SERVICE_ACCOUNT_JSON` — base64-encoded service account key for `sayeret-givati-1983`. Used by `firebase-admin` in API routes (`src/lib/db/admin.ts`). Must be a single line in `.env.local` with no line breaks.

## Architecture

Military equipment management system for Sayeret Givati. Hebrew RTL throughout (`<html lang="he" dir="rtl">`). Next.js 15 App Router, TypeScript, Firebase, Tailwind CSS, deployed to Vercel.

### Firestore access pattern

**Current:** All reads and writes use the **client SDK** (`db`, `auth` from `src/lib/firebase.ts`). No server-side Firebase Admin SDK is wired up yet.

**Target (in progress on `feature/refactor_firestorereadAndWrite`):** Hybrid architecture — writes via `firebase-admin` Server Actions, reads via client SDK. Migration plan and step-by-step order in `docs/spec/firestore-refactor.md`.

Service account key targets `sayeret-givati-1983` (matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID`). Admin SDK is functional.

Firestore security rules in `firebase/firestore.rules` are deployed and in sync with the production project — verify with `firebase deploy --only firestore:rules` (no-op if already in sync).

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
| `src/app/api/` | API routes: `auth/` (register, verify-military-id, check-email-verified), `soldier-status/` |
| `src/components/` | Shared UI components |
| `src/utils/` | Pure utility functions |

### Firestore collections

- `authorized_personnel` — pre-authorized soldiers (populated by admin before registration)
- `users` — registered user profiles (document ID = Firebase Auth UID)
- `equipmentTemplates` — equipment type definitions (templates)
- `equipment` — individual equipment items (document ID = serial number)
- `actionsLog` — audit trail for all mutations
- `soldierStatus` — daily status annotation per soldier (doc ID = `militaryPersonalNumberHash`, matches `authorized_personnel` doc ID). Body: `{ status: 'בית' | 'משמר' | 'אחר', customStatus?, updatedAt }`. Audit + history fields intentionally deferred. Roster (name, platoon) is joined at read time from `users` ∪ `authorized_personnel` — never duplicated.

### Auth flow

1. Registration:
   - Military personal number → verified against `authorized_personnel` (`/api/auth/verify-military-id`).
   - `signInWithPhoneNumber` (Firebase) → `confirmationResult.confirm(code)` creates the Firebase Auth user with the phone credential.
   - User enters email + password → `linkWithCredential(EmailAuthProvider.credential(email, password))` attaches a second provider to the same user.
   - `sendEmailVerification()` is fired (soft — login not blocked).
   - `POST /api/auth/register` → writes Firestore profile via `UserService.registerUser`.
2. Login: email + password via `signInWithEmailAndPassword`. Phone OTP is never used at login.
3. Forgot password: `/forgot-password` page → `/api/auth/check-email-verified` (Admin SDK) gates by `emailVerified`; if verified, client calls `sendPasswordResetEmail`.
4. Session: `AuthContext` holds both the Firebase `User` and an `EnhancedAuthUser` (enriched with Firestore profile data + `emailVerified`).
5. OTP wrapper: `src/lib/firebasePhoneAuth.ts` centralizes reCAPTCHA, send, confirm, link, verification email, password reset, and Hebrew error mapping.

Full migration spec: `docs/spec/firebase-otp-migration.md`. Phase 2 (Google sign-in + provider linking from profile) is not yet started.

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
- **Documentation:** after every code change, update the corresponding docs under `docs/codebase/src/` (or create new ones if adding files). Keep `docs/firebase-operations.md`, `docs/duplications.md`, and feature specs in `docs/spec/` in sync with the code. Documentation is not optional — it ships with the code.
