import { createServerClient as _createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import type { Cookies } from '@sveltejs/kit';

// Inline the cookie payload type from @supabase/ssr
type CookieEntry = { name: string; value: string; options: Record<string, unknown> };

/**
 * Create a Supabase SSR client for use in SvelteKit server hooks and endpoints.
 * Reads/writes session cookies so auth state is SSR-compatible.
 */
export function createServerClient(cookies: Cookies) {
  return _createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet: CookieEntry[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            ...options,
            path: (options?.path as string) ?? '/'
          });
        });
      }
    }
  });
}
