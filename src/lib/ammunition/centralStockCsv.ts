/**
 * CSV mapping for central-stock bulk import.
 *
 * One row per template — the column the importer reads is decided server-
 * side from the template's tracking mode (BRUCE/BELT → bruceCount,
 * LOOSE_COUNT → quantity). SERIAL items intentionally excluded; they're
 * per-serial and don't fit a "fill the warehouse" spreadsheet.
 *
 * The mapper here only does shape-checking. The real validation
 * (templateName resolution, mode-specific column requirements) runs on
 * the server in serverBulkLoadCentralStock.
 */

export const CENTRAL_STOCK_CSV_HEADERS = [
  'templateName',
  'bruceCount',
  'quantity',
] as const;

export interface CentralStockBulkRow {
  templateName: string;
  bruceCount?: number;
  quantity?: number;
}

export interface CentralStockCsvRowResult {
  payload?: CentralStockBulkRow;
  error?: string;
}

function num(v: string): number | undefined {
  const t = (v || '').trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export function csvRowToCentralStockPayload(
  row: Record<string, string>
): CentralStockCsvRowResult {
  const templateName = (row.templateName || '').trim();
  if (!templateName) return { error: 'templateName חובה' };

  const bruceCount = num(row.bruceCount || '');
  const quantity = num(row.quantity || '');

  if (Number.isNaN(bruceCount as number)) {
    return { error: 'bruceCount חייב להיות מספר' };
  }
  if (Number.isNaN(quantity as number)) {
    return { error: 'quantity חייב להיות מספר' };
  }
  if (bruceCount === undefined && quantity === undefined) {
    return { error: 'יש להזין bruceCount או quantity' };
  }
  if (bruceCount !== undefined && quantity !== undefined) {
    return { error: 'יש להזין bruceCount או quantity, לא שניהם' };
  }

  const payload: CentralStockBulkRow = { templateName };
  if (bruceCount !== undefined) payload.bruceCount = bruceCount;
  if (quantity !== undefined) payload.quantity = quantity;
  return { payload };
}

export const CENTRAL_STOCK_CSV_SAMPLE_ROW: Record<string, string> = {
  templateName: '5.56 לבן',
  bruceCount: '10',
  quantity: '',
};
