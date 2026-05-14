/**
 * Logistics inventory ("אפסנאות") — non-serialized supplies.
 *
 * Unlike `Equipment` (one document per serial number), a logistics item is a
 * quantity-tracked stock entry: name + category + on-hand count, optionally
 * tied to a holder and a location. No "צ" (serial number), no exchange flow.
 *
 * Categories + subcategories are stored as freeform strings on each template
 * / item rather than as references — they're the unit-specific taxonomy and
 * are intentionally separate from the equipment categories collection.
 */
import type { Timestamp } from 'firebase/firestore';

/** Template — the catalogue entry. New items pick a template to inherit name + categorization. */
export interface LogisticsTemplate {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateLogisticsTemplateInput {
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
}

export interface UpdateLogisticsTemplateInput {
  name?: string;
  category?: string;
  subcategory?: string;
  notes?: string;
  isActive?: boolean;
}

/** Actual inventory entry. */
export interface LogisticsItem {
  id: string;
  templateId: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  location?: string;
  currentHolderId?: string;
  currentHolderName?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateLogisticsItemInput {
  templateId: string;
  quantity: number;
  location?: string;
  currentHolderId?: string;
  currentHolderName?: string;
  notes?: string;
}

export interface UpdateLogisticsItemInput {
  quantity?: number;
  location?: string;
  currentHolderId?: string;
  currentHolderName?: string;
  notes?: string;
}
