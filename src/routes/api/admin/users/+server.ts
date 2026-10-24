import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/session';
import { createSupabaseAdminClient } from '$lib/server/db/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    requireAdmin(locals);
  } catch {
    return json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const search = url.searchParams.get('search') ?? '';
  const admin = createSupabaseAdminClient();

  let query = admin
    .from('profiles')
    .select('id, email, full_name, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return json({ success: false, error: error.message }, { status: 500 });

  return json({ success: true, data: data ?? [] });
};
