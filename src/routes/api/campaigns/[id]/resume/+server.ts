/**
 * POST /api/campaigns/[id]/resume — set status=queued; update paused jobs → queued; re-enqueue
 */
import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
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

  await locals.supabase
    .from('campaigns')
    .update({ status: 'queued' })
    .eq('id', id);

  await locals.supabase
    .from('delivery_jobs')
    .update({ status: 'queued' })
    .eq('campaign_id', id)
    .eq('status', 'paused');

  // Re-enqueue the now-queued jobs
  const { data: jobs } = await locals.supabase
    .from('delivery_jobs')
    .select('id')
    .eq('campaign_id', id)
    .eq('status', 'queued');

  if (jobs && jobs.length > 0) {
    await Promise.resolve(locals.supabase.rpc('pgmq_send_batch', {
      queue_name: 'email_delivery',
      messages: jobs.map((j) => JSON.stringify({ job_id: j.id }))
    })).catch(() => null);
  }

  return json({ success: true });
};
