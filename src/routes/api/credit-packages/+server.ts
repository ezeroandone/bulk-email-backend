import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await locals.supabase
    .from('credit_packages')
    .select('id, name, credits, price_kobo, currency, sort_order')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return json({ success: false, error: 'Failed to load credit packages.' }, { status: 500 });
  }

  return json({
    success: true,
    data: { packages: data ?? [] }
  });
};
