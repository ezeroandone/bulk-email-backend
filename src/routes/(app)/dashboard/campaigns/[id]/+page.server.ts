import { error } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = requireSession(locals);

  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select(`
      id, name, status, mode,
      config_snapshot,
      recipient_count,
      credits_reserved, created_at, started_at, completed_at
    `)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    error(404, 'Campaign not found');
  }

  // Initial stats snapshot
  const { data: jobStats } = await locals.supabase
    .from('delivery_jobs')
    .select('status')
    .eq('campaign_id', params.id);

  const counts: Record<string, number> = {};
  for (const job of jobStats ?? []) {
    const s = job.status as string;
    counts[s] = (counts[s] ?? 0) + 1;
  }

  // Load first page of recipients for the table
  const { data: recipients } = await locals.supabase
    .from('campaign_recipients')
    .select(`
      id, email, status, row_data,
      delivery_jobs(attempt_count, error, updated_at)
    `)
    .eq('campaign_id', params.id)
    .order('id', { ascending: true })
    .range(0, 49);

  return {
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
    },
    recipients: recipients ?? []
  };
};
