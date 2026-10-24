import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, role, status, created_at, avatar_url')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return json({ success: false, error: error.message }, { status: 500 });
  if (!data) return json({ success: false, error: 'User not found' }, { status: 404 });

  return json({ success: true, data });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  try {
    requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await request.json() as { status?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body;
  if (!status || !['active', 'suspended'].includes(status)) {
    return json({ success: false, error: 'status must be "active" or "suspended"' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ status })
    .eq('id', params.id);

  if (error) return json({ success: false, error: error.message }, { status: 500 });
  return json({ success: true });
};
