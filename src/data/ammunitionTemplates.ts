/**
 * Canonical ammunition templates seeded with the feature.
 *
 * These are *defaults* — an admin runs the seed once to populate the
 * `ammunitionTemplates` collection. After that, the data lives in Firestore
 * and admins manage it via the management UI. This file is the source of
 * truth for the initial canonical set; later edits in the UI win.
 *
 * Why a separate file: the list is small, opinionated, and tied to the unit's
 * standard issue. Keeping it in code means it can be code-reviewed and
 * versioned without depending on Firestore being live (e.g., for tests and
 * local dev).
 *
 * Field shape matches `AmmunitionType` in `src/types/ammunition.ts` minus
 * `id`, `createdAt`, `updatedAt`, `createdBy`, `status` — those are filled
 * at write time. `status` is forced to `CANONICAL`.
 */
import type {
  AmmunitionAllocation,
  AmmunitionSubcategory,
  SecurityLevel,
  TrackingMode,
} from '@/types/ammunition';

export interface CanonicalAmmunitionTemplateSeed {
  name: string;
  description?: string;
  subcategory: AmmunitionSubcategory;
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
}

export const CANONICAL_AMMUNITION_TEMPLATES: ReadonlyArray<CanonicalAmmunitionTemplateSeed> = [
  // BULLETS — BRUCE / TEAM / EXPLOSIVE. 30 bullets per cardboard, 33 cardboards per Bruce.
  {
    name: '5.56 לבן',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    name: '5.56 ירוק',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    name: '5.56 נותב',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    name: '7.62 נותב',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    name: '0.5 נותב',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },

  // GRENADES — smoke (BOTH/GRABBABLE), spray (USER/EXPLOSIVE).
  {
    name: 'רימון עשן',
    subcategory: 'GRENADES',
    allocation: 'BOTH',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'GRABBABLE',
  },
  {
    name: 'רימון רסס',
    subcategory: 'GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },

  // LAUNCHER GRENADES — USER / LOOSE_COUNT / EXPLOSIVE.
  {
    name: 'רימון משגר עשן',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    name: 'רימון משגר רסס',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    name: 'רימון משגר תאורה',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },

  // SHOULDER MISSILES — SERIAL / TEAM / EXPLOSIVE.
  { name: 'יתד', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { name: 'חולית', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { name: 'לאו', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { name: 'מטאדור', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },

  // MINES — light mine, SERIAL / TEAM / EXPLOSIVE.
  {
    name: 'מוקש קל',
    subcategory: 'MINES',
    allocation: 'TEAM',
    trackingMode: 'SERIAL',
    securityLevel: 'EXPLOSIVE',
  },

  // OTHER — נר עשן (TEAM/EXPLOSIVE), מעיל רוח (TEAM/GRABBABLE).
  {
    name: 'נר עשן',
    subcategory: 'OTHER',
    allocation: 'TEAM',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    name: 'מעיל רוח',
    subcategory: 'OTHER',
    allocation: 'TEAM',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'GRABBABLE',
  },
];
