import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeNewUser } from '$lib/server/auth/callback';

/**
 * Handle the PKCE OAuth callback from Supabase / Google.
 * Exchanges the `code` query param for a session, initializes new users,
 * then redirects to the appropriate destination.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    redirect(302, '/login?error=auth_failed');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message);
    redirect(302, '/login?error=auth_failed');
  }

  const { user } = data.session;
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    null;

  let isNew = false;
  try {
    const result = await initializeNewUser(supabase, user.id, user.email ?? '', fullName);
    isNew = result.isNew;
  } catch (err) {
    console.error('[auth/callback] initializeNewUser error:', err);
    // Don't block sign-in if initialization fails — user can still access the app.
  }

  redirect(302, isNew ? '/dashboard/onboarding' : '/dashboard');
};
