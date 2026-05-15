/**
 * Regression coverage for the bug where the update toast never disappeared
 * after the user clicked "Update Now": the original implementation listened
 * to `controllerchange` to trigger the reload, but with `clientsClaim: false`
 * (set in `src/app/sw.ts`) the new SW activates without claiming the current
 * document, so `controllerchange` never fires for this page and the reload
 * never happens. Fix: listen to the waiting worker's own `statechange` for
 * `'activated'` and reload from there.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import ServiceWorkerUpdater from '../ServiceWorkerUpdater';

type Listener = (this: unknown, ev: Event) => unknown;

class FakeWorker extends EventTarget {
  state: 'installing' | 'installed' | 'activating' | 'activated' = 'installed';
  postMessage = jest.fn<void, [unknown]>();

  transitionTo(state: FakeWorker['state']) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null;
  active: FakeWorker | null = null;

  constructor(opts: { waiting?: FakeWorker | null } = {}) {
    super();
    this.waiting = opts.waiting ?? null;
  }
}

describe('ServiceWorkerUpdater', () => {
  const originalServiceWorker = navigator.serviceWorker;
  const originalLocation = window.location;
  let reload: jest.Mock;
  let registration: FakeRegistration;
  let swListeners: Map<string, Listener[]>;

  beforeEach(() => {
    reload = jest.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, reload },
    });

    registration = new FakeRegistration();
    swListeners = new Map();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: jest.fn().mockResolvedValue(registration),
        addEventListener: (event: string, listener: Listener) => {
          const list = swListeners.get(event) ?? [];
          list.push(listener);
          swListeners.set(event, list);
        },
        removeEventListener: (event: string, listener: Listener) => {
          const list = swListeners.get(event) ?? [];
          swListeners.set(event, list.filter((l) => l !== listener));
        },
        controller: null,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    jest.clearAllMocks();
  });

  async function flushPromises() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('reloads when the waiting worker transitions to activated after SKIP_WAITING', async () => {
    const waiting = new FakeWorker();
    waiting.state = 'installed';
    registration.waiting = waiting;

    render(<ServiceWorkerUpdater />);
    await flushPromises();

    // Toast is up.
    const updateBtn = await screen.findByRole('button', { name: /עדכן עכשיו/ });

    await act(async () => {
      updateBtn.click();
    });

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();

    // Simulate the browser activating the new SW. Without the fix, no reload
    // would happen here because `controllerchange` never fires for the
    // current document under `clientsClaim: false`.
    await act(async () => {
      waiting.transitionTo('activating');
    });
    expect(reload).not.toHaveBeenCalled();

    await act(async () => {
      waiting.transitionTo('activated');
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does NOT register a global controllerchange listener (relies on statechange instead)', async () => {
    render(<ServiceWorkerUpdater />);
    await flushPromises();
    expect(swListeners.get('controllerchange')?.length ?? 0).toBe(0);
  });
});
