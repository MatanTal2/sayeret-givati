import type { Equipment } from '@/types/equipment';

/**
 * Returns the displayable serial-number string for an equipment item, or `null`
 * if the item has no real serial (its `id` is an auto-generated UUID and must
 * never be shown to users).
 *
 * `hasSerialNumber` is optional for back-compat with pre-flag docs: when the
 * field is absent, treat the item as serialized (true) — only an explicit
 * `false` hides the serial.
 */
export function equipmentSerialDisplay(eq: Pick<Equipment, 'id' | 'hasSerialNumber'>): string | null {
  if (eq.hasSerialNumber === false) return null;
  return eq.id;
}
