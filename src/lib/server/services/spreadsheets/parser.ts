import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface ParsedXLSX {
  sheets: string[];
  activeSheet: string;
  rows: Record<string, unknown>[][];
}

export interface ParsedCSV {
  rows: Record<string, unknown>[][];
  headers: string[];
}

/**
 * Parse an XLSX buffer into raw rows per sheet.
 * All cell values are coerced to strings to preserve leading zeros.
 */
export async function parseXLSX(buffer: Buffer): Promise<ParsedXLSX> {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS declares its own Buffer type that extends ArrayBuffer.
  // Node's Buffer satisfies this in practice; cast to satisfy TypeScript.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const sheets: string[] = [];
  const rows: Record<string, unknown>[][] = [];

  workbook.eachSheet((worksheet) => {
    sheets.push(worksheet.name);
    const sheetRows: Record<string, unknown>[] = [];

    // Read header row first
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      headers.push(String(cell.value ?? ''));
    });

    // Read data rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const record: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        const cell = row.getCell(idx + 1);
        // Force string type to preserve leading zeros
        let val: unknown = cell.value;
        if (val !== null && val !== undefined) {
          if (typeof val === 'object' && 'result' in (val as Record<string, unknown>)) {
            // Formula cell — use the cached result
            val = String((val as { result: unknown }).result ?? '');
          } else if (typeof val === 'object' && 'text' in (val as Record<string, unknown>)) {
            // Rich text
            val = String((val as { text: unknown }).text ?? '');
          } else {
            val = String(val);
          }
        } else {
          val = '';
        }
        record[header] = val;
      });
      sheetRows.push(record);
    });

    rows.push(sheetRows);
  });

  const activeSheet = sheets[0] ?? '';

  return { sheets, activeSheet, rows };
}

/**
 * Parse a CSV string into rows with headers.
 * Uses PapaParse with header:true and skipEmptyLines:true.
 */
export function parseCSV(text: string): ParsedCSV {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim()
  });

  const headers = result.meta.fields ?? [];

  return {
    rows: [result.data],
    headers
  };
}
