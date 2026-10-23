/**
 * POST /api/campaigns/[id]/pause — set campaign status=paused; update queued jobs → paused
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
    .update({ status: 'paused' })
    .eq('id', id);

  await locals.supabase
    .from('delivery_jobs')
    .update({ status: 'paused' })
    .eq('campaign_id', id)
    .eq('status', 'queued');

  return json({ success: true });
};
