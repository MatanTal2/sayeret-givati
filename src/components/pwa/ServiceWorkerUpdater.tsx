'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Mounts the service worker registration and surfaces an update banner when a
 * new SW is installed and waiting. The SW (src/app/sw.ts) is built with
 * `skipWaiting: false` AND `clientsClaim: false`, so the waiting worker only
 * activates after the user accepts AND it does not auto-claim already-open
 * tabs. We post `{ type: 'SKIP_WAITING' }`, listen for the worker's own
 * `statechange` to `'activated'`, and reload from there.
 *
 * Why not `controllerchange`: with `clientsClaim: false`, after SKIP_WAITING
 * the new SW activates but does NOT take over the current document's
 * controller. `navigator.serviceWorker.controller` stays pointed at the old
 * SW, so `controllerchange` never fires for this page and the original
 * implementation left the toast pinned forever (the user reloaded, but the
 * waiting worker was still waiting because `controllerchange` only signals a
 * controller swap — not activation). The waiting worker's `statechange`
 * fires reliably across browsers and is the canonical signal here.
 *
 * Audit note M5 (docs/spec/offline-first.md). Never auto-activate the new SW
 * — open tabs with in-flight optimistic state would be taken over mid-session.
 */
export default function ServiceWorkerUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cleanup: (() => void) | undefined;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) setWaitingWorker(reg.waiting);

        const onUpdateFound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
            }
          });
        };
        reg.addEventListener('updatefound', onUpdateFound);
        cleanup = () => reg.removeEventListener('updatefound', onUpdateFound);
      })
      .catch((err) => {
        console.warn('[sw] registration failed', err);
      });

    return () => {
      cleanup?.();
    };
  }, []);

  const onUpdateNow = () => {
    if (!waitingWorker) return;
    const worker = waitingWorker;

    // Already-activated short-circuit. If the user has been sitting on the
    // toast long enough that the SW transitioned without us, reload now.
    if (worker.state === 'activated') {
      window.location.reload();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      worker.removeEventListener('statechange', onState);
      clearTimeout(timeoutId);
      window.location.reload();
    };

    const onState = () => {
      if (worker.state === 'activated') finish();
    };
    worker.addEventListener('statechange', onState);

    // Mobile fallback. iOS Safari (and some Chromium-on-iOS WebKit shells)
    // do not reliably fire `statechange` on a worker whose controller is not
    // adopted by the current document (clientsClaim: false). After we ask the
    // worker to activate, reload regardless after a short delay — the new SW
    // is picked up on the next navigation even if it never reaches us.
    const timeoutId = setTimeout(finish, 3000);

    worker.postMessage({ type: 'SKIP_WAITING' });
  };

  const onDismiss = () => setWaitingWorker(null);

  return (
    <AnimatePresence>
      {waitingWorker && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 inset-x-4 mx-auto max-w-md z-[10000] bg-neutral-900 text-white rounded-2xl shadow-medium p-4 flex items-start gap-3"
        >
          <div className="flex-1">
            <div className="font-semibold text-sm">
              {TEXT_CONSTANTS.PWA.UPDATE_AVAILABLE_TITLE}
            </div>
            <div className="text-xs text-neutral-300 mt-1">
              {TEXT_CONSTANTS.PWA.UPDATE_AVAILABLE_BODY}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white"
            >
              {TEXT_CONSTANTS.PWA.UPDATE_LATER}
            </button>
            <button
              type="button"
              onClick={onUpdateNow}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 font-medium"
            >
              {TEXT_CONSTANTS.PWA.UPDATE_NOW}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
