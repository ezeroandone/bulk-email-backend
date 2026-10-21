import { json } from '@sveltejs/kit';
import { requireSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  let session;
  try {
    session = requireSession(locals);
  } catch {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: wallet, error } = await locals.supabase
    .from('credit_wallets')
    .select('available_credits, reserved_credits, total_purchased, total_consumed')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    return json({ success: false, error: 'Failed to load wallet.' }, { status: 500 });
  }

  return json({
    success: true,
    data: { wallet: wallet ?? null }
  });
};
