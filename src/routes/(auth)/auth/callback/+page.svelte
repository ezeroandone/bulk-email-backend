<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createBrowserClient } from '@supabase/ssr';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';

  onMount(async () => {
    const hash = window.location.hash;

    // Implicit flow: tokens come back in the URL fragment
    if (hash && hash.includes('access_token')) {
      const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

      // Parse the fragment — supabase-js can handle this via getSession after setting
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          goto('/login?error=auth_failed');
          return;
        }

        // Session set — reload to let server hooks pick up the session cookie
        window.location.href = '/dashboard';
        return;
      }
    }

    // PKCE flow: code comes as a query parameter — let the server handle it
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      // Server route handles this — just let it proceed (this page shouldn't render for PKCE)
      return;
    }

    // Neither flow matched
    goto('/login?error=auth_failed');
  });
</script>

<!-- Brief loading state while the auth callback processes -->
<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;color:#71717a;">
  <div style="text-align:center;">
    <div style="width:2rem;height:2rem;border:3px solid #e4e4e7;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div>
    <p style="margin:0;font-size:0.875rem;">Signing you in…</p>
  </div>
</div>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
