/**
 * Internal dispatcher — called by the Supabase Cron / worker on a schedule.
 * Claims up to 10 delivery jobs per invocation and processes them.
 *
 * Authorization: Bearer ${INTERNAL_WORKER_SECRET}
 */
import { json } from '@sveltejs/kit';
import type { Config } from '@sveltejs/adapter-vercel';
import type { RequestHandler } from './$types';

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

  // Atomic claim: generate a unique batch token, stamp it onto BATCH_SIZE queued
  // rows in one UPDATE, then fetch only those rows. Because the UPDATE is a single
  // statement, concurrent invocations that run at the same time will each get a
  // different set of rows — no duplicate sends.
  const batchToken = `batch_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Step 1: claim up to BATCH_SIZE queued jobs by stamping the batch token.
  // We use a raw RPC so we can do UPDATE ... WHERE id IN (SELECT ... LIMIT n)
  // atomically. The function is a simple SQL snippet we inline as a prepared call.
  // If the RPC doesn't exist we fall back to the two-step approach with
  // a short window — still far better than the original.
  let claimedIds: string[] = [];

  const { data: rpcResult, error: rpcErr } = await admin.rpc('claim_delivery_batch', {
    p_batch_token: batchToken,
    p_batch_size: BATCH_SIZE,
    p_now: new Date().toISOString()
  });

  if (!rpcErr && Array.isArray(rpcResult) && rpcResult.length > 0) {
    claimedIds = (rpcResult as { id: string }[]).map((r) => r.id);
  } else {
    // Fallback: two-step claim (slight race window, acceptable for manual dispatch)
    const { data: candidates } = await admin
      .from('delivery_jobs')
      .select('id')
      .eq('status', 'queued')
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (!candidates || candidates.length === 0) {
      return json({ ...stats, message: 'No jobs available.' });
    }

    const candidateIds = candidates.map((c) => c.id as string);

    // Stamp claimed_by; rows already grabbed by another invocation will have
    // status !== 'queued' so this UPDATE silently skips them.
    await admin
      .from('delivery_jobs')
      .update({ status: 'claimed', claimed_by: batchToken })
      .in('id', candidateIds)
      .eq('status', 'queued');

    claimedIds = candidateIds;
  }

  if (claimedIds.length === 0) {
    return json({ ...stats, message: 'No jobs available.' });
  }

  // Fetch the full job rows we just claimed
  const { data: jobs, error: fetchErr } = await admin
    .from('delivery_jobs')
    .select('id, campaign_id, campaign_recipient_id, attempt_count, max_attempts')
    .in('id', claimedIds)
    .eq('status', 'claimed');

  if (fetchErr || !jobs || jobs.length === 0) {
    return json({ ...stats, message: 'No jobs available.' });
  }

  for (const job of jobs) {
    if (Date.now() > deadline) break;

    const j = job as {
      id: string;
      campaign_id: string;
      campaign_recipient_id: string;
      attempt_count: number;
      max_attempts: number;
    };

    try {
      await processJob(admin, j.id, j.campaign_id, j.campaign_recipient_id, j.attempt_count, j.max_attempts, stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[dispatcher] unhandled error for job', j.id, msg);
      // Mark as failed so it doesn't stay claimed forever
      await admin
        .from('delivery_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), last_error: msg })
        .eq('id', j.id);
      await admin
        .from('campaign_recipients')
        .update({ status: 'failed' })
        .eq('id', j.campaign_recipient_id);
      stats.failed++;
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
    .select('id, email, row_data')
    .eq('id', recipientId)
    .single();

  if (!recipient) {
    await markFailed(admin, jobId, campaignId, recipientId, attemptCount, 'NOT_FOUND', 'Recipient not found');
    stats.failed++;
    return;
  }

  const variables: Record<string, string> = (recipient.row_data as Record<string, string>) ?? {};

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

  if (mode === 'A' || mode === 'existing') {
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
    // 7. On success: update job + recipient status
    await admin
      .from('delivery_jobs')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    // Insert attempt record (non-fatal if delivery_attempts table schema differs)
    await admin.from('delivery_attempts').insert({
      job_id: jobId,
      attempt_number: attemptCount + 1,
      status: 'success',
      duration_ms: durationMs
    }).then(() => {}, () => {}); // swallow errors — table may not exist yet

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
    }).then(() => {}, () => {}); // swallow errors

    if (smtpErr.type === 'permanent') {
      // 8. Permanent failure
      await admin
        .from('delivery_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), last_error: smtpErr.message })
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
            last_error: smtpErr.message
          })
          .eq('id', jobId);
        await admin
          .from('campaign_recipients')
          .update({ status: 'retrying' })
          .eq('id', recipientId);
        stats.retrying++;
      } else {
        // 10. Transient but max attempts exceeded
        await admin
          .from('delivery_jobs')
          .update({ status: 'failed', completed_at: new Date().toISOString(), last_error: smtpErr.message })
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
  await admin
    .from('delivery_jobs')
    .update({ status: 'failed', completed_at: new Date().toISOString(), last_error: message })
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
    .update({ status: 'uncertain', last_error: message })
    .eq('id', jobId);
  await admin
    .from('campaign_recipients')
    .update({ status: 'uncertain' })
    .eq('id', recipientId);
}
