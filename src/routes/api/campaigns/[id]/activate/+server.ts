/**
 * POST /api/campaigns/[id]/activate — transition a Mode A draft campaign to 'queued'
 * and enqueue all delivery jobs for processing.
 *
 * Pre-conditions:
 *   - campaign.mode === 'A'
 *   - campaign.status === 'draft'
 *   - at least one non-excluded file_match exists
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

  // Verify campaign ownership
  const { data: campaign } = await locals.supabase
    .from('campaigns')
    .select('id, mode, status')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!campaign) {
    return json({ success: false, error: 'Campaign not found.' }, { status: 404 });
  }

  if ((campaign.mode as string) !== 'A') {
    return json(
      { success: false, error: 'Activate is only available for Mode A campaigns.' },
      { status: 422 }
    );
  }

  if ((campaign.status as string) !== 'draft') {
    return json(
      { success: false, error: 'Only draft campaigns can be activated.' },
      { status: 422 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Confirm at least one non-excluded file match exists
  const { count: matchCount, error: matchErr } = await admin
    .from('file_matches')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', id)
    .eq('is_excluded', false);

  if (matchErr) {
    return json({ success: false, error: 'Failed to check file matches.' }, { status: 500 });
  }

  if (!matchCount || matchCount === 0) {
    return json(
      {
        success: false,
        error: 'No file matches found. Upload and match files before activating.'
      },
      { status: 422 }
    );
  }

  // Transition campaign to 'queued'
  const { error: campErr } = await locals.supabase
    .from('campaigns')
    .update({ status: 'queued' })
    .eq('id', id);

  if (campErr) {
    return json({ success: false, error: 'Failed to update campaign status.' }, { status: 500 });
  }

  // Transition draft delivery_jobs to 'queued'
  const { error: jobsUpdateErr } = await admin
    .from('delivery_jobs')
    .update({ status: 'queued' })
    .eq('campaign_id', id)
    .eq('status', 'draft');

  if (jobsUpdateErr) {
    return json({ success: false, error: 'Failed to update delivery jobs.' }, { status: 500 });
  }

  // Fetch the now-queued jobs to enqueue them
  const { data: jobs, error: jobsFetchErr } = await admin
    .from('delivery_jobs')
    .select('id')
    .eq('campaign_id', id)
    .eq('status', 'queued');

  if (jobsFetchErr) {
    return json({ success: false, error: 'Failed to fetch delivery jobs for enqueue.' }, { status: 500 });
  }

  if (jobs && jobs.length > 0) {
    await Promise.resolve(
      locals.supabase.rpc('pgmq_send_batch', {
        queue_name: 'email_delivery',
        messages: jobs.map((j) => JSON.stringify({ job_id: j.id }))
      })
    ).catch((err: unknown) => {
      // Non-fatal — the cron will pick these up anyway
      console.warn(
        '[activate] pgmq_send_batch failed:',
        err instanceof Error ? err.message : err
      );
    });
  }

  return json({ success: true });
};
