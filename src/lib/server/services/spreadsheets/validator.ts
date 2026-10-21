import type { ColumnDef } from './normalizer';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Row {
  index: number;
  data: Record<string, string>;
}

export interface InvalidRow {
  index: number;
  data: Record<string, string>;
  reasons: string[];
}

export interface Warning {
  rowIndex: number | null;
  message: string;
}

export interface ValidationResult {
  valid: Row[];
  invalid: InvalidRow[];
  duplicateEmails: string[];
  warnings: Warning[];
}

// ── Email regex (RFC 5322 simplified) ────────────────────────────────────────
const EMAIL_RE =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ── Main validator ────────────────────────────────────────────────────────────

/**
 * Validate a normalized row dataset against a set of column definitions.
 *
 * @param rows     - Rows where every value has been stringified via normalizeCellValue
 * @param columns  - Column definitions from detectColumns
 * @param emailCol - Normalized name of the column that carries email addresses
 */
export function validateRows(
  rows: Record<string, string>[],
  columns: ColumnDef[],
  emailCol: string
): ValidationResult {
  const valid: Row[] = [];
  const invalid: InvalidRow[] = [];
  const warnings: Warning[] = [];

  // Track emails to detect duplicates
  const emailCount = new Map<string, number[]>(); // email → list of row indexes

  for (let i = 0; i < rows.length; i++) {
    const data = rows[i];
    const reasons: string[] = [];

    // 1. Empty row check — all values blank
    const allEmpty = Object.values(data).every((v) => v.trim() === '');
    if (allEmpty) {
      warnings.push({ rowIndex: i, message: `Row ${i + 1} is completely empty and was skipped.` });
      continue;
    }

    // 2. Email column presence & format
    const emailValue = (data[emailCol] ?? '').trim();

    if (!emailValue) {
      reasons.push('Email address is empty.');
    } else if (!EMAIL_RE.test(emailValue)) {
      reasons.push(`"${emailValue}" is not a valid email address.`);
    } else {
      // Track for duplicate detection
      const normalized = emailValue.toLowerCase();
      const existing = emailCount.get(normalized) ?? [];
      existing.push(i);
      emailCount.set(normalized, existing);
    }

    // 3. Leading-zero preservation check — warn if an identifier column looks truncated
    for (const col of columns) {
      if (col.guessedType === 'identifier') {
        const val = data[col.normalized] ?? '';
        // If the value is a plain integer string and the original header
        // suggests it should have leading zeros (e.g. "N001"), we trust the
        // string as-is since parseXLSX forces string type. No action needed.
        // We only warn when the value is suspiciously short (< 3 chars) for
        // a column named with "no" / "num" hints.
        if (val.length > 0 && /^\d+$/.test(val) && val.length === 1) {
          warnings.push({
            rowIndex: i,
            message: `Row ${i + 1}: identifier column "${col.original}" has a single-digit value "${val}". Check if leading zeros were dropped.`
          });
        }
      }
    }

    if (reasons.length > 0) {
      invalid.push({ index: i, data, reasons });
    } else {
      valid.push({ index: i, data });
    }
  }

  // 4. Duplicate email detection — flag ALL occurrences
  const duplicateEmails: string[] = [];
  for (const [email, indexes] of emailCount.entries()) {
    if (indexes.length > 1) {
      duplicateEmails.push(email);
      for (const idx of indexes) {
        warnings.push({
          rowIndex: idx,
          message: `Row ${idx + 1}: email "${email}" appears ${indexes.length} times (rows ${indexes.map((r) => r + 1).join(', ')}).`
        });
      }
    }
  }

  return { valid, invalid, duplicateEmails, warnings };
}

// ── Report generator ─────────────────────────────────────────────────────────

/**
 * Generate a CSV validation report that can be downloaded by the user.
 *
 * Columns: Row, Email, Status, Reasons/Notes
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = ['"Row","Email","Status","Notes"'];

  for (const row of result.valid) {
    const email = csvEscape(row.data['email'] ?? row.data[Object.keys(row.data)[0]] ?? '');
    lines.push(`${row.index + 1},${email},"valid",""`);
  }

  for (const row of result.invalid) {
    const email = csvEscape(row.data['email'] ?? row.data[Object.keys(row.data)[0]] ?? '');
    const reasons = csvEscape(row.reasons.join('; '));
    lines.push(`${row.index + 1},${email},"invalid",${reasons}`);
  }

  for (const dup of result.duplicateEmails) {
    lines.push(`,"${csvEscape(dup)}","duplicate",""`);
  }

  return lines.join('\r\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return `"${s}"`;
}
