Document a source file and write the result to `docs/codebase/`.

Usage: /doc <src-relative-path>
Example: /doc src/components/equipment/EquipmentList.tsx

Steps:
1. Read the source file at the given path.
2. Determine the output path: replace the `src/` prefix with `docs/codebase/src/` and change the extension to `.md`.
   Example: `src/components/equipment/EquipmentList.tsx` → `docs/codebase/src/components/equipment/EquipmentList.md`
3. Write a documentation file using the standard format below.
4. Report the output path when done.

---

## Standard documentation format

```markdown
# <FileName>

**File:** `src/...`
**Lines:** N  ⚠️ LONG — split recommended  (only add the warning if > 300 lines)
**Status:** Active | Placeholder | TODO | In Progress

## Purpose
One paragraph: what this file does and why it exists in the architecture.

## Exports / Public API
List every exported symbol (component, function, class, type, constant, hook).
For each: name — brief description of what it does.

## Props  *(components only)*
| Prop | Type | Required | Description |
|------|------|----------|-------------|

## State  *(components and hooks only)*
List all useState / useReducer / context values managed here and what they track.

## Methods  *(services and utilities only)*
For each exported function/method:
- **`name(params): ReturnType`** — what it does, notable side effects.

## Firebase Operations  *(if any)*
| Collection | Operation | Triggering function |
|------------|-----------|---------------------|

## Known Issues / TODO
- Anything marked TODO or FIXME in the file.
- Any incomplete features noted in comments.

## Notes
Non-obvious design decisions, coupling concerns, or size warnings.
```

Rules:
- Only document what is actually in the file — no speculation.
- If a feature is partially implemented, note it as "🔄 In Progress".
- If something is stubbed / placeholder, note it as "⏳ TODO".
- Do not add JSDoc to the source file itself — this skill writes the external doc only.
