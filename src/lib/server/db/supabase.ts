import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';

// TODO: Replace `any` with the generated Database type once `supabase gen types`
// has been run and output placed at src/lib/server/db/database.types.ts
// import type { Database } from './database.types';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

/**
 * Create a Supabase client for use in SvelteKit server hooks and endpoints.
 * Reads/writes session cookies so the auth state is SSR-compatible.
 */
export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
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

/**
 * Create a Supabase client that uses the service-role key.
 * Bypasses Row Level Security — only use in trusted server-side code.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
