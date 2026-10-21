import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import type { Database } from '$lib/server/db/supabase';

// Singleton instance — reused across the application.
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Return a singleton Supabase browser client.
 * Must only be called in browser context (not during SSR).
 */
export function createSupabaseBrowserClient(): ReturnType<
  typeof createBrowserClient<Database>
> {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  );

  return browserClient;
}
