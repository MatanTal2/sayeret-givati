/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSoldierStatus } from '../useSoldierStatus';
import { apiFetch } from '@/lib/apiFetch';

jest.mock('@/lib/apiFetch', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('useSoldierStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the roster on mount and exposes mapped soldiers', async () => {
    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        soldiers: [
          {
            id: 'u1',
            firstName: 'דוד',
            lastName: 'לוי',
            platoon: 'מסייעת',
            status: 'בית',
            isRegistered: true,
            phoneNumber: '+972500000001',
          },
        ],
      }),
    );

    const { result } = renderHook(() => useSoldierStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiFetchMock).toHaveBeenCalledWith('/api/soldier-status');
    expect(result.current.error).toBeNull();
    expect(result.current.soldiers).toHaveLength(1);
    expect(result.current.soldiers[0]).toMatchObject({
      id: 'u1',
      firstName: 'דוד',
      lastName: 'לוי',
      name: 'דוד לוי',
      platoon: 'מסייעת',
      status: 'בית',
      isRegistered: true,
      phoneNumber: '+972500000001',
      isSelected: false,
    });
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
    expect(result.current.originalSoldiers).toEqual(result.current.soldiers);
  });

  it('falls back to platoon "מסייעת" when entry has no platoon', async () => {
    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        soldiers: [
          { id: 'u2', firstName: 'אבי', lastName: 'כהן', status: 'משמר' },
        ],
      }),
    );

    const { result } = renderHook(() => useSoldierStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.soldiers[0].platoon).toBe('מסייעת');
  });

  it('surfaces the server error on non-ok response and leaves soldiers empty', async () => {
    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: 'boom' }, { ok: false, status: 500 }),
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useSoldierStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.soldiers).toEqual([]);

    consoleSpy.mockRestore();
  });

  it('does not consult any local cache between mounts — each mount hits the API', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ success: true, soldiers: [] }),
    );

    const first = renderHook(() => useSoldierStatus());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const second = renderHook(() => useSoldierStatus());
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it('forceRefresh flips isRefreshing on then off', async () => {
    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, soldiers: [] }),
    );
    const { result } = renderHook(() => useSoldierStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));

    apiFetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, soldiers: [] }),
    );

    await act(async () => {
      await result.current.fetchSoldiers(true);
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
