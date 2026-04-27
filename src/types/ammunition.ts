import { Timestamp } from 'firebase/firestore';

/**
 * Ammunition domain types.
 *
 * Tracking modes:
 *   - BRUCE       — bullets (boxes of cardboards). Stock = bruceCount + open-bruce state.
 *   - SERIAL      — items with a serial number (צ). One Firestore doc per serial.
 *   - LOOSE_COUNT — countable items without a serial (smoke grenades, נר עשן, etc.).
 *
 * Allocation tells us who can hold a given template:
 *   USER | TEAM | BOTH.
 *
 * Security level is informational only — it surfaces in lists, audit, and
 * dashboard exports, and does not change tracking logic.
 */

export type AmmunitionAllocation = 'USER' | 'TEAM' | 'BOTH';
export type TrackingMode = 'BRUCE' | 'SERIAL' | 'LOOSE_COUNT';
export type BruceState = 'FULL' | 'MORE_THAN_HALF' | 'LESS_THAN_HALF' | 'EMPTY';
export type SecurityLevel = 'EXPLOSIVE' | 'GRABBABLE';
export type HolderType = 'USER' | 'TEAM';

export type AmmunitionSubcategory =
  | 'BULLETS'
  | 'GRENADES'
  | 'LAUNCHER_GRENADES'
  | 'SHOULDER_MISSILES'
  | 'MINES'
  | 'OTHER';

export type AmmunitionTemplateStatus = 'CANONICAL' | 'PROPOSED' | 'PENDING_REQUEST';

export type AmmunitionItemStatus = 'AVAILABLE' | 'CONSUMED' | 'LOST' | 'DAMAGED';

export type AmmunitionReportRequestStatus = 'OPEN' | 'CLOSED' | 'CANCELED';

export type AmmunitionReportRequestScope = 'INDIVIDUAL' | 'TEAM' | 'ALL';

export interface AmmunitionType {
  id: string;
  name: string;
  description?: string;
  subcategory: AmmunitionSubcategory;
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
  totalBulletsPerBruce?: number;
  status: AmmunitionTemplateStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface AmmunitionStock {
  id: string;
  templateId: string;
  trackingMode: 'BRUCE' | 'LOOSE_COUNT';
  holderType: HolderType;
  holderId: string;
  bruceCount?: number;
  openBruceState?: BruceState;
  quantity?: number;
  updatedAt: Timestamp;
}

export interface AmmunitionItem {
  id: string;
  templateId: string;
  currentHolderType: HolderType;
  currentHolderId: string;
  status: AmmunitionItemStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AmmunitionReport {
  id: string;
  reporterId: string;
  reporterName: string;
  teamId: string;
  templateId: string;
  templateName: string;
  trackingMode: TrackingMode;
  brucesConsumed?: number;
  cardboardsConsumed?: number;
  bulletsConsumed?: number;
  finalOpenBruceState?: BruceState;
  itemSerials?: string[];
  quantityConsumed?: number;
  reason: string;
  usedAt: Timestamp;
  createdAt: Timestamp;
  reportRequestId?: string;
}

export interface AmmunitionReportRequestFulfillment {
  fulfilled: boolean;
  fulfilledAt?: Timestamp;
  reportId?: string;
}

export interface AmmunitionReportRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  scope: AmmunitionReportRequestScope;
  targetUserIds: string[];
  targetTeamId?: string;
  templateIds?: string[];
  dueAt?: Timestamp;
  note?: string;
  fulfillmentByUser: Record<string, AmmunitionReportRequestFulfillment>;
  createdAt: Timestamp;
  status: AmmunitionReportRequestStatus;
}

export interface SystemConfig {
  id: string;
  ammoNotificationRecipientUserId?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}
