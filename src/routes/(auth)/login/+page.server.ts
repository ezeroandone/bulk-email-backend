import { redirect, error } from '@sveltejs/kit';
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
   * Returns the authorization URL as a plain Response redirect so SvelteKit
   * doesn't block the external Google URL.
   */
  google: async ({ locals: { supabase }, url }) => {
    const origin = PUBLIC_APP_URL ?? url.origin;
    const redirectTo = `${origin}/auth/callback`;

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (oauthError || !data.url) {
      // Return the error URL as data so the client can display it
      return { error: 'oauth_init_failed' };
    }

    // Use a raw Response to redirect to the external Google OAuth URL
    // (SvelteKit's redirect() only allows same-origin redirects in actions)
    return new Response(null, {
      status: 302,
      headers: { location: data.url }
    });
  }
};
