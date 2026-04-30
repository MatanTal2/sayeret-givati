/**
 * Fixed subcategory list for ammunition templates.
 *
 * Ammunition uses its own subcategory taxonomy independent of equipment.
 * The list is short, fixed, and shipped with the code — no Firestore lookup
 * needed (unlike `equipmentTemplates` which is template-driven).
 *
 * Hebrew labels live in `src/constants/text.ts → FEATURES.AMMUNITION.SUBCATEGORIES`.
 */
import type { AmmunitionSubcategory, TrackingMode } from '@/types/ammunition';

/**
 * BRUCE and BELT share the same stock + reporting shape (bruceCount +
 * openBruceState; brucesConsumed/cardboardsConsumed/bulletsConsumed). They
 * differ only at the template level (cardboards-of-bullets vs strings-of-
 * bullets) and in user-facing labels. Code that handles stock arithmetic
 * should treat them uniformly via this helper.
 */
export function isBruceLike(mode: TrackingMode): boolean {
  return mode === 'BRUCE' || mode === 'BELT';
}

export const AMMUNITION_SUBCATEGORIES: ReadonlyArray<AmmunitionSubcategory> = [
  'BULLETS',
  'GRENADES',
  'LAUNCHER_GRENADES',
  'SHOULDER_MISSILES',
  'MORTAR',
  'MINES',
  'OTHER',
] as const;

export function isAmmunitionSubcategory(value: unknown): value is AmmunitionSubcategory {
  return typeof value === 'string' && (AMMUNITION_SUBCATEGORIES as readonly string[]).includes(value);
}
