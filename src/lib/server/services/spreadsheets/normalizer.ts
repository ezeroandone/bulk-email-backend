/** Column definition produced by detectColumns */
export interface ColumnDef {
  original: string;
  normalized: string;
  guessedType: 'email' | 'identifier' | 'text';
}

// Patterns used to guess column types
const EMAIL_PATTERNS = /\b(e-?mail|correo|courriel)\b/i;
const IDENTIFIER_PATTERNS = /\b(id|no|num|number|code|ref|serial|cert|mem|member)\b/i;

/**
 * Convert a raw header string to a safe, lowercase, snake_case identifier.
 *
 * Examples:
 *   "First Name"   → "first_name"
 *   "Mem. No."     → "mem_no"
 *   "Certificate ID" → "certificate_id"
 *   "  Hello  "    → "hello"
 */
export function normalizeColumnName(header: string): string {
  return header
    .trim()
    .toLowerCase()
    // Replace every run of non-alphanumeric characters with a single underscore
    .replace(/[^a-z0-9]+/g, '_')
    // Strip leading / trailing underscores
    .replace(/^_+|_+$/g, '');
}

/**
 * Stringify a raw cell value while preserving the string representation
 * (e.g. leading zeros on numeric-looking strings that were already strings).
 */
export function normalizeCellValue(value: unknown, _colName: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/**
 * Detect each column's type and deduplicate normalized names.
 *
 * Duplicate normalized names get a `_2`, `_3` … suffix so no data is silently merged.
 */
export function detectColumns(headers: string[]): ColumnDef[] {
  const seen = new Map<string, number>();

  return headers.map((original): ColumnDef => {
    let normalized = normalizeColumnName(original);

    // Deduplication: if we've seen this normalized name before, append a counter
    const count = seen.get(normalized) ?? 0;
    seen.set(normalized, count + 1);
    if (count > 0) {
      normalized = `${normalized}_${count + 1}`;
    }

    const guessedType = guessColumnType(original);

    return { original, normalized, guessedType };
  });
}

// ── Private helpers ──────────────────────────────────────────────────────────

function guessColumnType(header: string): 'email' | 'identifier' | 'text' {
  if (EMAIL_PATTERNS.test(header)) return 'email';
  if (IDENTIFIER_PATTERNS.test(header)) return 'identifier';
  return 'text';
}
