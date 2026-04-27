# AmmunitionRequestsSection

**File:** `src/components/management/tabs/ammunition/AmmunitionRequestsSection.tsx`
**Status:** Active (Phase 6 — Ammunition feature)

## Purpose

Manager-triggered report-request list + creation UI. Replaces the Phase 2
placeholder.

## Capabilities

- **List** — every request, sorted by `createdAt desc`. Each card shows
  scope, status badge, creator, fulfillment progress (`fulfilled/total`),
  optional template list, optional note.
- **Create** — modal with scope picker (INDIVIDUAL → user typeahead, TEAM →
  team-id input pre-filled to the actor's `teamId`, ALL → no further input),
  optional template multi-select, optional `dueAt`, optional note.
- **Cancel** — only on OPEN requests. Sets status to CANCELED.

## Permissions

The section is rendered for `manager+` and `team_leader`. The API gates the
same set; non-permitted callers get a 403.

## Notes

- The note copy explains that submitting against any template closes the
  request when the template list is empty.
- The card does not surface the per-user fulfillment list yet — fulfillment
  detail can be added later as a click-through panel.
