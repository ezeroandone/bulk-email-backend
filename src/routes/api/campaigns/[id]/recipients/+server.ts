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

  const { data: recipients, error: recErr } = await locals.supabase
    .from('campaign_recipients')
    .select('id, email, status, row_data')
    .eq('campaign_id', id)
    .order('id', { ascending: true })
    .range(0, 49);

  if (recErr) {
    return json({ success: false, error: 'Failed to load recipients.' }, { status: 500 });
  }

  // Fetch delivery_jobs separately to avoid FK ambiguity (HTTP 300)
  const recipientIds = (recipients ?? []).map((r) => r.id as string);
  const jobMap: Record<string, { attempt_count: number; error: string | null; updated_at: string }> = {};

  if (recipientIds.length > 0) {
    const { data: jobs } = await locals.supabase
      .from('delivery_jobs')
      .select('campaign_recipient_id, attempt_count, last_error, updated_at')
      .eq('campaign_id', id)
      .in('campaign_recipient_id', recipientIds);

    for (const j of jobs ?? []) {
      jobMap[j.campaign_recipient_id as string] = {
        attempt_count: (j.attempt_count as number) ?? 0,
        error: j.last_error as string | null,
        updated_at: j.updated_at as string
      };
    }
  }

  const result = (recipients ?? []).map((r) => ({
    ...r,
    delivery_job: jobMap[r.id as string] ?? null
  }));

  return json({ success: true, data: result });
};
