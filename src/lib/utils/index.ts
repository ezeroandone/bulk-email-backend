import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';

// ── Class names helper ────────────────────────────────────────────────────────

/**
 * Merge Tailwind CSS classes with clsx, resolving conflicts using tailwind-merge.
 * @example cn('px-4 py-2', condition && 'font-bold', 'px-6') // → 'py-2 font-bold px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Date formatting ───────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date into a localized human-readable string.
 */
export function formatDate(
  input: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  locale = 'en-NG'
): string {
  if (input == null) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format a date with time.
 */
export function formatDateTime(
  input: string | Date | null | undefined,
  locale = 'en-NG'
): string {
  return formatDate(
    input,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    locale
  );
}

/**
 * Return a relative time string (e.g. "2 minutes ago").
 */
export function formatRelativeTime(input: string | Date | null | undefined): string {
  if (input == null) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 7) return rtf.format(-days, 'day');
  if (weeks < 4) return rtf.format(-weeks, 'week');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

// ── Currency formatting ───────────────────────────────────────────────────────

/**
 * Convert an amount in kobo (smallest NGN unit) to a formatted Naira string.
 * @example formatCurrency(150000) → "₦1,500.00"
 */
export function formatCurrency(
  kobo: number | null | undefined,
  currency = 'NGN',
  locale = 'en-NG'
): string {
  if (kobo == null) return '—';
  const amount = kobo / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ── String utilities ──────────────────────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * @example slugify("Hello World!") → "hello-world"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if needed.
 * @example truncate("Hello World", 8) → "Hello..."
 */
export function truncate(input: string, maxLength: number, suffix = '...'): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - suffix.length) + suffix;
}

// ── ID generation ─────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe random ID using nanoid.
 * @param size - character length (default: 21)
 */
export function generateId(size = 21): string {
  return nanoid(size);
}

// ── File size formatting ──────────────────────────────────────────────────────

/**
 * Format a byte count into a human-readable file size string.
 * @example formatFileSize(1536) → "1.5 KB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  const decimals = exp === 0 ? 0 : 1;

  return `${value.toFixed(decimals)} ${units[exp]}`;
}

// ── Number formatting ─────────────────────────────────────────────────────────

/**
 * Format a number with locale-aware thousands separators.
 * @example formatNumber(1234567) → "1,234,567"
 */
export function formatNumber(value: number | null | undefined, locale = 'en-NG'): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale).format(value);
}

// ── Object helpers ────────────────────────────────────────────────────────────

/**
 * Pick only specified keys from an object.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>
  );
}

/**
 * Omit specified keys from an object.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

/** Promisified setTimeout. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
