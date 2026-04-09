# page.tsx (Test Dashboard)

**File:** `src/app/test-dashboard/page.tsx`
**Lines:** 778 ⚠️ LONG — split recommended
**Status:** Active (development/QA use only — not in production navigation)

## Purpose

Developer testing dashboard (`/test-dashboard`). Consolidates all manual Firebase and equipment testing functionality into a categorized, expandable UI. Tests run against live Firestore (not mocked). Results are displayed with pass/fail/duration. A live log panel captures test output.

Not linked from any navigation — accessed by direct URL only.

## Exports / Public API

- `default TestDashboardPage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `testResults` | `Record<string, TestResult>` | Per-test run status and timing |
| `expandedCategories` | `Set<string>` | Accordion expansion state for categories |
| `expandedSubCategories` | `Set<string>` | Accordion expansion state for sub-categories |
| `isRunningAll` | `boolean` | True while "run all" is in progress |
| `logs` | `string[]` | Captured log messages with timestamps |
| `logsEndRef` | `RefObject<HTMLDivElement>` | Auto-scroll to bottom of log panel |

## Local Types

- `TestStatus` — `'idle' | 'running' | 'passed' | 'failed'`
- `TestResult` — `{ status, message?, duration?, timestamp? }`
- `TestItem` — individual test with a `testFunction: () => Promise<TestResult>`
- `TestCategory` / `TestSubCategory` — tree structure for test organization

## Firebase Operations

Directly imports and calls Firestore functions (not through service layer — acceptable for a dev-only tool):

| Collection | Operation | Purpose |
|------------|-----------|---------|
| `test` | `setDoc`, `deleteDoc` | Connectivity write test |
| `users` | `getDoc`, `getDocs` | Read access test |
| `equipmentTemplates` | `getDoc`, `getDocs` | Template read test |

## Notes

- Uses `equipmentInitializer.ts` functions (`initializeEquipmentTypes`, `checkEquipmentTypesInitialized`) which are deprecated.
- This page makes direct Firestore calls — allowed exception for dev tooling.
- Should remain excluded from production navigation. Consider gating with `NODE_ENV === 'development'` or removing before production launch.
