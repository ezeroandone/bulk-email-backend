<script lang="ts">
  import { creditBalance } from '$lib/stores/credits';
  import { theme } from '$lib/stores/theme';
  import { page } from '$app/state';
  import type { User } from '@supabase/supabase-js';

  interface Props {
    user: User | null | undefined;
    sidebarCollapsed?: boolean;
  }

  let { user, sidebarCollapsed = false }: Props = $props();

  let isDark = $state(false);
  theme.subscribe((v) => (isDark = v));

  // Derive page title from URL
  const titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/campaigns': 'Campaigns',
    '/templates': 'Templates',
    '/datasets': 'Datasets',
    '/documents': 'Documents',
    '/smtp': 'SMTP Settings',
    '/billing': 'Credits & Billing',
    '/settings': 'Settings'
  };

  let pageTitle = $derived.by(() => {
    const pathname = page.url.pathname;
    for (const [prefix, label] of Object.entries(titleMap)) {
      if (pathname === prefix || pathname.startsWith(prefix + '/')) return label;
    }
    return '';
  });

  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function handleLogout() {
    closeMenu();
  }
</script>

<header
  class="topnav"
  class:sidebar-collapsed={sidebarCollapsed}
  style="--sidebar-offset: {sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'}"
>
  <!-- Page title -->
  <div class="topnav-left">
    {#if pageTitle}
      <h1 class="page-title">{pageTitle}</h1>
    {/if}
  </div>

  <!-- Right controls -->
  <div class="topnav-right">
    <!-- Credit balance -->
    <a href="/billing" class="credit-badge" aria-label="Credit balance">
      <span class="material-symbols-outlined icon-sm" aria-hidden="true">toll</span>
      <span>{$creditBalance.available.toLocaleString()}</span>
    </a>

    <!-- Theme toggle -->
    <button
      type="button"
      class="icon-btn"
      onclick={() => theme.toggle()}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span class="material-symbols-outlined icon-md" aria-hidden="true">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>

    <!-- User menu -->
    <div class="user-menu-wrapper">
      <button
        type="button"
        class="user-btn"
        onclick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="User menu"
      >
        {#if user?.user_metadata?.avatar_url}
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.name ?? 'User avatar'}
            class="avatar"
            width="32"
            height="32"
          />
        {:else}
          <span class="avatar-placeholder" aria-hidden="true">
            <span class="material-symbols-outlined icon-md">person</span>
          </span>
        {/if}
      </button>

      {#if menuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="dropdown-backdrop" onclick={closeMenu}></div>
        <div class="dropdown" role="menu">
          <div class="dropdown-header">
            <span class="user-name">
              {user?.user_metadata?.name ?? user?.email ?? 'Account'}
            </span>
            <span class="user-email">{user?.email ?? ''}</span>
          </div>
          <hr class="dropdown-divider" />
          <a href="/settings" class="dropdown-item" role="menuitem" onclick={closeMenu}>
            <span class="material-symbols-outlined icon-sm" aria-hidden="true">settings</span>
            Settings
          </a>
          <form action="/logout" method="POST">
            <button
              type="submit"
              class="dropdown-item dropdown-item--danger"
              role="menuitem"
              onclick={handleLogout}
            >
              <span class="material-symbols-outlined icon-sm" aria-hidden="true">logout</span>
              Sign out
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .topnav {
    position: fixed;
    top: 0;
    left: var(--sidebar-offset, var(--sidebar-width));
    right: 0;
    height: 4rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    z-index: 30;
    transition: left var(--transition-slow);
  }

  .topnav-left {
    flex: 1;
    min-width: 0;
  }

  .page-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .topnav-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .credit-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    background: var(--color-brand-light);
    color: var(--color-brand);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .credit-badge:hover {
    background: var(--color-brand-light);
    opacity: 0.85;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }

  .icon-btn:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .icon-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .user-menu-wrapper {
    position: relative;
  }

  .user-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
  }

  .user-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border);
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
  }

  .dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 200px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    overflow: hidden;
  }

  .dropdown-header {
    padding: 0.875rem 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .user-name {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-divider {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.625rem 1rem;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-decoration: none;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
    text-align: left;
  }

  .dropdown-item:hover {
    background: var(--color-bg-muted);
  }

  .dropdown-item--danger {
    color: var(--color-error);
  }

  .dropdown-item--danger:hover {
    background: var(--color-error-light);
  }
</style>
