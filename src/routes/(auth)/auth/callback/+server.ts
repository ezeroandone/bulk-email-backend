import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeNewUser } from '$lib/server/auth/callback';

/**
 * Handle OAuth callbacks.
 *
 * PKCE flow: Supabase redirects here with ?code=... — exchange for session.
 * Implicit flow: Supabase redirects here with #access_token=... — the
 *   +page.svelte handles this client-side since server can't read fragments.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  // Surface any error from the OAuth provider
  const error = url.searchParams.get('error');
  if (error) {
    const desc = url.searchParams.get('error_description') ?? error;
    redirect(302, `/login?error=${encodeURIComponent(desc)}`);
  }

  const code = url.searchParams.get('code');

  // No code = implicit flow, let the +page.svelte handle it
  if (!code) {
    return new Response(null, { status: 200 });
  }

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError?.message);
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
  }

  redirect(302, isNew ? '/dashboard/onboarding' : '/dashboard');
};
