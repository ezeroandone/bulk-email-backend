<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let search = $state(data.search ?? '');
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      goto(`?${params.toString()}`, { keepFocus: true });
    }, 300);
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function roleBadgeClass(role: string): string {
    return role === 'admin' ? 'badge badge-admin' : 'badge badge-user';
  }

  function statusBadgeClass(status: string | null): string {
    return status === 'suspended' ? 'badge badge-suspended' : 'badge badge-active';
  }
</script>

<svelte:head>
  <title>Users — Admin — MergeMail</title>
</svelte:head>

<div class="users-page">
  <div class="page-header">
    <h1 class="page-title">Users</h1>
    <p class="page-subtitle">{data.users.length} result{data.users.length !== 1 ? 's' : ''}</p>
  </div>

  <!-- Search -->
  <div class="search-bar">
    <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
    <input
      type="search"
      class="search-input"
      placeholder="Search by name or email…"
      bind:value={search}
      oninput={handleSearch}
      aria-label="Search users"
    />
  </div>

  {#if data.users.length === 0}
    <div class="empty-state">
      <span class="material-symbols-outlined empty-icon">group</span>
      <p>No users found.</p>
    </div>
  {:else}
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Name / Email</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Credits</th>
            <th scope="col">Campaigns</th>
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          {#each data.users as user}
            <tr
              class="clickable-row"
              onclick={() => goto(`/admin/users/${user.id}`)}
              onkeydown={(e) => e.key === 'Enter' && goto(`/admin/users/${user.id}`)}
              tabindex="0"
              role="link"
              aria-label="View user {user.full_name ?? user.email}"
            >
              <td>
                <div class="user-cell">
                  <div class="user-avatar" aria-hidden="true">
                    {(user.full_name ?? user.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p class="user-name">{user.full_name ?? '—'}</p>
                    <p class="user-email">{user.email}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class={roleBadgeClass(user.role)}>{user.role}</span>
              </td>
              <td>
                <span class={statusBadgeClass(user.status)}>
                  {user.status === 'suspended' ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td>{(user.available_credits ?? 0).toLocaleString()}</td>
              <td>{user.campaign_count}</td>
              <td class="date-cell">{fmtDate(user.created_at)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .users-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .page-header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .search-bar {
    position: relative;
    max-width: 24rem;
  }

  .search-icon {
    position: absolute;
    left: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.125rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.875rem 0.5rem 2.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .search-input:focus {
    border-color: var(--color-brand);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 3rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
  }

  .empty-icon { font-size: 3rem; color: var(--color-text-subtle); }

  .table-scroll {
    overflow-x: auto;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .data-table th {
    padding: 0.625rem 0.875rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .data-table td {
    padding: 0.75rem 0.875rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }

  .clickable-row { cursor: pointer; }
  .clickable-row:hover td { background: var(--color-bg-subtle); }
  .clickable-row:focus { outline: 2px solid var(--color-brand); outline-offset: -2px; }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-brand-light);
    color: var(--color-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
  }

  .user-name { font-weight: 500; margin: 0; color: var(--color-text); }
  .user-email { font-size: var(--font-size-xs); margin: 0; color: var(--color-text-muted); }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 500;
    white-space: nowrap;
  }

  .badge-admin { background: var(--color-brand-light); color: var(--color-brand); }
  .badge-user { background: var(--color-bg-muted); color: var(--color-text-muted); }
  .badge-active { background: var(--color-success-light); color: var(--color-success); }
  .badge-suspended { background: var(--color-error-light); color: var(--color-error); }

  .date-cell { color: var(--color-text-muted); white-space: nowrap; }
</style>
