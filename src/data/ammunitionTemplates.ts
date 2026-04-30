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
  /** Stable key used by the server to dedupe across re-seeds. Renaming a
   * template in the UI does NOT change this key — the seed matches by it. */
  seedKey: string;
  name: string;
  description?: string;
  subcategory: AmmunitionSubcategory;
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  bulletsPerCardboard?: number;
  cardboardsPerBruce?: number;
  bulletsPerString?: number;
  stringsPerBruce?: number;
}

export const CANONICAL_AMMUNITION_TEMPLATES: ReadonlyArray<CanonicalAmmunitionTemplateSeed> = [
  // BULLETS — BRUCE / TEAM / EXPLOSIVE. 30 bullets per cardboard, 33 cardboards per Bruce.
  {
    seedKey: 'bullets_5_56_white',
    name: '5.56 לבן',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    seedKey: 'bullets_5_56_green',
    name: '5.56 ירוק',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    seedKey: 'bullets_5_56_tracer',
    name: '5.56 נותב',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    seedKey: 'bullets_7_62_tracer',
    name: '7.62 נותב',
    subcategory: 'BULLETS',
    allocation: 'TEAM',
    trackingMode: 'BRUCE',
    securityLevel: 'EXPLOSIVE',
    bulletsPerCardboard: 30,
    cardboardsPerBruce: 33,
  },
  {
    seedKey: 'bullets_0_5_tracer',
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
    seedKey: 'grenade_smoke',
    name: 'רימון עשן',
    subcategory: 'GRENADES',
    allocation: 'BOTH',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'GRABBABLE',
  },
  {
    seedKey: 'grenade_fragmentation',
    name: 'רימון רסס',
    subcategory: 'GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },

  // LAUNCHER GRENADES — USER / LOOSE_COUNT / EXPLOSIVE.
  {
    seedKey: 'launcher_smoke',
    name: 'רימון משגר עשן',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    seedKey: 'launcher_fragmentation',
    name: 'רימון משגר רסס',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    seedKey: 'launcher_illum',
    name: 'רימון משגר תאורה',
    subcategory: 'LAUNCHER_GRENADES',
    allocation: 'USER',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },

  // SHOULDER MISSILES — SERIAL / TEAM / EXPLOSIVE.
  { seedKey: 'shoulder_yated', name: 'יתד', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { seedKey: 'shoulder_holit', name: 'חולית', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { seedKey: 'shoulder_lao', name: 'לאו', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },
  { seedKey: 'shoulder_metador', name: 'מטאדור', subcategory: 'SHOULDER_MISSILES', allocation: 'TEAM', trackingMode: 'SERIAL', securityLevel: 'EXPLOSIVE' },

  // MORTAR — 120mm. All EXPLOSIVE / TEAM. עוקץ פלדה is SERIAL (single per box).
  // TODO: add the rest of the 120mm variants (smoke-explosive, illum, HE, etc.) once user enumerates them.
  {
    seedKey: 'mortar_120_okatz_pelda',
    name: 'עוקץ פלדה',
    description: '120 מ"מ עשן-נפיץ, צ, יחיד בארגז',
    subcategory: 'MORTAR',
    allocation: 'TEAM',
    trackingMode: 'SERIAL',
    securityLevel: 'EXPLOSIVE',
  },

  // MINES — light mine, SERIAL / TEAM / EXPLOSIVE.
  {
    seedKey: 'mine_light',
    name: 'מוקש קל',
    subcategory: 'MINES',
    allocation: 'TEAM',
    trackingMode: 'SERIAL',
    securityLevel: 'EXPLOSIVE',
  },

  // OTHER — נר עשן (TEAM/EXPLOSIVE), מעיל רוח (TEAM/GRABBABLE).
  {
    seedKey: 'other_smoke_candle',
    name: 'נר עשן',
    subcategory: 'OTHER',
    allocation: 'TEAM',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'EXPLOSIVE',
  },
  {
    seedKey: 'other_wind_jacket',
    name: 'מעיל רוח',
    subcategory: 'OTHER',
    allocation: 'TEAM',
    trackingMode: 'LOOSE_COUNT',
    securityLevel: 'GRABBABLE',
  },
];
