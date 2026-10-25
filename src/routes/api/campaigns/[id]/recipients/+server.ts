/**
 * GET /api/campaigns/[id]/recipients — first 50 recipients with live delivery status
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

  // Verify campaign ownership
  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    return json({ success: false, error: 'Campaign not found.' }, { status: 404 });
  }

  const { data: recipients, error } = await locals.supabase
    .from('campaign_recipients')
    .select(`
      id, email, status, row_data,
      delivery_jobs(attempt_count, error, updated_at)
    `)
    .eq('campaign_id', id)
    .order('id', { ascending: true })
    .range(0, 49);

  if (error) {
    return json({ success: false, error: 'Failed to load recipients.' }, { status: 500 });
  }

  return json({ success: true, data: recipients ?? [] });
};
