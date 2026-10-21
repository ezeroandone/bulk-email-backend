import { createSupabaseBrowserClient } from '$lib/supabase-browser';
import { invalidateAll } from '$app/navigation';
import type { HandleClientError } from '@sveltejs/kit/hooks';

// Initialize the browser Supabase client and listen for auth state changes.
const supabase = createSupabaseBrowserClient();

supabase.auth.onAuthStateChange((_event, _session) => {
  // Invalidate all SvelteKit load functions so server data re-fetches
  // whenever the session changes (sign-in, sign-out, token refresh).
  invalidateAll();
});

// Re-export as required by SvelteKit for the client hooks module.
export const handleError: HandleClientError = ({ error, event: _event }) => {
  console.error('[client error]', error);
  return {
    message: 'An unexpected error occurred. Please try again.'
  };
};
