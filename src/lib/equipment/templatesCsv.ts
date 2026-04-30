/**
 * CSV mapping for equipment templates bulk import.
 *
 * Headers + per-row → server payload (mirrors EquipmentTypeInput minus the
 * fields the server fills itself: templateCreatorId, isActive, status). Boolean
 * fields accept TRUE/FALSE/1/0/"כן"/"לא" case-insensitive.
 *
 * Validation is intentionally light — the server does the real check before
 * any Firestore write.
 */

export const EQUIPMENT_TEMPLATE_CSV_HEADERS = [
  'name',
  'description',
  'category',
  'subcategory',
  'requiresSerialNumber',
  'requiresDailyStatusCheck',
  'defaultCatalogNumber',
  'notes',
] as const;

export interface EquipmentTemplateBulkPayload {
  name: string;
  description?: string;
  category: string;
  subcategory: string;
  requiresSerialNumber: boolean;
  requiresDailyStatusCheck: boolean;
  defaultCatalogNumber?: string;
  notes?: string;
}

export interface EquipmentCsvRowResult {
  payload?: EquipmentTemplateBulkPayload;
  error?: string;
}

function bool(v: string): boolean | null {
  const s = (v || '').trim().toLowerCase();
  if (s === '' || s === 'false' || s === '0' || s === 'לא' || s === 'no') return false;
  if (s === 'true' || s === '1' || s === 'כן' || s === 'yes') return true;
  return null;
}

export function csvRowToEquipmentTemplatePayload(
  row: Record<string, string>
): EquipmentCsvRowResult {
  const name = (row.name || '').trim();
  if (name.length < 2) return { error: 'name חייב להכיל לפחות 2 תווים' };

  const category = (row.category || '').trim();
  if (!category) return { error: 'category חובה' };

  const subcategory = (row.subcategory || '').trim();
  if (!subcategory) return { error: 'subcategory חובה' };

  const reqSerial = bool(row.requiresSerialNumber || 'false');
  if (reqSerial === null) {
    return { error: `requiresSerialNumber לא תקין: "${row.requiresSerialNumber}" (מותר: TRUE/FALSE/כן/לא)` };
  }
  const reqDaily = bool(row.requiresDailyStatusCheck || 'false');
  if (reqDaily === null) {
    return { error: `requiresDailyStatusCheck לא תקין: "${row.requiresDailyStatusCheck}"` };
  }

  const payload: EquipmentTemplateBulkPayload = {
    name,
    category,
    subcategory,
    requiresSerialNumber: reqSerial,
    requiresDailyStatusCheck: reqDaily,
  };

  const description = (row.description || '').trim();
  if (description) payload.description = description;

  const cat = (row.defaultCatalogNumber || '').trim();
  if (cat) payload.defaultCatalogNumber = cat;

  const notes = (row.notes || '').trim();
  if (notes) payload.notes = notes;

  return { payload };
}

export const EQUIPMENT_TEMPLATE_CSV_SAMPLE_ROW: Record<string, string> = {
  name: 'רובה M4A1',
  description: 'רובה אישי',
  category: 'נשק',
  subcategory: 'רובים אישיים',
  requiresSerialNumber: 'TRUE',
  requiresDailyStatusCheck: 'TRUE',
  defaultCatalogNumber: '',
  notes: '',
};
