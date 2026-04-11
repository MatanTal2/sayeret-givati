/**
 * Server-side Actions Log Service (firebase-admin)
 * Handles writes to the actionsLog collection via Admin SDK.
 */
import { createDoc } from '../core';
import { COLLECTIONS } from '../collections';
import type { ActionsLog } from '@/types/equipment';

// Accept string for actionType so server services can pass enum values without importing client types
type ActionLogInput = Omit<ActionsLog, 'id' | 'timestamp' | 'actionType'> & { actionType: string };

/**
 * Create a new action log entry using the Admin SDK.
 * Called from Server Actions — never from client code directly.
 */
export async function serverCreateActionLog(data: ActionLogInput): Promise<string> {
  try {
    const docId = await createDoc(COLLECTIONS.ACTIONS_LOG, data as Record<string, unknown>);
    return docId;
  } catch (error) {
    console.error('[Server] Error creating action log:', error);
    throw new Error('Failed to create action log entry');
  }
}
