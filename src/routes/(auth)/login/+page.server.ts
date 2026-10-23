import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_APP_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';

export const load: PageServerLoad = async ({ locals: { session }, url }) => {
  // Already logged in — send to dashboard
  if (session) {
    redirect(302, '/dashboard');
  }

  // Build the Google OAuth URL server-side.
  // We use the Supabase authorize endpoint directly with PKCE disabled
  // (implicit flow) so no server-side cookie is needed for the code verifier.
  // The supabase-js client on the callback page handles the session exchange.
  const origin = PUBLIC_APP_URL ?? url.origin;
  const redirectTo = encodeURIComponent(`${origin}/auth/callback`);
  const googleAuthUrl =
    `${PUBLIC_SUPABASE_URL}/auth/v1/authorize` +
    `?provider=google` +
    `&redirect_to=${redirectTo}` +
    `&flow_type=pkce`;

  return { googleAuthUrl };
};
