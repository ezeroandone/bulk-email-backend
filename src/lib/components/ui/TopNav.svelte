<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface TopNavProps {
    title?: string;
    currentPath?: string;
    'credit-balance'?: Snippet;
    actions?: Snippet;
  }

  let {
    title = 'MergeMail',
    currentPath = '',
    'credit-balance': creditBalance,
    actions
  }: TopNavProps = $props();

  let searchQuery = $state('');
  let userMenuOpen = $state(false);

  const dropdownItems: Array<{ label: string; icon: string; href?: string }> = [
    { label: 'Profile', icon: 'person' },
    { label: 'Settings', icon: 'settings', href: '/settings' },
    { label: 'Sign out', icon: 'logout', href: '/logout' }
  ];

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }

  function closeUserMenu() {
    userMenuOpen = false;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      closeUserMenu();
    }
  }
</script>

<svelte:window onclick={userMenuOpen ? handleClickOutside : undefined} />

<header class="topnav">
  <div class="topnav-left">
    <!-- Hamburger -->
    <button
      type="button"
      class="topnav-icon-btn"
      aria-label="Toggle sidebar"
      onclick={() => {
        const event = new CustomEvent('toggle-sidebar', { bubbles: true });
        (document as unknown as EventTarget).dispatchEvent(event);
      }}
    >
      <span class="material-symbols-outlined" aria-hidden="true">menu</span>
    </button>

    <!-- Logo / title -->
    <a href="/" class="topnav-logo" aria-label="Go to home">
      <span class="material-symbols-outlined topnav-logo-icon" aria-hidden="true">mark_email_read</span>
      <span class="topnav-logo-text">{title}</span>
    </a>
  </div>

  <!-- Search -->
  <div class="topnav-search" role="search">
    <label for="topnav-search-input" class="sr-only">Search</label>
    <div class="search-wrapper">
      <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
      <input
        id="topnav-search-input"
        type="search"
        placeholder="Search…"
        bind:value={searchQuery}
        class="search-input"
      />
    </div>
  </div>

  <div class="topnav-right">
    <!-- Credit balance slot -->
    {#if creditBalance}
      {@render creditBalance()}
    {/if}

    <!-- Actions slot -->
    {#if actions}
      {@render actions()}
    {/if}

    <!-- Notification bell -->
    <button type="button" class="topnav-icon-btn" aria-label="Notifications">
      <span class="material-symbols-outlined" aria-hidden="true">notifications</span>
    </button>

    <!-- User avatar + dropdown -->
    <div class="user-menu-wrapper">
      <button
        type="button"
        class="user-avatar-btn"
        onclick={toggleUserMenu}
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        aria-label="User menu"
      >
        <span class="user-avatar" aria-hidden="true">U</span>
      </button>

      {#if userMenuOpen}
        <div class="user-dropdown" role="menu" aria-label="User menu">
          {#each dropdownItems as item}
            {#if item.href}
              <a href={item.href} class="user-dropdown-item" role="menuitem" onclick={closeUserMenu}>
                <span class="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                {item.label}
              </a>
            {:else}
              <button type="button" class="user-dropdown-item" role="menuitem" onclick={closeUserMenu}>
                <span class="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .topnav {
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 4rem;
    padding: 0 1.5rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 30;
  }

  .topnav-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .topnav-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
  }

  .topnav-logo-icon {
    color: var(--color-brand);
    font-size: 1.5rem;
  }

  .topnav-logo-text {
    font-size: var(--font-size-lg);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .topnav-icon-btn {
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
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .topnav-icon-btn:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .topnav-icon-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .topnav-search {
    flex: 1;
    max-width: 24rem;
    margin: 0 auto;
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.625rem;
    font-size: 1.125rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.4375rem 0.75rem 0.4375rem 2.25rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .search-input:focus {
    border-color: var(--color-brand);
    background: var(--color-surface);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .topnav-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  .user-menu-wrapper {
    position: relative;
  }

  .user-avatar-btn {
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

  .user-avatar-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: var(--color-brand);
    color: var(--color-text-inverse);
    border-radius: 50%;
    font-size: var(--font-size-sm);
    font-weight: 700;
    text-transform: uppercase;
    user-select: none;
  }

  .user-dropdown {
    position: absolute;
    top: calc(100% + 0.375rem);
    right: 0;
    min-width: 10rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    overflow: hidden;
    animation: dd-in 0.1s ease-out;
  }

  @keyframes dd-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .user-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.5rem 0.875rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-text);
    text-decoration: none;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .user-dropdown-item:hover {
    background: var(--color-bg-muted);
  }

  .user-dropdown-item .material-symbols-outlined {
    font-size: 1rem;
    color: var(--color-text-muted);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
