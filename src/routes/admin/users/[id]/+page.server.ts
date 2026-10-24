import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import { fail, error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  requireAdmin(locals);
  const admin = createSupabaseAdminClient();
  const targetId = params.id;

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, role, status, created_at, avatar_url')
    .eq('id', targetId)
    .maybeSingle();

  if (!profile) {
    error(404, 'User not found');
  }

  const { data: wallet } = await admin
    .from('credit_wallets')
    .select('available_credits, reserved_credits, total_purchased, total_consumed')
    .eq('user_id', targetId)
    .maybeSingle();

  const { data: ledger } = await admin
    .from('credit_ledger')
    .select('id, type, delta, description, created_at')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, name, status, recipient_count, created_at')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: adjustmentHistory } = await admin
    .from('audit_logs')
    .select('id, action, details, created_at, actor_id')
    .eq('target_user_id', targetId)
    .eq('action', 'credit_adjustment')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    profile,
    wallet: wallet ?? null,
    ledger: ledger ?? [],
    campaigns: campaigns ?? [],
    adjustmentHistory: adjustmentHistory ?? []
  };
};

export const actions: Actions = {
  suspend: async ({ locals, params }) => {
    requireAdmin(locals);
    const admin = createSupabaseAdminClient();
    const { error: err } = await admin
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', params.id);
    if (err) return fail(500, { error: err.message });
    return { success: true, action: 'suspend' };
  },

  reinstate: async ({ locals, params }) => {
    requireAdmin(locals);
    const admin = createSupabaseAdminClient();
    const { error: err } = await admin
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', params.id);
    if (err) return fail(500, { error: err.message });
    return { success: true, action: 'reinstate' };
  },

  adjustCredits: async ({ locals, params, request }) => {
    const session = requireAdmin(locals);
    const form = await request.formData();
    const delta = parseInt(form.get('delta') as string, 10);
    const reason = (form.get('reason') as string)?.trim();

    if (isNaN(delta) || delta === 0) return fail(400, { error: 'Delta must be a non-zero number' });
    if (!reason) return fail(400, { error: 'Reason is required' });

    const admin = createSupabaseAdminClient();
    const { error: rpcErr } = await admin.rpc('admin_adjust_credits', {
      p_admin_id: session.user.id,
      p_target_id: params.id,
      p_delta: delta,
      p_reason: reason
    });

    if (rpcErr) return fail(500, { error: rpcErr.message });
    return { success: true, action: 'adjustCredits' };
  }
};
