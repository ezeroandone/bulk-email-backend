import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_APP_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';

export const load: PageServerLoad = async ({ locals: { session }, url }) => {
  if (session) {
    redirect(302, '/dashboard');
  }

  const origin = PUBLIC_APP_URL ?? url.origin;
  const redirectTo = encodeURIComponent(`${origin}/auth/callback`);

  // Use implicit flow (no flow_type=pkce) — the PKCE verifier cookie
  // cannot be set reliably from a server load function without a round-trip,
  // so we let Supabase use the implicit flow and exchange the token client-side.
  const googleAuthUrl =
    `${PUBLIC_SUPABASE_URL}/auth/v1/authorize` +
    `?provider=google` +
    `&redirect_to=${redirectTo}`;

  return { googleAuthUrl };
};
