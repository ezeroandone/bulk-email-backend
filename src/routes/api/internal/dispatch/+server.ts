/**
 * Internal dispatcher — called by the Supabase Cron / worker on a schedule.
 * Claims up to 10 delivery jobs per invocation and processes them.
 *
 * Authorization: Bearer ${INTERNAL_WORKER_SECRET}
 */
import { json } from '@sveltejs/kit';
import type { Config, RequestHandler } from './$types';

/** Give this serverless function 30 seconds (Vercel adapter config). */
export const config: Config = {
  maxDuration: 30
};
import { privateEnv } from '$lib/server/env';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { substituteVariables } from '$lib/server/services/campaigns/variableSubstitution';
import { sendEmail } from '$lib/server/services/smtp/mailer';
import { decryptPassword } from '$lib/server/services/smtp/encryption';
import { generateDocx } from '$lib/server/services/documents/docxGenerator';
import { generateFromPdfTemplate } from '$lib/server/services/documents/pdfGenerator';
import type { PdfFieldDef } from '$lib/server/services/documents/pdfGenerator';
import type { DecryptedSmtpConfig, EmailAttachment } from '$lib/server/services/smtp/mailer';

// ── Constants ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 10;
const DEADLINE_MS = 25_000; // Vercel function limit

// ── Types ─────────────────────────────────────────────────────────────────────

interface DispatchStats {
  processed: number;
  accepted: number;
  failed: number;
  retrying: number;
  uncertain: number;
}

// ── Auth guard ────────────────────────────────────────────────────────────────

function checkAuth(request: Request): boolean {
  const header = request.headers.get('Authorization') ?? '';
  const secret = privateEnv.INTERNAL_WORKER_SECRET;
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

// ── Plain-text fallback ───────────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .trim();
}

// ── Exponential backoff helper ────────────────────────────────────────────────

function nextAttemptAt(attemptCount: number): string {
  const delaySecs = Math.pow(2, attemptCount) * 60;
  return new Date(Date.now() + delaySecs * 1000).toISOString();
}

