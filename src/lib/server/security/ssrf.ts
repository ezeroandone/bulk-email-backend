/**
 * SSRF (Server-Side Request Forgery) protection for SMTP host validation.
 * Blocks private/loopback/metadata IP ranges and hostnames before any
 * outbound connection is made.
 */
import { lookup } from 'node:dns/promises';

export class SmtpSsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmtpSsrfError';
  }
}

/** Blocked literal hostnames / metadata endpoints. */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
  'instance-data.ec2.internal'
]);

/**
 * Returns true if the IP address string falls within a private/reserved range.
 * Handles IPv4 only; IPv6 loopback (::1) is also blocked.
 */
function isBlockedIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1' || ip.toLowerCase() === '0:0:0:0:0:0:0:1') return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return false;

  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;

  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (link-local / APIPA / cloud metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (172.16.x.x – 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // 0.0.0.0/8
  if (a === 0) return true;

  return false;
}

/**
 * Validate that an SMTP hostname is safe to connect to.
 * Throws {@link SmtpSsrfError} if the hostname resolves to a private/reserved
 * address or matches a blocked literal hostname.
 *
 * @param hostname - The SMTP host string entered by the user.
 */
export async function validateSmtpHost(hostname: string): Promise<void> {
  const h = hostname.trim().toLowerCase();

  if (!h) {
    throw new SmtpSsrfError('SMTP host must not be empty.');
  }

  // Block known bad literals immediately — no DNS needed
  if (BLOCKED_HOSTNAMES.has(h)) {
    throw new SmtpSsrfError(`SMTP host "${hostname}" is not allowed.`);
  }

  // If the host looks like a bare IP address, validate it directly
  const ipv4Pattern = /^\d{1,3}(\.\d{1,3}){3}$/;
  if (ipv4Pattern.test(h)) {
    if (isBlockedIp(h)) {
      throw new SmtpSsrfError(`SMTP host "${hostname}" is a private/reserved IP address and is not allowed.`);
    }
    return;
  }

  // Resolve hostname to IP(s) and check each one
  let addresses: string[];
  try {
    const results = await lookup(hostname, { all: true });
    addresses = results.map((r: { address: string }) => r.address);
  } catch {
    // If DNS resolution fails entirely, let nodemailer handle the connection error
    // rather than silently allowing it — rethrow as SSRF error for safety.
    throw new SmtpSsrfError(`Could not resolve SMTP host "${hostname}". Verify the hostname is correct.`);
  }

  for (const addr of addresses) {
    if (isBlockedIp(addr)) {
      throw new SmtpSsrfError(
        `SMTP host "${hostname}" resolves to a private/reserved IP address and is not allowed.`
      );
    }
  }
}
