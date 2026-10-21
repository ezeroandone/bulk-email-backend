import { redirect } from '@sveltejs/kit';
import { createServerClient } from '$lib/server/auth/client';
import type { Handle } from '@sveltejs/kit/hooks';

/**
 * Content-Security-Policy header value.
 * Includes 'self' and the Supabase project domain.
 * 'unsafe-inline' for styles is required by Svelte's CSS injection in SSR mode.
 */
const CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com; " +
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com; " +
  "frame-src 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "upgrade-insecure-requests;";

export const handle: Handle = async ({ event, resolve }) => {
  // ── Supabase SSR client (per request) ─────────────────────────────
  const supabase = createServerClient(event.cookies);
  event.locals.supabase = supabase;

  // ── Auth session ──────────────────────────────────────────────────
  const {
    data: { session }
  } = await supabase.auth.getSession();

  event.locals.session = session ?? null;

  // ── Profile + admin flag ──────────────────────────────────────────
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    event.locals.profile = profile ?? null;
    event.locals.isAdmin = profile?.role === 'admin';
  } else {
    event.locals.profile = null;
    event.locals.isAdmin = false;
  }

  // ── Route protection ──────────────────────────────────────────────
  const { pathname } = event.url;

  // /admin/** — must be authenticated admin
  if (pathname.startsWith('/admin')) {
    if (!session) {
      redirect(302, '/login');
    }
    if (event.locals.profile?.role !== 'admin') {
      redirect(302, '/dashboard');
    }
  }

  // /dashboard/** — must be authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      redirect(302, '/login');
    }
  }

  // ── Resolve ───────────────────────────────────────────────────────
  const response = await resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });

  // ── Security headers ──────────────────────────────────────────────
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
};
