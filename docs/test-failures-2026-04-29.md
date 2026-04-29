# Test Failure Triage — 2026-04-29

Branch: `feat/permission-grants-ui`
Run: `npm test`
Result: **8 suites failed, 15 passed · 58 tests failed, 36 skipped, 451 passed (545 total)**

All 58 failures are **stale tests** lagging behind production refactors. No production bug detected.

---

## Summary by suite

| Suite | Failures | Root cause |
|---|---:|---|
| `RegistrationStepDots.test.tsx` | 4 | Old Tailwind colors (`bg-blue-500`, `bg-green-500`, `bg-gray-300`) |
| `RegistrationSuccessStep.test.tsx` | 3 | Old Tailwind colors (`from-green-600`, `from-green-400`) |
| `RegistrationForm.test.tsx` | 3 | Old colors (`from-green-600`, `border-red-500`) |
| `AccountDetailsStep.test.tsx` | 4 | Old colors (`border-red-500`, `bg-gray-800`) |
| `RegistrationDetailsStep.test.tsx` | 11 | Removed testid `gender-select` (Headless UI Listbox now) + old colors |
| `PersonalDetailsStep.test.tsx` | 24 | Incomplete `TEXT_CONSTANTS` mock + removed `gender-select` testid |
| `RegistrationFlow.integration.test.tsx` | 8 | Incomplete `TEXT_CONSTANTS` mock |
| `adminUtils.test.ts` | 1 | Mocks `writeBatch`, prod now uses `apiFetch('/api/authorized-personnel/bulk')` |

---

## Root causes

### 1. Design-system token migration (15 failures)

Tests assert old Tailwind palette classes. Production migrated to semantic tokens per `tailwind.config.js` and `CLAUDE.md` design rules.

| Old (test expects) | New (component renders) |
|---|---|
| `bg-blue-500`, `ring-blue-200` | `bg-primary-500`, `ring-primary-*` |
| `bg-green-500`, `from-green-600 to-green-700`, `from-green-400 to-green-600` | `bg-success-500`, `from-success-600 to-success-700`, `from-success-400 to-success-600` |
| `border-red-500` | `border-danger-500` |
| `bg-gray-300`, `bg-gray-800` | `bg-neutral-300`, `bg-neutral-800` |

**Affected**: `RegistrationStepDots`, `RegistrationSuccessStep`, `RegistrationForm`, `AccountDetailsStep`, parts of `RegistrationDetailsStep`.

**Fix**: replace old class assertions with token-based classes. Per `CLAUDE.md`, design tokens are the source of truth — tests must match.

---

### 2. `TEXT_CONSTANTS` mock missing `REGISTRATION_COMPONENTS` (32 failures)

Production `RegistrationHeader.tsx:38` reads `TEXT_CONSTANTS.REGISTRATION_COMPONENTS.BACK_TO_LOGIN`. Other components read `REGISTRATION_COMPONENTS.ENTER_FIRST_NAME`, etc. Tests mock `@/constants/text` but only stub the `AUTH` namespace, so `REGISTRATION_COMPONENTS` is `undefined` and any property access throws `TypeError: Cannot read properties of undefined`.

Files:
- `PersonalDetailsStep.test.tsx:15-23`
- `RegistrationFlow.integration.test.tsx:20-…`
- (Likely more — audit all `jest.mock('@/constants/text', …)` blocks)

**Fix options**:
- **A (preferred)**: drop the partial mock — import the real `TEXT_CONSTANTS`. The constants file has no side effects.
- **B**: extend the mock to include every namespace the component tree touches (`REGISTRATION_COMPONENTS`, `AUTH`, `ARIA_LABELS`, etc.). Brittle — breaks every time a new key is added.

---

### 3. `gender-select` testid removed (~10 failures)

`PersonalDetailsStep` / `RegistrationDetailsStep` now render a Headless UI `<Listbox>` button (`role="listbox" aria-label="מין"`) instead of a native `<select data-testid="gender-select">`. Tests still call `screen.getByTestId('gender-select')` and `userEvent.selectOptions(...)`.

**Fix**: query by role/label and interact via click + option selection:
```ts
const genderListbox = screen.getByRole('button', { name: 'מין' });
await user.click(genderListbox);
await user.click(screen.getByRole('option', { name: 'זכר' }));
```

(Headless UI `Listbox` is not a native `<select>` — `selectOptions` does not work.)

---

### 4. `adminUtils.test.ts` — bulk add re-architected (1 failure)

Test: `AdminFirestoreService › addAuthorizedPersonnelBulk › should correctly categorize successful, failed, and duplicate entries`

Production `addAuthorizedPersonnelBulk` (`src/lib/adminUtils.ts:544`) now performs the write through `apiFetch('/api/authorized-personnel/bulk', { method: 'POST', body: … })` instead of a client-side `writeBatch`. Test still mocks `writeBatch` and `doc`, never mocks `apiFetch`, so the fetch call rejects/returns falsy and `successful.length === 0` (expected 1).

**Fix**: mock `@/lib/apiFetch` and have it return a `Response`-like object with `success: true` and no `failedIndices`:
```ts
jest.mock('@/lib/apiFetch', () => ({
  apiFetch: jest.fn().mockResolvedValue({
    json: async () => ({ success: true, failedIndices: [] }),
  }),
}));
```
Drop `writeBatch` mock setup from this test — no longer touched.

---

## What needs fixing — checklist

### Tests to update (stale)
- [ ] `src/components/registration/__tests__/RegistrationStepDots.test.tsx` — swap `blue-500`/`green-500`/`gray-300` → `primary-500`/`success-500`/`neutral-300`
- [ ] `src/components/registration/__tests__/RegistrationSuccessStep.test.tsx` — swap `from-green-*`/`to-green-*` → `from-success-*`/`to-success-*`; update `.from-green-400.to-green-600` selector to success tokens
- [ ] `src/components/registration/__tests__/RegistrationForm.test.tsx` — swap `border-red-500` → `border-danger-500`; `from-green-600` → `from-success-600`
- [ ] `src/components/registration/__tests__/AccountDetailsStep.test.tsx` — swap `border-red-500` → `border-danger-500`; `bg-gray-800` → `bg-neutral-800`
- [ ] `src/components/registration/__tests__/PersonalDetailsStep.test.tsx` — replace `TEXT_CONSTANTS` partial mock with real import; replace `gender-select` testid + `selectOptions` with Listbox interaction
- [ ] `src/components/registration/__tests__/RegistrationDetailsStep.test.tsx` — same Listbox migration; same color token swaps
- [ ] `src/components/registration/__tests__/RegistrationFlow.integration.test.tsx` — replace `TEXT_CONSTANTS` partial mock with real import
- [ ] `src/lib/__tests__/adminUtils.test.ts` — mock `@/lib/apiFetch` for `addAuthorizedPersonnelBulk`; drop unused `writeBatch` setup in that test

### Production code
- None. All current behavior is intentional and matches the design-system + API-route migrations already shipped.

---

## Suggested order

1. `adminUtils.test.ts` — single failure, isolated, unblocks confidence in services suite.
2. Add real-`TEXT_CONSTANTS` mock fix to `PersonalDetailsStep` + `RegistrationFlow.integration` — knocks out 32 failures fast.
3. Listbox migration in `PersonalDetailsStep` + `RegistrationDetailsStep` — same pattern, copy-paste.
4. Color token sweep across the four remaining suites — mechanical find/replace.

After each batch, run only the affected suite:
```bash
npx jest src/components/registration/__tests__/<file>.test.tsx
```
