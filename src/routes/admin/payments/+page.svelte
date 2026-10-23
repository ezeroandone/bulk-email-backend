<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  type FilterTab = 'all' | 'successful' | 'failed' | 'pending';
  let activeTab = $state<FilterTab>('all');

  let filteredOrders = $derived(
    activeTab === 'all'
      ? data.orders
      : data.orders.filter((o) => {
          if (activeTab === 'successful') return o.status === 'successful';
          if (activeTab === 'failed') return o.status === 'failed';
          if (activeTab === 'pending')
            return o.status !== 'successful' && o.status !== 'failed';
          return true;
        })
  );

  // Track per-row notes edits
  let notesMap = $state<Record<string, string>>(
    Object.fromEntries(
      data.orders.map((o) => [o.id as string, (o.admin_notes as string) ?? ''])
    )
  );

  function fmtNGN(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'successful', label: 'Successful' },
    { key: 'failed', label: 'Failed' },
    { key: 'pending', label: 'Pending' }
  ];
</script>

<svelte:head>
  <title>Payments — Admin — MergeMail</title>
</svelte:head>

<div class="payments-page">
  <h1 class="page-title">Payments</h1>

  {#if form?.error}
    <div class="alert alert-error" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      {form.error}
    </div>
  {/if}

  <!-- Filter tabs -->
  <div class="tab-bar" role="tablist" aria-label="Filter payments">
    {#each tabs as tab}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === tab.key}
        class="tab-btn"
        class:active={activeTab === tab.key}
        onclick={() => (activeTab = tab.key)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="card">
    {#if filteredOrders.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined">payments</span>
        <p>No orders found.</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Reference</th>
              <th scope="col">Package</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Admin Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredOrders as order}
              {@const orderId = order.id as string}
              <tr>
                <td>
                  {#if order.profiles}
                    <div class="user-cell">
                      <span>{(order.profiles as { full_name?: string | null }).full_name ?? '—'}</span>
                      <span class="user-email">{(order.profiles as { email: string }).email}</span>
                    </div>
                  {:else}
                    —
                  {/if}
                </td>
                <td class="mono">{order.reference ?? '—'}</td>
                <td>{(order.credit_packages as { name?: string } | null)?.name ?? '—'}</td>
                <td class="amount-cell">{fmtNGN(order.amount_kobo as number ?? 0)}</td>
                <td>
                  <span class="status-badge status-{order.status}">{order.status}</span>
                </td>
                <td class="date-cell">{fmtDate(order.created_at as string)}</td>
                <td>
                  <form method="POST" action="?/saveAdminNotes" use:enhance class="notes-form">
                    <input type="hidden" name="id" value={orderId} />
                    <div class="notes-row">
                      <input
                        type="text"
                        name="admin_notes"
                        class="notes-input"
                        bind:value={notesMap[orderId]}
                        placeholder="Add note…"
                        aria-label="Admin notes for order {order.reference}"
                      />
                      <button type="submit" class="notes-save-btn" title="Save notes">
                        <span class="material-symbols-outlined" aria-hidden="true">save</span>
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .payments-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    background: var(--color-error-light);
    color: var(--color-error);
  }

  /* Tabs */
  .tab-bar {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.25rem;
    width: fit-content;
  }

  .tab-btn {
    padding: 0.375rem 1rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .tab-btn:hover { color: var(--color-text); background: var(--color-bg-muted); }
  .tab-btn.active { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-sm); }

  /* Card */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  .empty-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  /* Table */
  .table-scroll { overflow-x: auto; }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .data-table th {
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .data-table td {
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }

  .mono { font-family: monospace; font-size: 0.75rem; }
  .amount-cell { font-weight: 600; color: var(--color-text); }
  .date-cell { color: var(--color-text-muted); white-space: nowrap; }

  .user-cell { display: flex; flex-direction: column; gap: 0.125rem; }
  .user-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }

  .status-badge {
    display: inline-flex;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .status-successful { background: var(--color-success-light); color: var(--color-success); }
  .status-failed { background: var(--color-error-light); color: var(--color-error); }
  .status-pending { background: var(--color-warning-light); color: var(--color-warning); }
  .status-initialized { background: var(--color-info-light); color: var(--color-info); }

  /* Notes */
  .notes-form { min-width: 12rem; }

  .notes-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .notes-input {
    flex: 1;
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-xs);
    outline: none;
    min-width: 0;
    transition: border-color var(--transition-fast);
  }

  .notes-input:focus { border-color: var(--color-brand); }

  .notes-save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .notes-save-btn:hover { background: var(--color-brand); color: var(--color-text-inverse); border-color: var(--color-brand); }
  .notes-save-btn .material-symbols-outlined { font-size: 1rem; }
</style>
