/**
 * Minimal RFC 4180 CSV parser for client-side bulk imports.
 *
 * Supports:
 *  - Comma-separated values with optional quoted fields.
 *  - Embedded commas, quotes (escaped as ""), and newlines inside quotes.
 *  - LF and CRLF line endings.
 *  - Leading UTF-8 BOM.
 *
 * Does NOT support:
 *  - Custom delimiters / quote chars.
 *  - Streaming. The entire file is parsed at once. Designed for small admin
 *    imports (hundreds of rows max), not bulk data loads.
 *
 * Returns row objects keyed by trimmed header name. Empty trailing rows are
 * dropped. A row with fewer columns than headers fills missing keys with ''.
 */
export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

const BOM = '﻿';

function tokenize(input: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const text = input.startsWith(BOM) ? input.slice(1) : input;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      row.push(field);
      field = '';
      out.push(row);
      row = [];
      // skip CRLF pair
      if (ch === '\r' && text[i + 1] === '\n') i += 2;
      else i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // Flush final field/row if input doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    out.push(row);
  }
  return out;
}

export function parseCsv(input: string): ParsedCsv {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { headers: [], rows: [] };
  const headers = tokens[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < tokens.length; r++) {
    const cells = tokens[r];
    const allEmpty = cells.every((c) => c.trim() === '');
    if (allEmpty) continue;
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = (cells[c] ?? '').trim();
    }
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Build a CSV string from headers + rows. Escapes values containing
 * commas, quotes, or newlines per RFC 4180. Prefixes a UTF-8 BOM so Excel
 * opens it with Hebrew rendering correct.
 */
export function buildCsv(headers: string[], rows: Array<Record<string, string | number | undefined | null>>): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return BOM + lines.join('\r\n') + '\r\n';
}
