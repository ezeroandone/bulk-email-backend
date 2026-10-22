/**
 * POST /api/campaigns/[id]/cancel — cancel unclaimed jobs, release credit reservations
 */
import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    return json({ success: false, error: 'Campaign not found.' }, { status: 404 });
  }

  // Fetch unclaimed jobs (queued or paused — not yet being processed)
  const { data: unclaimed } = await locals.supabase
    .from('delivery_jobs')
    .select('id')
    .eq('campaign_id', id)
    .in('status', ['queued', 'paused', 'retrying']);

  // Mark them cancelled
  if (unclaimed && unclaimed.length > 0) {
    await locals.supabase
      .from('delivery_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('campaign_id', id)
      .in('status', ['queued', 'paused', 'retrying']);

    // Release credit reservation for each cancelled job using admin client (bypasses RLS)
    const admin = createSupabaseAdminClient();
    for (const job of unclaimed) {
      await Promise.resolve(admin.rpc('release_reservation', { p_job_id: job.id })).catch(() => null);
    }
  }

  await locals.supabase
    .from('campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id);

  return json({ success: true, data: { cancelled: unclaimed?.length ?? 0 } });
};
