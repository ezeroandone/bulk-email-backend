import { createHash, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';
import * as net from 'net';
import * as path from 'path';

// ── Input sanitization ────────────────────────────────────────────────────────

/**
 * Strip HTML tags from a string to prevent XSS in plain-text contexts.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Truncate user-supplied strings to a safe maximum before storing.
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  return stripHtml(input.trim()).slice(0, maxLength);
}

/**
 * Normalize an email address to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Escape characters that have special meaning in CSV.
 * Wraps the value in double-quotes if it contains a comma, newline, or quote.
 */
export function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ── SSRF protection ───────────────────────────────────────────────────────────

/** Private IPv4 CIDR ranges that must not be fetched by the server. */
const BLOCKED_IPV4_RANGES: Array<{ base: bigint; mask: bigint }> = [
  // 0.0.0.0/8
  { base: 0n, mask: 0xff000000n },
  // 10.0.0.0/8
  { base: 0x0a000000n, mask: 0xff000000n },
  // 100.64.0.0/10 (CGNAT)
  { base: 0x64400000n, mask: 0xffc00000n },
  // 127.0.0.0/8 (loopback)
  { base: 0x7f000000n, mask: 0xff000000n },
  // 169.254.0.0/16 (link-local / AWS metadata)
  { base: 0xa9fe0000n, mask: 0xffff0000n },
  // 172.16.0.0/12
  { base: 0xac100000n, mask: 0xfff00000n },
  // 192.0.0.0/24 (IETF protocol)
  { base: 0xc0000000n, mask: 0xffffff00n },
  // 192.168.0.0/16
  { base: 0xc0a80000n, mask: 0xffff0000n },
  // 198.18.0.0/15 (benchmarking)
  { base: 0xc6120000n, mask: 0xfffe0000n },
  // 198.51.100.0/24 (documentation)
  { base: 0xc6336400n, mask: 0xffffff00n },
  // 203.0.113.0/24 (documentation)
  { base: 0xcb007100n, mask: 0xffffff00n },
  // 224.0.0.0/4 (multicast)
  { base: 0xe0000000n, mask: 0xf0000000n },
  // 240.0.0.0/4 (reserved)
  { base: 0xf0000000n, mask: 0xf0000000n },
  // 255.255.255.255/32 (broadcast)
  { base: 0xffffffffn, mask: 0xffffffffn }
];

function ipv4ToBigInt(ip: string): bigint | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0n;
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return null;
    result = (result << 8n) | BigInt(num);
  }
  return result;
}

/**
 * Return true when an IPv4 address falls within a blocked private range.
 */
export function isBlockedIpv4(ip: string): boolean {
  const addr = ipv4ToBigInt(ip);
  if (addr === null) return false;
  return BLOCKED_IPV4_RANGES.some(({ base, mask }) => (addr & mask) === base);
}

/**
 * Return true for IPv6 addresses that are loopback or link-local.
 */
export function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // ::1 loopback
  if (normalized === '::1') return true;
  // fe80::/10 link-local
  if (normalized.startsWith('fe80:')) return true;
  // fc00::/7 unique local
  const firstByte = parseInt(normalized.substring(0, 2), 16);
  if (!isNaN(firstByte) && (firstByte & 0xfe) === 0xfc) return true;
  return false;
}

/**
 * Check whether a hostname resolves to a blocked (private / loopback) IP.
 * Pass the pre-resolved IP string to avoid a DNS lookup inside this helper.
 */
export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (net.isIPv6(ip)) return isBlockedIpv6(ip);
  return false;
}

/**
 * Validate that a URL is safe to fetch from the server.
 * - Must use https:
 * - Host must not be localhost or a private IP
 * Throws if the URL is blocked.
 */
export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed for server-side requests');
  }

  const { hostname } = parsed;

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  // If hostname is a bare IP, check it immediately.
  if (net.isIP(hostname) !== 0) {
    if (isBlockedIp(hostname)) {
      throw new Error(`Blocked IP address: ${hostname}`);
    }
  }

  return parsed;
}

// ── ZIP path traversal protection ────────────────────────────────────────────

/**
 * Return true if a ZIP entry path contains directory traversal sequences.
 * Use this when extracting ZIP archives to prevent path traversal attacks.
 */
export function isZipPathTraversal(entryPath: string): boolean {
  const normalized = path.normalize(entryPath);

  // Absolute path
  if (path.isAbsolute(normalized)) return true;

  // Traversal: starts with ../ after normalizing
  if (normalized.startsWith('..')) return true;

  // Null bytes in path
  if (entryPath.includes('\0')) return true;

  // Windows-style traversal
  if (entryPath.includes('.\\') || entryPath.includes('..\\')) return true;

  return false;
}

// ── Content-type validation ───────────────────────────────────────────────────

const ALLOWED_SPREADSHEET_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/plain',
  'application/csv'
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf'
]);

export function isAllowedSpreadsheetType(mimeType: string): boolean {
  return ALLOWED_SPREADSHEET_TYPES.has(mimeType.toLowerCase().split(';')[0].trim());
}

export function isAllowedDocumentType(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.has(mimeType.toLowerCase().split(';')[0].trim());
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

/**
 * Create an HMAC-SHA256 hex digest for verifying webhook payloads.
 */
export function createHmacSha256(secret: string, payload: string): string {
  return createHash('sha256')
    .update(secret)
    .update(payload)
    .digest('hex');
}

/**
 * Timing-safe comparison of two strings (prevents timing attacks).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const aBuffer = enc.encode(a);
  const bBuffer = enc.encode(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return cryptoTimingSafeEqual(aBuffer, bBuffer);
}
