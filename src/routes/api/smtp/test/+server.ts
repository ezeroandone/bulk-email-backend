import { json } from '@sveltejs/kit';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { requireSession } from '$lib/server/auth/session';
import { decryptPassword } from '$lib/server/services/smtp/encryption';
import { validateSmtpHost, SmtpSsrfError } from '$lib/server/security/ssrf';
import type { RequestHandler } from './$types';

const RequestSchema = z.object({
  config_id: z.string().uuid('Invalid config_id')
});

export const POST: RequestHandler = async ({ request, locals }) => {
  // Auth check
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  const { config_id } = parsed.data;

  // Load config from DB — NEVER from client payload
  const { data: cfg, error: dbErr } = await locals.supabase
    .from('smtp_configurations')
    .select('id, host, port, tls, username_encrypted, password_encrypted, from_name, from_email')
    .eq('id', config_id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (dbErr || !cfg) {
    return json({ success: false, message: 'SMTP configuration not found.' }, { status: 404 });
  }

  // SSRF guard
  try {
    await validateSmtpHost(cfg.host as string);
  } catch (err: unknown) {
    if (err instanceof SmtpSsrfError) {
      return json({ success: false, message: err.message }, { status: 422 });
    }
    return json({ success: false, message: 'Host validation failed.' }, { status: 422 });
  }

  // Decrypt credentials (never log or return these)
  let username: string;
  let password: string;
  try {
    username = decryptPassword(cfg.username_encrypted as string);
    password = decryptPassword(cfg.password_encrypted as string);
  } catch {
    return json({ success: false, message: 'Failed to decrypt credentials. Please re-save the configuration.' }, { status: 500 });
  }

  // Build transporter
  const tls = cfg.tls as string;
  const transporter = nodemailer.createTransport({
    host: cfg.host as string,
    port: cfg.port as number,
    secure: tls === 'ssl',
    auth: { user: username, pass: password },
    tls: tls === 'starttls' ? { rejectUnauthorized: true } : undefined,
    requireTLS: tls === 'starttls',
    connectionTimeout: 10_000,
    greetingTimeout: 8_000
  });

  // Verify the connection
  try {
    await transporter.verify();

    // Mark as verified in the DB
    await locals.supabase
      .from('smtp_configurations')
      .update({ is_verified: true, last_tested_at: new Date().toISOString() })
      .eq('id', config_id)
      .eq('user_id', session.user.id);

    return json({ success: true, message: 'Connection successful. Your SMTP server is reachable and credentials are valid.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Update last_tested_at without setting is_verified
    await locals.supabase
      .from('smtp_configurations')
      .update({ is_verified: false, last_tested_at: new Date().toISOString() })
      .eq('id', config_id)
      .eq('user_id', session.user.id);

    // Sanitize the error — don't echo back server internals
    const lc = message.toLowerCase();
    const safeMessage =
      lc.includes('invalid login') || lc.includes('535') || lc.includes('authentication') || lc.includes('username and password')
        ? 'Authentication failed. For Gmail, use an App Password (not your Google account password). Generate one at myaccount.google.com/apppasswords.'
        : lc.includes('connect') || lc.includes('econnrefused') || lc.includes('etimedout')
          ? 'Could not connect to the SMTP server. Check host and port.'
          : lc.includes('certificate') || lc.includes('ssl') || lc.includes('tls')
            ? 'TLS/SSL error. Try a different encryption setting.'
            : 'Connection failed. Verify your SMTP settings.';

    return json({ success: false, message: safeMessage });
  } finally {
    transporter.close();
    // Overwrite sensitive variables (best-effort GC help)
    username = '';
    password = '';
  }
};
