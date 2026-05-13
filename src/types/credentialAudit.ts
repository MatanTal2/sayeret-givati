/**
 * Credential-change audit trail.
 *
 * Distinct from `actionsLog` (equipment / ammo / template domain mutations).
 * Credential events touch identity primitives — password, phone identifier,
 * email identifier, refresh-token revocation — and need their own audit
 * surface for security review without polluting the equipment-centric
 * actionsLog schema.
 *
 * Writes are server-only (admin SDK). Reads are server-only (rules deny
 * client reads); admin / SYSTEM_MANAGER lookups go through dedicated API
 * routes that filter + scope.
 */

import type { Timestamp } from 'firebase/firestore';

export type CredentialAuditEventType =
  | 'PASSWORD_CHANGED'
  | 'PHONE_CHANGED'
  | 'EMAIL_CHANGED'
  | 'PHONE_FORCE_RESET'
  | 'SESSIONS_REVOKED';

export interface CredentialAuditEntry {
  /** Target user whose credential changed. */
  uid: string;
  /** Actor who performed the change. Usually === uid; differs for admin force-reset. */
  actorUid: string;
  /** Actor's userType at the time of the event (frozen — do not re-evaluate later). */
  actorUserType: string;
  /** Event kind. */
  eventType: CredentialAuditEventType;
  /** Server timestamp set at write time. */
  timestamp: Timestamp;
  /** Originating IP from the request (best-effort; may be a proxy IP). */
  ip?: string;
  /** Originating User-Agent from the request. */
  userAgent?: string;
  /**
   * Event-specific payload. Intentionally NOT typed strictly — keeps the
   * schema flexible as new event types land. Convention: PHONE_CHANGED
   * stores `{ oldNumberHash, newNumberHash }` (never plaintext); other
   * events leave empty.
   */
  metadata?: Record<string, unknown>;
}
