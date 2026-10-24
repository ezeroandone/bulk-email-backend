import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();

  // Total users
  const { count: total_users } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // Active users last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: active_users_30d } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('updated_at', thirtyDaysAgo);

  // Total campaigns
  const { count: total_campaigns } = await admin
    .from('campaigns')
    .select('id', { count: 'exact', head: true });

  // Total accepted jobs
  const { count: total_accepted_jobs } = await admin
    .from('delivery_jobs')
    .select('id', { count: 'exact', head: true })
    .in('status', ['accepted', 'completed']);

  // Total revenue (kobo)
  const { data: revenueRow } = await admin
    .from('payment_orders')
    .select('amount_kobo')
    .eq('status', 'successful');
  const total_revenue_kobo = (revenueRow ?? []).reduce(
    (s: number, r: { amount_kobo: number }) => s + (r.amount_kobo ?? 0),
    0
  );

  // Total credits sold
  const { data: creditsRows } = await admin
    .from('credit_ledger')
    .select('delta')
    .eq('type', 'purchase');
  const total_credits_sold = (creditsRows ?? []).reduce(
    (s: number, r: { delta: number }) => s + Math.abs(r.delta ?? 0),
    0
  );

  // Active jobs
  const { count: active_jobs } = await admin
    .from('delivery_jobs')
    .select('id', { count: 'exact', head: true })
    .in('status', ['queued', 'processing', 'retrying']);

  // Failed jobs last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: failed_jobs_24h } = await admin
    .from('delivery_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gt('updated_at', oneDayAgo);

  // Emails per day: last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: jobsForChart } = await admin
    .from('delivery_jobs')
    .select('updated_at')
    .in('status', ['accepted', 'completed'])
    .gt('updated_at', fourteenDaysAgo);

  // Build daily buckets for last 14 days
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const job of jobsForChart ?? []) {
    const key = (job.updated_at as string).slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const emails_per_day = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  // Recent failed jobs (last 20)
  const { data: recent_failed_jobs } = await admin
    .from('delivery_jobs')
    .select('id, campaign_id, last_error, updated_at, campaigns(name)')
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(20);

  return {
    stats: {
      total_users: total_users ?? 0,
      active_users_30d: active_users_30d ?? 0,
      total_campaigns: total_campaigns ?? 0,
      total_accepted_jobs: total_accepted_jobs ?? 0,
      total_revenue_kobo,
      total_credits_sold,
      active_jobs: active_jobs ?? 0,
      failed_jobs_24h: failed_jobs_24h ?? 0
    },
    emails_per_day,
    recent_failed_jobs: recent_failed_jobs ?? []
  };
};

export const actions: Actions = {
  retryJob: async ({ request, locals }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const jobId = form.get('job_id') as string;
    if (!jobId) return fail(400, { error: 'Missing job_id' });

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('delivery_jobs')
      .update({ status: 'queued', attempt_count: 0, last_error: null })
      .eq('id', jobId);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};
