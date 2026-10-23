import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
  let session;
  try {
    session = requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: { delta?: number; reason?: string };
  try {
    body = await request.json() as { delta?: number; reason?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { delta, reason } = body;

  if (typeof delta !== 'number' || delta === 0) {
    return json({ success: false, error: 'delta must be a non-zero number' }, { status: 400 });
  }

  if (!reason || !reason.trim()) {
    return json({ success: false, error: 'reason is required' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc('admin_adjust_credits', {
    p_admin_id: session.user.id,
    p_target_id: params.id,
    p_delta: delta,
    p_reason: reason.trim()
  });

  if (error) return json({ success: false, error: error.message }, { status: 500 });
  return json({ success: true });
};
