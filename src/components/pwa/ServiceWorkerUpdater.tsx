'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Mounts the service worker registration and surfaces an update banner when a
 * new SW is installed and waiting. The SW (src/app/sw.ts) is built with
 * `skipWaiting: false`, so the waiting worker only activates after the user
 * accepts. We post `{ type: 'SKIP_WAITING' }` to the waiting worker, then
 * reload on `controllerchange`.
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

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cleanup?.();
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const onUpdateNow = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
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
          className="fixed bottom-6 start-1/2 -translate-x-1/2 z-[10000] max-w-md w-[calc(100%-2rem)] bg-neutral-900 text-white rounded-2xl shadow-medium p-4 flex items-start gap-3"
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
