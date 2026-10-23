/**
 * SMTP mailer — wraps nodemailer with error classification.
 * Never logs passwords; only logs host, port, and messageId on success.
 */
import nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer/index.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DecryptedSmtpConfig {
  id: string;
  host: string;
  port: number;
  /** 'ssl' | 'starttls' | 'none' */
  tls: string;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  timeoutMs?: number;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export type ErrorType = 'permanent' | 'transient' | 'uncertain';

export interface SmtpError {
  type: ErrorType;
  code: string;
  message: string;
}

export interface SendResult {
  success: true;
  messageId: string;
}

export type SendOutcome = SendResult | { success: false; error: SmtpError };

// ── Error classification ──────────────────────────────────────────────────────

const PERMANENT_CODES = new Set(['EAUTH', 'EENVELOPE']);
const PERMANENT_SMTP = new Set([550, 551, 552, 553, 554]);
const TRANSIENT_CODES = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET']);
const TRANSIENT_SMTP = new Set([421, 450, 451, 452]);

function classifyError(err: unknown): SmtpError {
  const e = err as Record<string, unknown>;
  const code = typeof e['code'] === 'string' ? e['code'] : '';
  const rawMsg = err instanceof Error ? err.message : String(err);

  // Try to extract numeric SMTP response code
  const smtpCodeMatch = /\b([45]\d\d)\b/.exec(rawMsg);
  const smtpCode = smtpCodeMatch ? parseInt(smtpCodeMatch[1], 10) : 0;

  if (PERMANENT_CODES.has(code) || PERMANENT_SMTP.has(smtpCode)) {
    return { type: 'permanent', code: code || String(smtpCode), message: sanitizeError(rawMsg) };
  }
  if (TRANSIENT_CODES.has(code) || TRANSIENT_SMTP.has(smtpCode)) {
    return { type: 'transient', code: code || String(smtpCode), message: sanitizeError(rawMsg) };
  }

  // Connection dropped mid-send or unknown
  return { type: 'uncertain', code: code || 'UNKNOWN', message: sanitizeError(rawMsg) };
}

/** Strip any credentials or internal paths from error messages */
function sanitizeError(msg: string): string {
  // Remove anything that looks like a password/auth token
  return msg
    .replace(/pass(word)?[= :]+\S+/gi, '[redacted]')
    .replace(/auth[= :]+\S+/gi, '[redacted]')
    .slice(0, 500);
}

// ── Mailer ────────────────────────────────────────────────────────────────────

/**
 * Send one email using the provided decrypted SMTP config.
 * Returns a discriminated union: { success: true, messageId } | { success: false, error }
 */
export async function sendEmail(
  config: DecryptedSmtpConfig,
  message: EmailMessage
): Promise<SendOutcome> {
  const secure = config.tls === 'ssl';
  const requireTLS = config.tls === 'starttls';

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: {
      user: config.username,
      pass: config.password
    },
    tls: requireTLS ? { rejectUnauthorized: true } : undefined,
    requireTLS,
    connectionTimeout: config.timeoutMs ?? 15_000,
    greetingTimeout: 8_000,
    socketTimeout: config.timeoutMs ?? 15_000
  });

  try {
    const attachments: Attachment[] = (message.attachments ?? []).map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType
    }));

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      replyTo: config.replyTo ?? undefined,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments
    });

    // Never log password — only host, port, messageId
    console.info('[mailer] sent', {
      host: config.host,
      port: config.port,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId ?? '' };
  } catch (err: unknown) {
    return { success: false, error: classifyError(err) };
  } finally {
    transporter.close();
    // Overwrite sensitive strings in memory (best-effort)
    (config as { password: string }).password = '';
  }
}
