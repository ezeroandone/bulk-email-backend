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

  // Stats: use campaign_recipients for terminal states (correctly updated by dispatcher)
  // and delivery_jobs for in-flight states (queued/claimed)
  const { data: jobStats } = await locals.supabase
    .from('delivery_jobs')
    .select('status')
    .eq('campaign_id', params.id);

  const { data: recipientStats } = await locals.supabase
    .from('campaign_recipients')
    .select('status')
    .eq('campaign_id', params.id);

  const jCounts: Record<string, number> = {};
  for (const job of jobStats ?? []) {
    const s = job.status as string;
    jCounts[s] = (jCounts[s] ?? 0) + 1;
  }

  const rCounts: Record<string, number> = {};
  for (const r of recipientStats ?? []) {
    const s = r.status as string;
    rCounts[s] = (rCounts[s] ?? 0) + 1;
  }

  // Load first page of recipients (separate query to avoid FK ambiguity)
  const { data: recipientRows } = await locals.supabase
    .from('campaign_recipients')
    .select('id, email, status, row_data')
    .eq('campaign_id', params.id)
    .order('id', { ascending: true })
    .range(0, 49);

  const recipientIds = (recipientRows ?? []).map((r) => r.id as string);
  const jobMap: Record<string, { attempt_count: number; error: string | null; updated_at: string }> = {};

  if (recipientIds.length > 0) {
    const { data: jobs } = await locals.supabase
      .from('delivery_jobs')
      .select('campaign_recipient_id, attempt_count, last_error, updated_at')
      .eq('campaign_id', params.id)
      .in('campaign_recipient_id', recipientIds);

    for (const j of jobs ?? []) {
      jobMap[j.campaign_recipient_id as string] = {
        attempt_count: (j.attempt_count as number) ?? 0,
        error: j.last_error as string | null,
        updated_at: j.updated_at as string
      };
    }
  }

  const recipients = (recipientRows ?? []).map((r) => ({
    ...r,
    delivery_job: jobMap[r.id as string] ?? null
  }));

  return {
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
    },
    recipients: recipients ?? []
  };
};
