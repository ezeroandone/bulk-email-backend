import { requireSession } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = requireSession(locals);

  const status = url.searchParams.get('status') ?? '';
  const search = url.searchParams.get('q') ?? '';

  let query = locals.supabase
    .from('campaigns')
    .select(
      'id, name, status, mode, recipient_count, created_at'
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: campaigns } = await query;

  return { campaigns: campaigns ?? [], status, search };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const session = requireSession(locals);
    const formData = await request.formData();
    const campaignId = formData.get('campaign_id') as string;

    if (!campaignId) return fail(400, { error: 'Missing campaign ID' });

    const admin = createSupabaseAdminClient();

    // Verify ownership first
    const { data: campaign } = await locals.supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!campaign) return fail(404, { error: 'Campaign not found' });

    if (campaign.status === 'processing' || campaign.status === 'queued') {
      return fail(422, { error: 'Cannot delete a campaign that is queued or processing. Cancel it first.' });
    }

    // Delete related data in order (admin client to bypass RLS)
    await admin.from('file_matches').delete().eq('campaign_id', campaignId);
    await admin.from('delivery_jobs').delete().eq('campaign_id', campaignId);
    await admin.from('campaign_recipients').delete().eq('campaign_id', campaignId);
    await admin.from('document_assets')
      .delete()
      .filter('metadata->>campaign_id', 'eq', campaignId);
    await admin.from('campaigns').delete().eq('id', campaignId);

    return { success: true };
  }
};
