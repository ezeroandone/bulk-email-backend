import { requireSession } from '$lib/server/auth/session';
import type { LayoutServerLoad } from './$types';

/**
 * Guard every route inside (app).
 * Also loads the user's profile and credit wallet so all authenticated
 * pages have access to them via `data`.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const session = requireSession(locals);

  // Load profile
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url')
    .eq('id', session.user.id)
    .maybeSingle();

  // Load credit wallet
  const { data: wallet } = await locals.supabase
    .from('credit_wallets')
    .select('available_credits, reserved_credits, total_purchased, total_consumed')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return {
    session,
    profile: profile ?? null,
    wallet: wallet ?? null
  };
};
