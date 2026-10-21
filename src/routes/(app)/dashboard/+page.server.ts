import { requireSession } from '$lib/server/auth/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const userId = session.user.id;

  // Recent campaigns (last 5)
  const { data: campaigns } = await locals.supabase
    .from('campaigns')
    .select('id, name, status, total_recipients, sent_count, failed_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Campaign totals
  const { count: totalCampaigns } = await locals.supabase
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Emails accepted this month (delivery_jobs with status accepted/sent)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: emailsThisMonth } = await locals.supabase
    .from('delivery_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['accepted', 'sent'])
    .gte('created_at', startOfMonth.toISOString());

  // Last 7 days: emails sent grouped by date
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentJobs } = await locals.supabase
    .from('delivery_jobs')
    .select('created_at, status')
    .eq('user_id', userId)
    .in('status', ['accepted', 'sent', 'failed'])
    .gte('created_at', sevenDaysAgo.toISOString());

  // Build daily buckets
  const dailyMap = new Map<string, { sent: number; failed: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { sent: 0, failed: 0 });
  }
  for (const job of recentJobs ?? []) {
    const key = (job.created_at as string).slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) {
      if (job.status === 'accepted' || job.status === 'sent') bucket.sent++;
      else if (job.status === 'failed') bucket.failed++;
    }
  }
  const chartData = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts
  }));

  // Success rate
  const totalSent = chartData.reduce((s, d) => s + d.sent, 0);
  const totalFailed = chartData.reduce((s, d) => s + d.failed, 0);
  const successRate =
    totalSent + totalFailed > 0
      ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
      : null;

  return {
    campaigns: campaigns ?? [],
    totalCampaigns: totalCampaigns ?? 0,
    emailsThisMonth: emailsThisMonth ?? 0,
    successRate,
    chartData
  };
};