// ── Main handler ──────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
  // Auth
  if (!checkAuth(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deadline = Date.now() + DEADLINE_MS;
  const admin = createSupabaseAdminClient();
  const stats: DispatchStats = { processed: 0, accepted: 0, failed: 0, retrying: 0, uncertain: 0 };

  // Claim a batch of jobs
  const { data: jobs, error: claimErr } = await admin.rpc('claim_delivery_jobs', {
    batch_size: BATCH_SIZE
  });

  if (claimErr) {
    console.error('[dispatcher] claim_delivery_jobs error', claimErr.message);
    return json({ error: 'Failed to claim jobs.' }, { status: 500 });
  }

  if (!jobs || (jobs as unknown[]).length === 0) {
    return json({ ...stats, message: 'No jobs available.' });
  }

  for (const job of jobs as unknown[]) {
    if (Date.now() > deadline) break;

    const j = job as {
      id: string;
      campaign_id: string;
      recipient_id: string;
      attempt_count: number;
      max_attempts: number;
    };

    try {
      await processJob(admin, j.id, j.campaign_id, j.recipient_id, j.attempt_count, j.max_attempts, stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[dispatcher] unhandled error for job', j.id, msg);
      // Treat unexpected errors as uncertain
      await markUncertain(admin, j.id, j.campaign_id, j.recipient_id, j.attempt_count, 'UNHANDLED', msg);
      stats.uncertain++;
    }

    stats.processed++;
  }

  return json(stats);
};

// ── Job processor ─────────────────────────────────────────────────────────────

async function processJob(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  jobId: string,
  campaignId: string,
  recipientId: string,
  attemptCount: number,
  maxAttempts: number,
  stats: DispatchStats
): Promise<void> {
  const startMs = Date.now();

  // 1. Load recipient + dataset row variables
  const { data: recipient } = await admin
    .from('campaign_recipients')
    .select('id, email, variables, dataset_row_index')
    .eq('id', recipientId)
    .single();

  if (!recipient) {
    await markFailed(admin, jobId, campaignId, recipientId, attemptCount, 'NOT_FOUND', 'Recipient not found');
    stats.failed++;
    return;
  }

  const variables: Record<string, string> = (recipient.variables as Record<string, string>) ?? {};

  // 2. Load campaign — all template config lives in config_snapshot
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, mode, smtp_config_id, config_snapshot')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    await markFailed(admin, jobId, campaignId, recipientId, attemptCount, 'NO_CAMPAIGN', 'Campaign not found');
    stats.failed++;
    return;
  }

  const snap = (campaign.config_snapshot ?? {}) as Record<string, unknown>;

  // 3. Substitute variables in subject and body
  const subject = substituteVariables((snap.subject_template as string) ?? '', variables);
  const body = substituteVariables((snap.body_html as string) ?? '', variables);

  // 4. Handle attachment based on mode
  let attachment: EmailAttachment | null = null;
  const mode = campaign.mode as string;

  if (mode === 'A') {
    // Mode A: find the file_match for this recipient → get signed URL
    const { data: fileMatch } = await admin
      .from('file_matches')
      .select('document_assets!document_asset_id(name, storage_path, mime_type)')
      .eq('campaign_id', campaignId)
      .eq('campaign_recipient_id', recipientId)
      .maybeSingle();

    const asset = fileMatch
      ? (fileMatch.document_assets as unknown as { name: string; storage_path: string; mime_type: string } | null)
      : null;

    if (asset) {
      const { data: signedData } = await admin.storage
        .from('documents')
        .createSignedUrl(asset.storage_path, 300);

      if (signedData?.signedUrl) {
        const res = await fetch(signedData.signedUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          attachment = {
            filename: asset.name,
            content: buf,
            contentType: asset.mime_type
          };
        }
      }
    }
  } else if (mode === 'B') {
    // Mode B: generate document from template
    const templateId = snap.template_id as string | null;
    if (templateId) {
      const { data: tpl } = await admin
        .from('document_templates')
        .select('storage_path, type, name')
        .eq('id', templateId)
        .single();

      if (tpl) {
        const { data: tplFile } = await admin.storage
          .from('document-templates')
          .download(tpl.storage_path as string);

        if (tplFile) {
          const tplBuf = Buffer.from(await tplFile.arrayBuffer());
          const tplType = tpl.type as string; // 'docx' | 'pdf' | 'image'
          let genBuf: Buffer;
          let ext: string;
          let contentType: string;

          if (tplType === 'docx') {
            genBuf = await generateDocx(tplBuf, variables);
            ext = 'docx';
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (tplType === 'pdf') {
            const fields = (snap.pdf_field_config as PdfFieldDef[]) ?? [];
            genBuf = await generateFromPdfTemplate(tplBuf, fields, variables);
            ext = 'pdf';
            contentType = 'application/pdf';
          } else {
            genBuf = tplBuf;
            ext = 'pdf';
            contentType = 'application/pdf';
          }

          // Upload generated document
          const genPath = `generated/${campaignId}/${recipientId}.${ext}`;
          await admin.storage.from('generated-documents').upload(genPath, genBuf, {
            contentType,
            upsert: true
          });

          attachment = {
            filename: `${(tpl.name as string).replace(/\.[^.]+$/, '')}.${ext}`,
            content: genBuf,
            contentType
          };
        }
      }
    }
  }
  // Mode C: no attachment

  // 5. Decrypt SMTP config
  const { data: smtpRow } = await admin
    .from('smtp_configurations')
    .select('id, host, port, tls, username_encrypted, password_encrypted, from_name, from_email, reply_to, timeout_ms')
    .eq('id', campaign.smtp_config_id as string)
    .single();

  if (!smtpRow) {
    await markFailed(admin, jobId, campaignId, recipientId, attemptCount, 'NO_SMTP', 'SMTP config not found');
    stats.failed++;
    return;
  }

  let username: string;
  let password: string;
  try {
    username = decryptPassword(smtpRow.username_encrypted as string);
    password = decryptPassword(smtpRow.password_encrypted as string);
  } catch {
    await markFailed(admin, jobId, campaignId, recipientId, attemptCount, 'DECRYPT_FAIL', 'Failed to decrypt SMTP credentials');
    stats.failed++;
    return;
  }

  const smtpConfig: DecryptedSmtpConfig = {
    id: smtpRow.id as string,
    host: smtpRow.host as string,
    port: smtpRow.port as number,
    tls: smtpRow.tls as string,
    username,
    password,
    fromName: smtpRow.from_name as string,
    fromEmail: smtpRow.from_email as string,
    replyTo: smtpRow.reply_to as string | null,
    timeoutMs: (smtpRow.timeout_ms as number) ?? 15_000
  };

  // 6. Send email
  const result = await sendEmail(smtpConfig, {
    to: recipient.email as string,
    subject,
    html: body,
    text: htmlToText(body),
    attachments: attachment ? [attachment] : []
  });

  const durationMs = Date.now() - startMs;

  if (result.success) {
    // 7. On success: settle credit, update job status, insert attempt record
    await admin.rpc('settle_delivery_credit', { p_job_id: jobId });

    await admin
      .from('delivery_jobs')
      .update({ status: 'accepted', completed_at: new Date().toISOString(), message_id: result.messageId })
      .eq('id', jobId);

    await admin.from('delivery_attempts').insert({
      job_id: jobId,
      attempt_number: attemptCount + 1,
      status: 'success',
      smtp_response: result.messageId,
      duration_ms: durationMs
    });

    await admin
      .from('campaign_recipients')
      .update({ status: 'accepted' })
      .eq('id', recipientId);

    stats.accepted++;
  } else {
    const { error: smtpErr } = result;

    await admin.from('delivery_attempts').insert({
      job_id: jobId,
      attempt_number: attemptCount + 1,
      status: 'failure',
      error_code: smtpErr.code,
      error_message: smtpErr.message,
      duration_ms: durationMs
    });

    if (smtpErr.type === 'permanent') {
      // 8. Permanent failure
      await admin.rpc('release_reservation', { p_job_id: jobId });
      await admin
        .from('delivery_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), error: smtpErr.message })
        .eq('id', jobId);
      await admin
        .from('campaign_recipients')
        .update({ status: 'failed' })
        .eq('id', recipientId);
      stats.failed++;
    } else if (smtpErr.type === 'transient') {
      const newAttemptCount = attemptCount + 1;
      if (newAttemptCount < maxAttempts) {
        // 9. Transient — schedule retry
        await admin
          .from('delivery_jobs')
          .update({
            status: 'retrying',
            attempt_count: newAttemptCount,
            next_attempt_at: nextAttemptAt(newAttemptCount),
            error: smtpErr.message
          })
          .eq('id', jobId);
        await admin
          .from('campaign_recipients')
          .update({ status: 'retrying' })
          .eq('id', recipientId);
        stats.retrying++;
      } else {
        // 10. Transient but max attempts exceeded
        await admin.rpc('release_reservation', { p_job_id: jobId });
        await admin
          .from('delivery_jobs')
          .update({ status: 'failed', completed_at: new Date().toISOString(), error: smtpErr.message })
          .eq('id', jobId);
        await admin
          .from('campaign_recipients')
          .update({ status: 'failed' })
          .eq('id', recipientId);
        stats.failed++;
      }
    } else {
      // 11. Uncertain — keep reserved, do NOT retry, do NOT release
      await markUncertain(admin, jobId, campaignId, recipientId, attemptCount, smtpErr.code, smtpErr.message);
      stats.uncertain++;
    }
  }
}

// ── Status helpers ────────────────────────────────────────────────────────────

async function markFailed(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  jobId: string,
  _campaignId: string,
  recipientId: string,
  attemptCount: number,
  code: string,
  message: string
): Promise<void> {
  await admin.rpc('release_reservation', { p_job_id: jobId });
  await admin
    .from('delivery_jobs')
    .update({ status: 'failed', completed_at: new Date().toISOString(), error: message })
    .eq('id', jobId);
  await admin
    .from('campaign_recipients')
    .update({ status: 'failed' })
    .eq('id', recipientId);
}

async function markUncertain(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  jobId: string,
  _campaignId: string,
  recipientId: string,
  attemptCount: number,
  code: string,
  message: string
): Promise<void> {
  await admin
    .from('delivery_jobs')
    .update({ status: 'uncertain', error: message })
    .eq('id', jobId);
  await admin
    .from('campaign_recipients')
    .update({ status: 'uncertain' })
    .eq('id', recipientId);
}
