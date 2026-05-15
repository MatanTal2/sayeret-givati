'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useOutbox } from '@/contexts/OutboxContext';
import { TEXT_CONSTANTS } from '@/constants/text';

interface ConflictCenterProps {
  open: boolean;
  onClose: () => void;
}

/**
 * One-at-a-time conflict resolution UX. Audit S4: do not surface ten modals
 * when ten entries conflict. The dialog shows the head of the queue and the
 * remaining count; resolving advances to the next.
 *
 * Conflicts persist in IndexedDB across reloads — they live as
 * `OutboxEntry.status === 'conflict'` rows. Opening the dialog never
 * mutates the store; only the explicit Keep/Discard buttons do.
 */
export default function ConflictCenter({ open, onClose }: ConflictCenterProps) {
  const { entries, resolveConflict } = useOutbox();
  const conflicts = entries.filter((e) => e.status === 'conflict');
  const current = conflicts[0];

  if (!current) {
    if (open) onClose();
    return null;
  }

  const handle = async (resolution: 'keep' | 'discard') => {
    if (current.id === undefined) return;
    await resolveConflict(current.id, resolution);
    if (conflicts.length <= 1) onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[10001]">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
              <Dialog.Title className="text-lg font-semibold text-neutral-900">
                {TEXT_CONSTANTS.PWA.CONFLICT_TITLE}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-neutral-600">
                {TEXT_CONSTANTS.PWA.CONFLICT_BODY}
              </Dialog.Description>

              <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1">
                <div>
                  <span className="font-medium">
                    {TEXT_CONSTANTS.PWA.CONFLICT_ROUTE_LABEL}:
                  </span>{' '}
                  <span className="font-mono">{current.routeName}</span>
                </div>
                <div className="font-mono text-neutral-500">
                  {current.method} {current.url}
                </div>
                {current.lastError && (
                  <div className="text-danger-600 font-mono">{current.lastError}</div>
                )}
                {conflicts.length > 1 && (
                  <div className="text-neutral-500">
                    {conflicts.length - 1} {TEXT_CONSTANTS.PWA.CONFLICT_QUEUE_COUNT}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { void handle('discard'); }}
                  className="btn-ghost text-sm"
                >
                  {TEXT_CONSTANTS.PWA.CONFLICT_DISCARD}
                </button>
                <button
                  type="button"
                  onClick={() => { void handle('keep'); }}
                  className="btn-primary text-sm"
                >
                  {TEXT_CONSTANTS.PWA.CONFLICT_KEEP_LOCAL}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
