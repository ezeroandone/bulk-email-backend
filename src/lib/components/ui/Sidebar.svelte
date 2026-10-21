<script lang="ts">
  export interface SidebarChild {
    label: string;
    href: string;
  }

  export interface SidebarItem {
    label: string;
    icon: string;
    href: string;
    children?: SidebarChild[];
    badge?: string;
  }

  export interface SidebarProps {
    items?: SidebarItem[];
    collapsed?: boolean;
    currentPath?: string;
  }

  let {
    items = [],
    collapsed = $bindable(false),
    currentPath = ''
  }: SidebarProps = $props();

  let expandedItems = $state<Set<string>>(new Set());

  function isActive(href: string): boolean {
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  function toggleExpanded(href: string) {
    const next = new Set(expandedItems);
    if (next.has(href)) {
      next.delete(href);
    } else {
      next.add(href);
    }
    expandedItems = next;
  }

  function isExpanded(item: SidebarItem): boolean {
    return (
      expandedItems.has(item.href) ||
      (item.children?.some((c) => isActive(c.href)) ?? false)
    );
  }
</script>

<aside class="sidebar" class:collapsed aria-label="Main navigation">
  <!-- Brand -->
  <div class="sidebar-brand">
    <span class="material-symbols-outlined icon-lg brand-icon" aria-hidden="true">mark_email_read</span>
    {#if !collapsed}
      <span class="brand-name">MergeMail</span>
    {/if}
  </div>

  <!-- Nav -->
  <nav class="sidebar-nav">
    <ul role="list" class="nav-list">
      {#each items as item}
        <li>
          {#if item.children && item.children.length > 0}
            <!-- Parent item with children -->
            <button
              type="button"
              class="nav-link nav-link-btn"
              class:active={isActive(item.href)}
              onclick={() => toggleExpanded(item.href)}
              aria-expanded={isExpanded(item)}
              title={collapsed ? item.label : undefined}
            >
              <span class="material-symbols-outlined icon-md nav-icon" aria-hidden="true">{item.icon}</span>
              {#if !collapsed}
                <span class="nav-label">{item.label}</span>
                {#if item.badge}
                  <span class="nav-badge">{item.badge}</span>
                {/if}
                <span class="material-symbols-outlined nav-chevron" aria-hidden="true">
                  {isExpanded(item) ? 'expand_less' : 'expand_more'}
                </span>
              {/if}
            </button>

            {#if isExpanded(item) && !collapsed}
              <ul role="list" class="nav-children">
                {#each item.children as child}
                  <li>
                    <a
                      href={child.href}
                      class="nav-child-link"
                      class:active={isActive(child.href)}
                      aria-current={isActive(child.href) ? 'page' : undefined}
                    >
                      {child.label}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          {:else}
            <!-- Leaf item -->
            <a
              href={item.href}
              class="nav-link"
              class:active={isActive(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span class="material-symbols-outlined icon-md nav-icon" aria-hidden="true">{item.icon}</span>
              {#if !collapsed}
                <span class="nav-label">{item.label}</span>
                {#if item.badge}
                  <span class="nav-badge">{item.badge}</span>
                {/if}
              {/if}
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Collapse toggle -->
  <div class="sidebar-footer">
    <button
      type="button"
      class="collapse-btn"
      onclick={() => { collapsed = !collapsed; }}
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
    width: var(--sidebar-width, 256px);
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    z-index: 40;
    transition: width var(--transition-slow);
    overflow: hidden;
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width, 64px);
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
    flex-shrink: 0;
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

  .sidebar-nav {
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

  .nav-link,
  .nav-link-btn {
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
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    font-family: inherit;
  }

  .nav-link-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .nav-link:hover,
  .nav-link-btn:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .nav-link.active,
  .nav-link-btn.active {
    background: var(--color-brand-light);
    color: var(--color-brand);
  }

  .nav-icon {
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-badge {
    background: var(--color-brand);
    color: var(--color-text-inverse);
    font-size: var(--font-size-xs);
    font-weight: 600;
    padding: 0 0.375rem;
    border-radius: 9999px;
    min-width: 1.25rem;
    text-align: center;
    line-height: 1.375rem;
  }

  .nav-chevron {
    font-size: 1.125rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .nav-children {
    list-style: none;
    margin: 0.125rem 0 0 0;
    padding: 0 0 0 2.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .nav-child-link {
    display: block;
    padding: 0.5rem 0.75rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .nav-child-link:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .nav-child-link.active {
    color: var(--color-brand);
    font-weight: 500;
  }

  .sidebar-footer {
    padding: 0.75rem 0.5rem;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
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
    transition: background var(--transition-fast), color var(--transition-fast);
    font-family: inherit;
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
