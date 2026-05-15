/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Phase 3 — Serwist shell. Critical: skipWaiting is `false` and clientsClaim
// is `false`. The new SW installs but waits for an explicit `SKIP_WAITING`
// postMessage from the page. The page renders an update toast and posts the
// message only when the user accepts.
//
// Reason (audit M5): silently activating a new SW mid-session can take over
// open tabs while optimistic state / queued mutations are governed by a
// possibly-different schema version (Phase 4+ idempotency, Phase 5 outbox).
// Field users with a half-completed action would lose context.
//
// See docs/spec/offline-first.md.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && (event.data as { type?: string }).type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

serwist.addEventListeners();
