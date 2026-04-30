/**
 * CSV mapping for ammunition templates bulk import.
 *
 * Headers + per-row → CreateAmmunitionTemplatePayload conversion. Validation
 * is intentionally minimal — the server re-validates each payload before it
 * touches Firestore. The client mapper only catches malformed enum values
 * and missing per-tracking-mode numeric fields, so the UI can show row-level
 * errors before the user submits.
 */
import { AMMUNITION_SUBCATEGORIES } from './subcategories';
import type { CreateAmmunitionTemplatePayload } from '@/hooks/useAmmunitionTemplates';
import type {
  AmmunitionAllocation,
  AmmunitionSubcategory,
  SecurityLevel,
  TrackingMode,
} from '@/types/ammunition';

export const AMMO_TEMPLATE_CSV_HEADERS = [
  'name',
  'description',
  'subcategory',
  'allocation',
  'trackingMode',
  'securityLevel',
  'bulletsPerCardboard',
  'cardboardsPerBruce',
  'bulletsPerString',
  'stringsPerBruce',
] as const;

const ALLOCATIONS: AmmunitionAllocation[] = ['USER', 'TEAM', 'BOTH'];
const TRACKING_MODES: TrackingMode[] = ['BRUCE', 'BELT', 'SERIAL', 'LOOSE_COUNT'];
const SECURITY_LEVELS: SecurityLevel[] = ['EXPLOSIVE', 'GRABBABLE'];

export interface AmmoCsvRowResult {
  payload?: CreateAmmunitionTemplatePayload;
  error?: string;
}

function num(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function csvRowToAmmoTemplatePayload(row: Record<string, string>): AmmoCsvRowResult {
  const name = (row.name || '').trim();
  if (name.length < 2) return { error: 'name חייב להכיל לפחות 2 תווים' };

  const subcategory = (row.subcategory || '').trim() as AmmunitionSubcategory;
  if (!AMMUNITION_SUBCATEGORIES.includes(subcategory)) {
    return { error: `subcategory לא תקין: "${row.subcategory}"` };
  }

  const allocation = (row.allocation || '').trim() as AmmunitionAllocation;
  if (!ALLOCATIONS.includes(allocation)) {
    return { error: `allocation לא תקין: "${row.allocation}" (מותר: USER, TEAM, BOTH)` };
  }

  const trackingMode = (row.trackingMode || '').trim() as TrackingMode;
  if (!TRACKING_MODES.includes(trackingMode)) {
    return { error: `trackingMode לא תקין: "${row.trackingMode}"` };
  }

  const securityLevel = (row.securityLevel || '').trim() as SecurityLevel;
  if (!SECURITY_LEVELS.includes(securityLevel)) {
    return { error: `securityLevel לא תקין: "${row.securityLevel}"` };
  }

  const payload: CreateAmmunitionTemplatePayload = {
    name,
    subcategory,
    allocation,
    trackingMode,
    securityLevel,
    status: 'CANONICAL',
  };

  const description = (row.description || '').trim();
  if (description) payload.description = description;

  if (trackingMode === 'BRUCE') {
    const bpc = num(row.bulletsPerCardboard);
    const cpb = num(row.cardboardsPerBruce);
    if (typeof bpc !== 'number' || Number.isNaN(bpc) || bpc <= 0) {
      return { error: 'bulletsPerCardboard נדרש לתבנית BRUCE' };
    }
    if (typeof cpb !== 'number' || Number.isNaN(cpb) || cpb <= 0) {
      return { error: 'cardboardsPerBruce נדרש לתבנית BRUCE' };
    }
    payload.bulletsPerCardboard = bpc;
    payload.cardboardsPerBruce = cpb;
  } else if (trackingMode === 'BELT') {
    const bps = num(row.bulletsPerString);
    const spb = num(row.stringsPerBruce);
    if (typeof bps !== 'number' || Number.isNaN(bps) || bps <= 0) {
      return { error: 'bulletsPerString נדרש לתבנית BELT' };
    }
    if (typeof spb !== 'number' || Number.isNaN(spb) || spb <= 0) {
      return { error: 'stringsPerBruce נדרש לתבנית BELT' };
    }
    payload.bulletsPerString = bps;
    payload.stringsPerBruce = spb;
  }

  return { payload };
}

/** Sample row used by the "download empty CSV" button. Not committed to Firestore. */
export const AMMO_TEMPLATE_CSV_SAMPLE_ROW: Record<string, string> = {
  name: '5.56 לבן',
  description: '',
  subcategory: 'BULLETS',
  allocation: 'TEAM',
  trackingMode: 'BRUCE',
  securityLevel: 'EXPLOSIVE',
  bulletsPerCardboard: '30',
  cardboardsPerBruce: '33',
  bulletsPerString: '',
  stringsPerBruce: '',
};
