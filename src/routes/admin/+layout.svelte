<script lang="ts">
  import { page } from '$app/stores';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'Overview' },
    { href: '/admin/users', icon: 'group', label: 'Users' },
    { href: '/admin/pricing', icon: 'sell', label: 'Pricing' },
    { href: '/admin/campaigns', icon: 'campaign', label: 'Campaigns' },
    { href: '/admin/payments', icon: 'payments', label: 'Payments' },
    { href: '/admin/settings', icon: 'settings', label: 'Settings' }
  ] as const;

  function isActive(href: string): boolean {
    if (href === '/admin') {
      return $page.url.pathname === '/admin';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="admin-shell">
  <!-- Sidebar -->
  <aside class="admin-sidebar" aria-label="Admin navigation">
    <div class="sidebar-header">
      <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">admin_panel_settings</span>
      <span class="sidebar-title">Admin Panel</span>
    </div>

    <nav>
      <ul role="list" class="nav-list">
        {#each navItems as item}
          <li>
            <a
              href={item.href}
              class="nav-link"
              class:active={isActive(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span class="material-symbols-outlined nav-icon" aria-hidden="true">{item.icon}</span>
              <span class="nav-label">{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <!-- Main area -->
  <div class="admin-main">
    <!-- Top bar -->
    <header class="admin-topbar">
      <span class="topbar-title">Admin Panel</span>
      <a href="/dashboard" class="back-link">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Back to Dashboard
      </a>
    </header>

    <main class="admin-content" id="admin-main-content">
      {@render children()}
    </main>
  </div>
</div>

<style>
  .admin-shell {
    display: flex;
    min-height: 100dvh;
    background: var(--color-bg-subtle);
  }

  /* Sidebar */
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 14rem;
    height: 100dvh;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    z-index: 40;
    overflow-y: auto;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--color-border);
    min-height: 4rem;
  }

  .sidebar-icon {
    font-size: 1.5rem;
    color: var(--color-brand);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-weight: 700;
    font-size: var(--font-size-base);
    color: var(--color-text);
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0.75rem 0.5rem;
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
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .nav-link:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .nav-link.active {
    background: var(--color-brand-light);
    color: var(--color-brand);
  }

  .nav-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
  }

  /* Main area */
  .admin-main {
    flex: 1;
    margin-left: 14rem;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .admin-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    height: 4rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
  }

  .topbar-title {
    font-weight: 700;
    font-size: var(--font-size-base);
    color: var(--color-text);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
    text-decoration: none;
    font-weight: 500;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .back-link .material-symbols-outlined {
    font-size: 1.125rem;
  }

  .admin-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .admin-sidebar {
      width: 100%;
      height: auto;
      position: relative;
    }

    .admin-main {
      margin-left: 0;
    }
  }
</style>
