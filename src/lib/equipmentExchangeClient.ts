/**
 * Client wrappers for exchange + storage endpoints.
 *
 * Mirrors the existing client-side equipment service shape:
 * each call returns `{ success: boolean; error?: string; ...data }`.
 */
import { apiFetch } from '@/lib/apiFetch';

interface ExchangeApiError {
  success: false;
  error: string;
}

interface RequestExchangeOk {
  success: true;
  requestId: string;
}

interface ApproveExchangeOk {
  success: true;
  newEquipmentDocId: string;
}

interface SimpleOk {
  success: true;
}

export type ExchangeRequestResult = RequestExchangeOk | ExchangeApiError;
export type ApproveExchangeResult = ApproveExchangeOk | ExchangeApiError;
export type RejectExchangeResult = SimpleOk | ExchangeApiError;
export type ReplaceByAnotherResult = ApproveExchangeOk | ExchangeApiError;
export type StorageResult = SimpleOk | ExchangeApiError;

async function postJson<T>(url: string, body: unknown): Promise<T | ExchangeApiError> {
  try {
    const res = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `Request failed (${res.status})` };
    }
    return json as T;
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function requestExchange(
  equipmentDocId: string,
  reason: string,
): Promise<ExchangeRequestResult> {
  return postJson<RequestExchangeOk>(
    `/api/equipment/${encodeURIComponent(equipmentDocId)}/exchange/request`,
    { reason },
  );
}

export function approveExchangeRequest(
  requestId: string,
  newSerialNumber: string,
  note?: string,
): Promise<ApproveExchangeResult> {
  return postJson<ApproveExchangeOk>(
    `/api/exchange-requests/${encodeURIComponent(requestId)}/approve`,
    { newSerialNumber, note },
  );
}

export function rejectExchangeRequest(
  requestId: string,
  reason?: string,
): Promise<RejectExchangeResult> {
  return postJson<SimpleOk>(
    `/api/exchange-requests/${encodeURIComponent(requestId)}/reject`,
    { reason },
  );
}

export function replaceByAnother(
  equipmentDocId: string,
  newSerialNumber: string,
  reason?: string,
): Promise<ReplaceByAnotherResult> {
  return postJson<ApproveExchangeOk>(
    `/api/equipment/${encodeURIComponent(equipmentDocId)}/exchange/replace-by-another`,
    { newSerialNumber, reason },
  );
}

export function sendToStorage(equipmentDocId: string): Promise<StorageResult> {
  return postJson<SimpleOk>(
    `/api/equipment/${encodeURIComponent(equipmentDocId)}/storage/send`,
    {},
  );
}

export function pullFromStorage(equipmentDocId: string): Promise<StorageResult> {
  return postJson<SimpleOk>(
    `/api/equipment/${encodeURIComponent(equipmentDocId)}/storage/pull`,
    {},
  );
}

/**
 * Look up pending exchange request for an equipment doc. Used by approve/reject
 * flows to find the request ID without surfacing it in the UI separately.
 */
export async function findPendingExchangeRequest(
  equipmentDocId: string,
): Promise<{ success: true; requestId: string | null } | ExchangeApiError> {
  try {
    const res = await apiFetch(
      `/api/equipment/${encodeURIComponent(equipmentDocId)}/exchange/pending`,
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || `Request failed (${res.status})` };
    }
    return { success: true, requestId: json.requestId ?? null };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
