/**
 * Fixed subcategory list for ammunition templates.
 *
 * Ammunition uses its own subcategory taxonomy independent of equipment.
 * The list is short, fixed, and shipped with the code — no Firestore lookup
 * needed (unlike `equipmentTemplates` which is template-driven).
 *
 * Hebrew labels live in `src/constants/text.ts → FEATURES.AMMUNITION.SUBCATEGORIES`.
 */
import type { AmmunitionSubcategory } from '@/types/ammunition';

export const AMMUNITION_SUBCATEGORIES: ReadonlyArray<AmmunitionSubcategory> = [
  'BULLETS',
  'GRENADES',
  'LAUNCHER_GRENADES',
  'SHOULDER_MISSILES',
  'MINES',
  'OTHER',
] as const;

export function isAmmunitionSubcategory(value: unknown): value is AmmunitionSubcategory {
  return typeof value === 'string' && (AMMUNITION_SUBCATEGORIES as readonly string[]).includes(value);
}
