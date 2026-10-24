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

  // Load live stats from delivery_jobs
  const { data: jobStats } = await locals.supabase
    .from('delivery_jobs')
    .select('status')
    .eq('campaign_id', id);

  const counts: Record<string, number> = {};
  for (const job of jobStats ?? []) {
    const s = job.status as string;
    counts[s] = (counts[s] ?? 0) + 1;
  }

  return json({
    success: true,
    data: {
      campaign,
      stats: {
        total: (jobStats ?? []).length,
        queued: counts['queued'] ?? 0,
        claimed: counts['claimed'] ?? 0,
        accepted: counts['accepted'] ?? 0,
        failed: counts['failed'] ?? 0,
        retrying: counts['retrying'] ?? 0,
        cancelled: counts['cancelled'] ?? 0,
        uncertain: counts['uncertain'] ?? 0
      }
    }
  });
};
