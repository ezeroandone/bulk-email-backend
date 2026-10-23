import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_APP_URL } from '$app/env/public';

// Redirect already-authenticated users away from the login page
export const load: PageServerLoad = async ({ locals: { session } }) => {
  if (session) {
    redirect(302, '/dashboard');
  }
  return {};
};

export const actions: Actions = {
  /**
   * Initiate Google OAuth via Supabase.
   * This action runs server-side so the PKCE code_verifier gets written
   * into the session cookie before the browser is redirected to Google.
   */
  google: async ({ locals: { supabase }, url }) => {
    const origin = PUBLIC_APP_URL ?? url.origin;
    const redirectTo = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error || !data.url) {
      redirect(302, '/login?error=oauth_init_failed');
    }

    redirect(302, data.url);
  }
};
