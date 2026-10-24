import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();

  const [
    { count: total_users },
    { count: total_campaigns },
    { count: active_jobs },
    { count: total_accepted_jobs }
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('campaigns').select('id', { count: 'exact', head: true }),
    admin.from('delivery_jobs').select('id', { count: 'exact', head: true }).in('status', ['queued', 'processing', 'retrying']),
    admin.from('delivery_jobs').select('id', { count: 'exact', head: true }).in('status', ['sent', 'delivered'])
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: active_users_30d } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('updated_at', thirtyDaysAgo);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: failed_jobs_24h } = await admin
    .from('delivery_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gt('updated_at', oneDayAgo);

  const { data: revenueRows } = await admin
    .from('payment_orders')
    .select('amount_kobo')
    .eq('status', 'successful');
  const total_revenue_kobo = (revenueRows ?? []).reduce(
    (s: number, r: { amount_kobo: number }) => s + (r.amount_kobo ?? 0),
    0
  );

  return json({
    success: true,
    data: {
      total_users: total_users ?? 0,
      active_users_30d: active_users_30d ?? 0,
      total_campaigns: total_campaigns ?? 0,
      total_accepted_jobs: total_accepted_jobs ?? 0,
      total_revenue_kobo,
      active_jobs: active_jobs ?? 0,
      failed_jobs_24h: failed_jobs_24h ?? 0
    }
  });
};
