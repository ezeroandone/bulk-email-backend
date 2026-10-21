<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import TopNav from '$lib/components/layout/TopNav.svelte';
  import { theme } from '$lib/stores/theme';
  import { user as userStore, profile as profileStore } from '$lib/stores/user';
  import { creditBalance, subscribeToCredits } from '$lib/stores/credits';
  import { createSupabaseBrowserClient } from '$lib/supabase-browser';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  // Hydrate stores from server-loaded data
  $effect(() => {
    const u = data.session?.user ?? null;
    if (u) userStore.set(u as Parameters<typeof userStore.set>[0]);
    if (data.profile) profileStore.set(data.profile as unknown as Parameters<typeof profileStore.set>[0]);
    if (data.wallet) {
      creditBalance.set({
        available: data.wallet.available_credits,
        reserved: data.wallet.reserved_credits,
        total_purchased: data.wallet.total_purchased,
        total_consumed: data.wallet.total_consumed
      });
    }
  });

  let sidebarCollapsed = $state(false);

  function handleCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
  }

  // Apply persisted theme on mount
  onMount(() => {
    theme.subscribe((isDark) => {
      theme.applyToDom(isDark);
    });
  });

  // Supabase Realtime: subscribe to credit_wallets changes for current user
  onMount(() => {
    const userId = data.session?.user?.id;
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();
    return subscribeToCredits(supabase, userId);
  });
</script>

<div class="app-shell" class:sidebar-collapsed={sidebarCollapsed}>
  <Sidebar collapsed={sidebarCollapsed} oncollapse={handleCollapse} />
  <TopNav user={data.session?.user ?? null} sidebarCollapsed={sidebarCollapsed} />

  <main class="main-content" id="main-content">
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100dvh;
  }

  .main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    margin-top: 4rem; /* TopNav height */
    padding: 1.5rem;
    min-width: 0;
    transition: margin-left var(--transition-slow);
  }

  .app-shell.sidebar-collapsed .main-content {
    margin-left: var(--sidebar-collapsed-width);
  }

  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
      padding: 1rem;
    }
  }
</style>
