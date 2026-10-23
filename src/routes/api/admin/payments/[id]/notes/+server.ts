import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  try {
    requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: { admin_notes?: string };
  try {
    body = await request.json() as { admin_notes?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const admin_notes = body.admin_notes ?? '';

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('payment_orders')
    .update({ admin_notes })
    .eq('id', params.id);

  if (error) return json({ success: false, error: error.message }, { status: 500 });
  return json({ success: true });
};
