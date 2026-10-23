/**
 * Variable substitution engine for email subjects and bodies.
 *
 * Syntax: {{variable}} or {{variable|formatter}} or {{variable|default:VALUE}}
 * No eval/Function — purely regex-based.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormattersConfig {
  /** Extra named date formats — currently unused but reserved for extension */
  dateLocale?: string;
}

// ── Regex ─────────────────────────────────────────────────────────────────────

// Matches: {{ word ( | anything-except-} )? }}
const VAR_RE = /\{\{(\w+)(\|[^}]*)?\}\}/g;

// ── Formatter helpers ─────────────────────────────────────────────────────────

function applyFormatter(value: string, fmt: string): string {
  if (fmt === '|upper') return value.toUpperCase();
  if (fmt === '|lower') return value.toLowerCase();
  if (fmt === '|title') {
    return value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  if (fmt.startsWith('|default:')) {
    // Only use default when value is empty
    return value !== '' ? value : fmt.slice('|default:'.length);
  }
  if (fmt.startsWith('|date:')) {
    const format = fmt.slice('|date:'.length).trim();
    return formatDate(value, format);
  }
  // Unknown formatter — return value unchanged
  return value;
}

/**
 * Simple date formatter supporting DD/MM/YYYY tokens.
 * Accepts ISO date strings or anything Date() can parse.
 */
function formatDate(value: string, format: string): string {
  if (!value) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;

  const pad = (n: number) => String(n).padStart(2, '0');
  const DD = pad(d.getDate());
  const MM = pad(d.getMonth() + 1);
  const YYYY = String(d.getFullYear());

  return format
    .replace(/DD/g, DD)
    .replace(/MM/g, MM)
    .replace(/YYYY/g, YYYY);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Replace all `{{variable}}` and `{{variable|formatter}}` tokens in `template`
 * using values from `variables`.
 *
 * Rules:
 * - Missing variable with no `|default:` formatter → empty string
 * - Formatters are applied after the value is resolved
 * - No dynamic code execution
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>,
  _formatters?: FormattersConfig
): string {
  return template.replace(VAR_RE, (_match, name: string, fmtPart: string | undefined) => {
    const raw = variables[name] ?? '';
    if (fmtPart) {
      return applyFormatter(raw, fmtPart);
    }
    return raw;
  });
}
