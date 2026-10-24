import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();

  // All campaigns with user name
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, name, mode, status, recipient_count, created_at, user_id, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  // Failed / uncertain delivery jobs with errors
  const { data: failedJobs } = await admin
    .from('delivery_jobs')
    .select('id, campaign_id, last_error, attempt_count, updated_at, campaigns(name)')
    .in('status', ['failed', 'cancelled'])
    .order('updated_at', { ascending: false })
    .limit(50);

  // Queue health: status counts
  const statuses = ['queued', 'processing', 'accepted', 'failed', 'cancelled', 'retrying', 'uncertain', 'completed'];
  const queueHealth: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await admin
        .from('delivery_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', s);
      queueHealth[s] = count ?? 0;
    })
  );

  return {
    campaigns: campaigns ?? [],
    failedJobs: failedJobs ?? [],
    queueHealth
  };
};
