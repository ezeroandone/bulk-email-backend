<script lang="ts">
  import { page } from '$app/state';
  import { PUBLIC_APP_NAME } from '$lib/env';

  interface Props {
    collapsed?: boolean;
    oncollapse?: () => void;
  }

  let { collapsed = false, oncollapse }: Props = $props();

  const navItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/dashboard/campaigns', icon: 'campaign', label: 'Campaigns' },
    { href: '/dashboard/templates', icon: 'description', label: 'Templates' },
    { href: '/dashboard/datasets', icon: 'table_chart', label: 'Datasets' },
    { href: '/dashboard/email-templates', icon: 'folder_open', label: 'Email Templates' },
    { href: '/dashboard/settings/smtp', icon: 'mail_lock', label: 'SMTP Settings' },
    { href: '/dashboard/billing', icon: 'payments', label: 'Credits & Billing' }
  ] as const;

  function isActive(href: string): boolean {
    // page is a rune-based state object in SvelteKit 5 — no $ prefix needed
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }
</script>

<aside
  class="sidebar"
  class:collapsed
  aria-label="Main navigation"
>
  <!-- Brand -->
  <div class="sidebar-brand">
    <span class="material-symbols-outlined icon-lg brand-icon" aria-hidden="true">
      mark_email_read
    </span>
    {#if !collapsed}
      <span class="brand-name">{PUBLIC_APP_NAME}</span>
    {/if}
  </div>

  <!-- Nav links -->
  <nav>
    <ul role="list" class="nav-list">
      {#each navItems as item}
        <li>
          <a
            href={item.href}
            class="nav-link"
            class:active={isActive(item.href)}
            aria-current={isActive(item.href) ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
          >
            <span class="material-symbols-outlined icon-md" aria-hidden="true">
              {item.icon}
            </span>
            {#if !collapsed}
              <span class="nav-label">{item.label}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Collapse toggle -->
  <div class="sidebar-footer">
    <button
      type="button"
      class="collapse-btn"
      onclick={oncollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <span class="material-symbols-outlined icon-md" aria-hidden="true">
        {collapsed ? 'chevron_right' : 'chevron_left'}
      </span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: var(--sidebar-width);
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    z-index: 40;
    transition: width var(--transition-slow);
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--color-border);
    min-height: 4rem;
    overflow: hidden;
    white-space: nowrap;
  }

  .brand-icon {
    color: var(--color-brand);
    flex-shrink: 0;
  }

  .brand-name {
    font-weight: 700;
    font-size: var(--font-size-lg);
    color: var(--color-text);
    letter-spacing: -0.02em;
  }

  nav {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 0;
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
    white-space: nowrap;
    overflow: hidden;
  }

  .nav-link:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .nav-link.active {
    background: var(--color-brand-light);
    color: var(--color-brand);
  }

  .nav-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-footer {
    padding: 0.75rem 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }

  .collapse-btn:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .collapse-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }
</style>
