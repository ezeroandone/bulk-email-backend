/**
 * Document-to-recipient matching engine.
 *
 * Supports multiple matching rules, scored confidence, and duplicate detection.
 */
import path from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileEntry {
  /** Filename (basename) */
  name: string;
  /** Arbitrary metadata path (storage key, etc.) */
  storagePath: string;
}

export interface RecipientRow {
  /** Unique row identifier */
  id: string;
  /** All data columns keyed by column name */
  data: Record<string, string>;
  /** Resolved email address */
  email: string;
}

export type MatchRuleType =
  | 'certificate_id'
  | 'membership_no'
  | 'filename'
  | 'full_name'
  | 'custom';

export interface MatchRule {
  type: MatchRuleType;
  /** Column name in the dataset to match against */
  column: string;
  /** Pattern with {variable} placeholders — used when type === 'custom' */
  customPattern?: string;
}

export type MatchStatus = 'matched' | 'unmatched' | 'ambiguous' | 'duplicate';

export interface MatchResult {
  recipient: RecipientRow;
  matchedFile?: FileEntry;
  /** 0.0 – 1.0 */
  confidence: number;
  status: MatchStatus;
}

// ── Normalization ─────────────────────────────────────────────────────────────

/**
 * Normalize a string for fuzzy comparison:
 * lowercase, strip extension, replace `_`, `-`, `.` with space, collapse spaces, trim.
 */
export function normalizeForMatch(s: string): string {
  let result = s.toLowerCase();
  // Strip file extension (e.g. ".pdf", ".docx")
  result = result.replace(/\.[a-z0-9]{1,6}$/, '');
  // Replace separators with space
  result = result.replace(/[_\-.]/g, ' ');
  // Collapse multiple spaces
  result = result.replace(/\s{2,}/g, ' ');
  return result.trim();
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build the string we want to match for a recipient, given the rule.
 */
function buildMatchKey(row: RecipientRow, rule: MatchRule): string {
  if (rule.type === 'custom' && rule.customPattern) {
    // Replace {column_name} placeholders in the pattern
    return rule.customPattern.replace(/\{([^}]+)\}/g, (_, col: string) => {
      return row.data[col] ?? '';
    });
  }
  return row.data[rule.column] ?? '';
}

/**
 * Score a filename against a match key.
 *
 * exact=1.0, normalized=0.9, partial=0.5, no match=0.
 */
function scoreMatch(filename: string, matchKey: string): number {
  if (!matchKey) return 0;

  const fileBase = path.basename(filename, path.extname(filename));

  // Exact filename match (without extension)
  if (fileBase === matchKey) return 1.0;

  const normFile = normalizeForMatch(filename);
  const normKey = normalizeForMatch(matchKey);

  // Normalized exact match
  if (normFile === normKey) return 0.9;

  // Partial: one contains the other (normalized)
  if (normFile.includes(normKey) || normKey.includes(normFile)) return 0.5;

  return 0;
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Match a list of files to recipients using the given rule.
 * Returns one MatchResult per recipient.
 */
export function matchDocumentsToRecipients(
  files: FileEntry[],
  recipients: RecipientRow[],
  rule: MatchRule
): MatchResult[] {
  // Pre-build match keys for every recipient
  const recipientKeys = recipients.map((r) => buildMatchKey(r, rule));

  // Track which files have been claimed (for duplicate detection)
  const claimedBy = new Map<string, string[]>(); // filename → [recipientId...]

  // Score every (recipient, file) pair
  type ScoredPair = { file: FileEntry; score: number };
  const candidatesPerRecipient: ScoredPair[][] = recipients.map((recipient, ri) => {
    const key = recipientKeys[ri];
    if (!key) return [];
    return files
      .map((f) => ({ file: f, score: scoreMatch(f.name, key) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);
  });

  // Build results
  const results: MatchResult[] = recipients.map((recipient, ri) => {
    const candidates = candidatesPerRecipient[ri];

    if (candidates.length === 0) {
      return { recipient, confidence: 0, status: 'unmatched' };
    }

    const best = candidates[0];
    const runners = candidates.filter((c) => c.score === best.score && c.file.name !== best.file.name);

    // Register claim
    const existing = claimedBy.get(best.file.name) ?? [];
    existing.push(recipient.id);
    claimedBy.set(best.file.name, existing);

    if (runners.length > 0) {
      // Multiple files with the same best score → ambiguous
      return {
        recipient,
        matchedFile: best.file,
        confidence: best.score,
        status: 'ambiguous'
      };
    }

    return {
      recipient,
      matchedFile: best.file,
      confidence: best.score,
      status: 'matched'
    };
  });

  // Second pass: mark duplicates (multiple recipients matched to same file)
  for (const [filename, recipientIds] of claimedBy) {
    if (recipientIds.length > 1) {
      for (const result of results) {
        if (
          result.matchedFile?.name === filename &&
          result.status === 'matched'
        ) {
          result.status = 'duplicate';
        }
      }
    }
  }

  return results;
}

/**
 * Return an array of filenames that appear more than once in the list.
 */
export function detectDuplicateFilenames(files: FileEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const f of files) {
    counts.set(f.name, (counts.get(f.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
}
