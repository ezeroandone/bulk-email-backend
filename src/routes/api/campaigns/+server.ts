/**
 * GET  /api/campaigns — paginated list, filtered by status
 * POST /api/campaigns — create a new campaign and enqueue jobs
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

// ── Validation schema ─────────────────────────────────────────────────────────

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  mode: z.enum(['A', 'B', 'C']),
  dataset_id: z.string().uuid(),
  smtp_config_id: z.string().uuid(),
  subject_template: z.string().min(1).max(998),
  body_html: z.string().min(1),
  recipient_email_column: z.string().min(1),
  recipient_name_column: z.string().optional(),
  /** Mode A: file match config JSON */
  file_match_config: z.unknown().optional(),
  /** Mode B: template id */
  template_id: z.string().uuid().optional(),
  /** Mode B: PDF field config JSON */
  pdf_field_config: z.unknown().optional(),
  /** Rows to exclude (0-based indices) */
  excluded_row_indices: z.array(z.number().int().nonnegative()).optional()
});

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, url }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size') ?? 20)));
  const offset = (page - 1) * pageSize;
  const status = url.searchParams.get('status') ?? '';
  const search = url.searchParams.get('q') ?? '';

  let query = locals.supabase
    .from('campaigns')
    .select(
      'id, name, status, mode, recipient_count, created_at',
      { count: 'exact' }
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, count, error } = await query;

  if (error) {
    return json({ success: false, error: 'Failed to load campaigns.' }, { status: 500 });
  }

  return json({
    success: true,
    data: {
      campaigns: data ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize)
    }
  });
};

// ── POST ──────────────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ locals, request }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      success: false,
      error: 'Validation failed.',
      details: parsed.error.flatten().fieldErrors
    }, { status: 422 });
  }

  const d = parsed.data;

  // 1. Validate auth already done. Validate dataset ownership + row count
  const { data: dataset, error: dsErr } = await locals.supabase
    .from('datasets')
    .select('id, row_count, columns, preview_rows')
    .eq('id', d.dataset_id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (dsErr || !dataset) {
    return json({ success: false, error: 'Dataset not found.' }, { status: 404 });
  }

  if ((dataset.row_count as number) <= 0) {
    return json({ success: false, error: 'Dataset has no rows.' }, { status: 422 });
  }

  // 2. Validate SMTP config ownership
  const { data: smtpCfg, error: smtpErr } = await locals.supabase
    .from('smtp_configurations')
    .select('id')
    .eq('id', d.smtp_config_id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (smtpErr || !smtpCfg) {
    return json({ success: false, error: 'SMTP configuration not found.' }, { status: 404 });
  }

  // 3. Load dataset rows to determine eligible recipients
  const { data: datasetRows, error: rowsErr } = await locals.supabase
    .from('dataset_rows')
    .select('id, row_index, data')
    .eq('dataset_id', d.dataset_id)
    .order('row_index', { ascending: true });

  if (rowsErr || !datasetRows) {
    return json({ success: false, error: 'Failed to load dataset rows.' }, { status: 500 });
  }

  const excludedSet = new Set(d.excluded_row_indices ?? []);
  const eligibleRows = datasetRows.filter((r) => !excludedSet.has(r.row_index as number));

  if (eligibleRows.length === 0) {
    return json({ success: false, error: 'No eligible recipients after exclusions.' }, { status: 422 });
  }

  // 4. Calculate credits required (one per eligible recipient)
  // Never trust the client for the credit amount — compute server-side
  const creditRequired = eligibleRows.length;

  // 5. Reserve credits via DB function
  const { error: creditErr } = await locals.supabase.rpc('reserve_credits', {
    p_user_id: session.user.id,
    p_amount: creditRequired,
    p_reference: 'campaign_pending'
  });

  if (creditErr) {
    const msg = creditErr.message ?? '';
    if (msg.includes('insufficient') || msg.includes('balance')) {
      return json({ success: false, error: 'Insufficient credits.' }, { status: 402 });
    }
    return json({ success: false, error: 'Failed to reserve credits.' }, { status: 500 });
  }

  // 6. Insert campaign record
  const { data: campaign, error: campErr } = await locals.supabase
    .from('campaigns')
    .insert({
      user_id: session.user.id,
      name: d.name,
      status: d.mode === 'A' ? 'draft' : 'queued',
      mode: d.mode,
      dataset_id: d.dataset_id,
      smtp_config_id: d.smtp_config_id,
      config_snapshot: {
        subject_template: d.subject_template,
        body_html: d.body_html,
        recipient_email_column: d.recipient_email_column,
        recipient_name_column: d.recipient_name_column ?? null,
        file_match_config: d.file_match_config ?? null,
        template_id: d.template_id ?? null,
        pdf_field_config: d.pdf_field_config ?? null,
      },
      recipient_count: eligibleRows.length,
      credits_reserved: creditRequired
    })
    .select('id')
    .single();

  if (campErr || !campaign) {
    // Release credits on campaign creation failure
    await Promise.resolve(locals.supabase.rpc('release_credits', {
      p_user_id: session.user.id,
      p_amount: creditRequired
    })).catch(() => null);
    return json({ success: false, error: 'Failed to create campaign.' }, { status: 500 });
  }

  const campaignId = campaign.id as string;

  // 7. Insert campaign_recipients rows (one per eligible dataset row)
  const recipientInserts = eligibleRows.map((row) => {
    const rowData = row.data as Record<string, string>;
    const email = rowData[d.recipient_email_column] ?? '';
    const name = d.recipient_name_column ? (rowData[d.recipient_name_column] ?? null) : null;
    return {
      campaign_id: campaignId,
      dataset_row_id: row.id,
      row_index: row.row_index,
      email,
      name,
      variables: rowData,
      status: 'queued'
    };
  });

  const { data: recipients, error: recErr } = await locals.supabase
    .from('campaign_recipients')
    .insert(recipientInserts)
    .select('id');

  if (recErr || !recipients) {
    return json({ success: false, error: 'Failed to create recipients.' }, { status: 500 });
  }

  // 8. Insert delivery_jobs rows
  const jobInserts = recipients.map((r) => ({
    campaign_id: campaignId,
    recipient_id: r.id,
    status: d.mode === 'A' ? 'draft' : 'queued',
    attempt_count: 0,
    max_attempts: 3
  }));

  const { data: jobs, error: jobsErr } = await locals.supabase
    .from('delivery_jobs')
    .insert(jobInserts)
    .select('id');

  if (jobsErr || !jobs) {
    return json({ success: false, error: 'Failed to create delivery jobs.' }, { status: 500 });
  }

  // 9. Enqueue job IDs to pgmq queue 'email_delivery' (skip for Mode A — awaiting file matches)
  if (d.mode !== 'A') {
    const jobIds = jobs.map((j) => j.id as string);
    await Promise.resolve(locals.supabase.rpc('pgmq_send_batch', {
      queue_name: 'email_delivery',
      messages: jobIds.map((id) => JSON.stringify({ job_id: id }))
    })).catch((err: unknown) => {
      // Non-fatal — the cron will pick these up anyway
      console.warn('[campaigns] pgmq_send_batch failed:', err instanceof Error ? err.message : err);
    });
  }

  return json({ success: true, data: { campaign_id: campaignId } }, { status: 201 });
};
