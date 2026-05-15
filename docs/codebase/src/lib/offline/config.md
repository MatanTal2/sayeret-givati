# offline/config.ts

**File:** `src/lib/offline/config.ts`
**Status:** Active (Phase 0)
**Spec:** `docs/spec/offline-first.md`

## Purpose

Runtime configuration constants for the offline-first replay engine. Phase 0
ships the constants only; they are consumed by Phase 5 outbox + replay code
(`src/lib/offline/outbox.ts`, `src/lib/offline/replay.ts`) once those land.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `OFFLINE_REPLAY_CONCURRENCY` | `number` | Max in-flight replay requests when draining the outbox. Default `3`. Overridable via `NEXT_PUBLIC_OFFLINE_REPLAY_CONCURRENCY` env (positive integer). |

## Why concurrency 3

Audit finding S3 in `docs/spec/offline-first.md`. A user with 200 queued
mutations reconnecting on flaky Wi-Fi must not stampede Vercel function
concurrency, Firestore transaction contention, or rate limits. 3 is small,
conservative, and lets the replay loop progress steadily without burning a
fresh token per request (the loop is expected to fetch and cache an ID token
per batch — see S3 patch in the spec).

## Environment

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `NEXT_PUBLIC_OFFLINE_REPLAY_CONCURRENCY` | No | `3` | Positive integer. Non-numeric or zero/negative values fall back to default. |
