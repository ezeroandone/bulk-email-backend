import { parseXLSX, parseCSV } from './parser';
import { detectColumns, normalizeCellValue, normalizeColumnName } from './normalizer';
import { validateRows, generateValidationReport } from './validator';
import type { ColumnDef } from './normalizer';
import type { ValidationResult } from './validator';

export type { ColumnDef } from './normalizer';
export type { ValidationResult, Row, InvalidRow, Warning } from './validator';
export { normalizeColumnName, normalizeCellValue, detectColumns } from './normalizer';
export { generateValidationReport } from './validator';

// ── Result type ──────────────────────────────────────────────────────────────

export interface DatasetImportResult {
  /** Available sheet names (XLSX only; CSV has a single entry) */
  sheets: string[];
  /** Name of the active / selected sheet */
  activeSheet: string;
  /** Detected and deduplicated column definitions */
  columns: ColumnDef[];
  /** All normalized rows (string values) */
  allRows: Record<string, string>[];
  /** First 5 rows for preview */
  previewRows: Record<string, string>[];
  /** Validation result */
  validation: ValidationResult;
  /** The column that was auto-detected as holding email addresses (or empty string) */
  emailColumn: string;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Parse → Normalize → Validate a spreadsheet file.
 *
 * @param buffer      Raw file buffer
 * @param mimeType    MIME type string (determines parser)
 * @param sheetIndex  Zero-based sheet index to process (XLSX only, default 0)
 */
export async function importSpreadsheet(
  buffer: Buffer,
  mimeType: string,
  sheetIndex = 0
): Promise<DatasetImportResult> {
  const isXLSX =
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/octet-stream'; // fallback

  let sheets: string[];
  let activeSheet: string;
  let rawRows: Record<string, unknown>[];
  let headers: string[];

  if (isXLSX) {
    const parsed = await parseXLSX(buffer);
    sheets = parsed.sheets;
    activeSheet = parsed.sheets[sheetIndex] ?? parsed.activeSheet;
    rawRows = parsed.rows[sheetIndex] ?? parsed.rows[0] ?? [];
    // Headers come from the keys of the first row
    headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  } else {
    // Treat as CSV
    const text = buffer.toString('utf-8');
    const parsed = parseCSV(text);
    sheets = ['Sheet1'];
    activeSheet = 'Sheet1';
    rawRows = parsed.rows[0] ?? [];
    headers = parsed.headers;
  }

  // Detect columns
  const columns = detectColumns(headers);

  // Build a mapping from original header → normalized name
  const headerToNormalized = new Map<string, string>();
  columns.forEach((col) => headerToNormalized.set(col.original, col.normalized));

  // Normalize all cell values, keyed by normalized column name
  const allRows: Record<string, string>[] = rawRows.map((raw) => {
    const record: Record<string, string> = {};
    for (const col of columns) {
      const rawVal = raw[col.original];
      record[col.normalized] = normalizeCellValue(rawVal, col.normalized);
    }
    return record;
  });

  // Auto-detect the email column
  const emailColumn =
    columns.find((c) => c.guessedType === 'email')?.normalized ?? '';

  // Validate
  const validation = validateRows(allRows, columns, emailColumn);

  return {
    sheets,
    activeSheet,
    columns,
    allRows,
    previewRows: allRows.slice(0, 5),
    validation,
    emailColumn
  };
}
