/**
 * GET /api/campaigns/[id] — full campaign details + stats
 */
import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const { data: campaign, error } = await locals.supabase
    .from('campaigns')
    .select(`
      id, name, status, mode,
      dataset_id, smtp_config_id,
      config_snapshot,
      recipient_count,
      credits_reserved,
      created_at, started_at, completed_at
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !campaign) {
    return json({ success: false, error: 'Campaign not found.' }, { status: 404 });
  }

  // Live stats: read from campaign_recipients (correctly updated by dispatcher)
  const { data: recipientStats } = await locals.supabase
    .from('campaign_recipients')
    .select('status')
    .eq('campaign_id', id);

  // Also read delivery_jobs for queued/claimed/retrying counts
  const { data: jobStats } = await locals.supabase
    .from('delivery_jobs')
    .select('status')
    .eq('campaign_id', id);

  const rCounts: Record<string, number> = {};
  for (const r of recipientStats ?? []) {
    const s = r.status as string;
    rCounts[s] = (rCounts[s] ?? 0) + 1;
  }

  const jCounts: Record<string, number> = {};
  for (const job of jobStats ?? []) {
    const s = job.status as string;
    jCounts[s] = (jCounts[s] ?? 0) + 1;
  }

  return json({
    success: true,
    data: {
      campaign,
      stats: {
        total: (jobStats ?? []).length,
        queued: jCounts['queued'] ?? 0,
        claimed: jCounts['claimed'] ?? 0,
        accepted: rCounts['accepted'] ?? 0,
        failed: rCounts['failed'] ?? 0,
        retrying: rCounts['retrying'] ?? 0,
        cancelled: jCounts['cancelled'] ?? 0,
        uncertain: rCounts['uncertain'] ?? 0
      }
    }
  });
};
