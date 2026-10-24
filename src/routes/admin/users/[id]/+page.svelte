<script lang="ts">
  import { enhance } from '$app/forms';
  import { ConfirmDialog } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let profile = $derived(data.profile);
  let wallet = $derived(data.wallet);

  let showSuspendConfirm = $state(false);
  let showReinstateConfirm = $state(false);

  // Credit adjustment form state
  let adjDelta = $state(0);
  let adjReason = $state('');

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function fmtDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function ledgerVariant(type: string): string {
    if (type === 'purchase') return 'text-success';
    if (type === 'consume') return 'text-error';
    return 'text-muted';
  }
</script>

<svelte:head>
  <title>{profile.full_name ?? profile.email} — Admin — MergeMail</title>
</svelte:head>

<div class="user-detail">
  <!-- Back link -->
  <a href="/admin/users" class="back-link">
    <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
    All Users
  </a>

  {#if form?.error}
    <div class="alert alert-error" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      {form.error}
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
      {#if form.action === 'suspend'}User suspended.{/if}
      {#if form.action === 'reinstate'}User reinstated.{/if}
      {#if form.action === 'adjustCredits'}Credits adjusted.{/if}
    </div>
  {/if}

  <!-- Profile section -->
  <div class="profile-card">
    <div class="profile-avatar" aria-hidden="true">
      {(profile.full_name ?? profile.email ?? '?').charAt(0).toUpperCase()}
    </div>
    <div class="profile-info">
      <h1 class="profile-name">{profile.full_name ?? '—'}</h1>
      <p class="profile-email">{profile.email}</p>
      <div class="profile-meta">
        <span class="badge badge-{profile.role === 'admin' ? 'admin' : 'user'}">{profile.role}</span>
        <span class="badge badge-{profile.status === 'suspended' ? 'suspended' : 'active'}">
          {profile.status === 'suspended' ? 'Suspended' : 'Active'}
        </span>
        <span class="meta-text">Joined {fmtDate(profile.created_at)}</span>
      </div>
    </div>

    <!-- Suspend / Reinstate -->
    <div class="profile-actions">
      {#if profile.status !== 'suspended'}
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick={() => (showSuspendConfirm = true)}
        >
          <span class="material-symbols-outlined" aria-hidden="true">block</span>
          Suspend
        </button>
      {:else}
        <button
          type="button"
          class="btn btn-success btn-sm"
          onclick={() => (showReinstateConfirm = true)}
        >
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          Reinstate
        </button>
      {/if}
    </div>
  </div>

  <!-- Confirm dialogs -->
  <ConfirmDialog
    bind:open={showSuspendConfirm}
    title="Suspend user?"
    message="This will prevent {profile.full_name ?? profile.email} from accessing their account."
    confirmLabel="Suspend"
    danger={true}
    onConfirm={async () => {
      const f = document.getElementById('suspend-form') as HTMLFormElement;
      f?.requestSubmit();
    }}
  />

  <ConfirmDialog
    bind:open={showReinstateConfirm}
    title="Reinstate user?"
    message="This will restore access for {profile.full_name ?? profile.email}."
    confirmLabel="Reinstate"
    onConfirm={async () => {
      const f = document.getElementById('reinstate-form') as HTMLFormElement;
      f?.requestSubmit();
    }}
  />

  <!-- Hidden forms for suspend/reinstate -->
  <form id="suspend-form" method="POST" action="?/suspend" use:enhance style="display:none">
  </form>
  <form id="reinstate-form" method="POST" action="?/reinstate" use:enhance style="display:none">
  </form>

  <div class="content-grid">
    <div class="left-col">
      <!-- Wallet summary -->
      <section class="card">
        <h2 class="card-title">
          <span class="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span>
          Wallet
        </h2>
        {#if wallet}
          <div class="wallet-grid">
            <div class="wallet-item">
              <p class="wallet-label">Available</p>
              <p class="wallet-value text-success">{(wallet.available_credits ?? 0).toLocaleString()}</p>
            </div>
            <div class="wallet-item">
              <p class="wallet-label">Reserved</p>
              <p class="wallet-value text-warning">{(wallet.reserved_credits ?? 0).toLocaleString()}</p>
            </div>
            <div class="wallet-item">
              <p class="wallet-label">Purchased</p>
              <p class="wallet-value">{(wallet.total_purchased ?? 0).toLocaleString()}</p>
            </div>
            <div class="wallet-item">
              <p class="wallet-label">Consumed</p>
              <p class="wallet-value text-muted">{(wallet.total_consumed ?? 0).toLocaleString()}</p>
            </div>
          </div>
        {:else}
          <p class="text-muted">No wallet found.</p>
        {/if}
      </section>

      <!-- Ledger -->
      <section class="card">
        <h2 class="card-title">
          <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
          Last 10 Ledger Entries
        </h2>
        {#if data.ledger.length === 0}
          <p class="text-muted">No ledger entries.</p>
        {:else}
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Delta</th>
                  <th scope="col">Description</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {#each data.ledger as entry}
                  <tr>
                    <td><span class="type-badge">{entry.type}</span></td>
                    <td class={ledgerVariant(entry.type as string)}>
                      {(entry.delta as number) > 0 ? '+' : ''}{entry.delta}
                    </td>
                    <td>{entry.description ?? '—'}</td>
                    <td class="date-cell">{fmtDateTime(entry.created_at as string)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

      <!-- Campaigns -->
      <section class="card">
        <h2 class="card-title">
          <span class="material-symbols-outlined" aria-hidden="true">campaign</span>
          Last 5 Campaigns
        </h2>
        {#if data.campaigns.length === 0}
          <p class="text-muted">No campaigns.</p>
        {:else}
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Recipients</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {#each data.campaigns as c}
                  <tr>
                    <td>
                      <a href="/admin/campaigns" class="campaign-link">{c.name}</a>
                    </td>
                    <td><span class="type-badge">{c.status}</span></td>
                    <td>{(c.recipient_count ?? 0).toLocaleString()}</td>
                    <td class="date-cell">{fmtDate(c.created_at as string)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    </div>

    <div class="right-col">
      <!-- Credit adjustment -->
      <section class="card">
        <h2 class="card-title">
          <span class="material-symbols-outlined" aria-hidden="true">tune</span>
          Adjust Credits
        </h2>
        <form method="POST" action="?/adjustCredits" use:enhance class="adjust-form">
          <div class="form-group">
            <label for="adj-delta" class="form-label">Delta (negative to deduct)</label>
            <input
              id="adj-delta"
              type="number"
              name="delta"
              class="form-input"
              bind:value={adjDelta}
              required
              placeholder="e.g. 100 or -50"
            />
          </div>
          <div class="form-group">
            <label for="adj-reason" class="form-label">Reason <span class="required">*</span></label>
            <textarea
              id="adj-reason"
              name="reason"
              class="form-textarea"
              bind:value={adjReason}
              rows={3}
              required
              placeholder="Reason for adjustment…"
            ></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-sm" disabled={!adjReason.trim() || adjDelta === 0}>
            <span class="material-symbols-outlined" aria-hidden="true">save</span>
            Apply Adjustment
          </button>
        </form>
      </section>

      <!-- Adjustment history -->
      <section class="card">
        <h2 class="card-title">
          <span class="material-symbols-outlined" aria-hidden="true">history</span>
          Adjustment History
        </h2>
        {#if data.adjustmentHistory.length === 0}
          <p class="text-muted">No adjustments yet.</p>
        {:else}
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Details</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {#each data.adjustmentHistory as log}
                  <tr>
                    <td>
                      {#if log.details && typeof log.details === 'object'}
                        <span class={(log.details as { delta?: number }).delta && (log.details as { delta?: number }).delta! > 0 ? 'text-success' : 'text-error'}>
                          {(log.details as { delta?: number }).delta ?? ''}
                        </span>
                        {#if (log.details as { reason?: string }).reason}
                          — {(log.details as { reason?: string }).reason}
                        {/if}
                      {:else}
                        {String(log.details ?? '—')}
                      {/if}
                    </td>
                    <td class="date-cell">{fmtDateTime(log.created_at as string)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .user-detail {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
    text-decoration: none;
    font-weight: 500;
  }

  .back-link:hover { text-decoration: underline; }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .alert-error { background: var(--color-error-light); color: var(--color-error); }
  .alert-success { background: var(--color-success-light); color: var(--color-success); }

  /* Profile card */
  .profile-card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    flex-wrap: wrap;
  }

  .profile-avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var(--color-brand-light);
    color: var(--color-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .profile-info { flex: 1; min-width: 200px; }
  .profile-name { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }
  .profile-email { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0.25rem 0 0.5rem; }

  .profile-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .meta-text { font-size: var(--font-size-xs); color: var(--color-text-muted); }

  .profile-actions { margin-left: auto; }

  /* Content grid */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.25rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .content-grid { grid-template-columns: 1fr; }
  }

  .left-col, .right-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Card */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.25rem 1.5rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .card-title .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  /* Wallet */
  .wallet-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .wallet-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
  .wallet-value { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0.125rem 0 0; }

  /* Colors */
  .text-success { color: var(--color-success) !important; }
  .text-warning { color: var(--color-warning) !important; }
  .text-error { color: var(--color-error) !important; }
  .text-muted { color: var(--color-text-muted); font-size: var(--font-size-sm); }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .badge-admin { background: var(--color-brand-light); color: var(--color-brand); }
  .badge-user { background: var(--color-bg-muted); color: var(--color-text-muted); }
  .badge-active { background: var(--color-success-light); color: var(--color-success); }
  .badge-suspended { background: var(--color-error-light); color: var(--color-error); }

  .type-badge {
    display: inline-flex;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--color-bg-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);
  }

  /* Tables */
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
  .date-cell { color: var(--color-text-muted); white-space: nowrap; font-size: var(--font-size-xs); }

  .campaign-link { color: var(--color-brand); text-decoration: none; font-weight: 500; }
  .campaign-link:hover { text-decoration: underline; }

  /* Form */
  .adjust-form { display: flex; flex-direction: column; gap: 0.875rem; }

  .form-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .form-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required { color: var(--color-error); }

  .form-input, .form-textarea {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-family: inherit;
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .form-input:focus, .form-textarea:focus { border-color: var(--color-brand); }
  .form-textarea { resize: vertical; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-family: inherit;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }

  .btn-sm { padding: 0.375rem 0.75rem; font-size: var(--font-size-xs); }

  .btn-primary { background: var(--color-brand); color: var(--color-text-inverse); border-color: var(--color-brand); }
  .btn-primary:hover:not(:disabled) { background: var(--color-brand-hover); }

  .btn-danger { background: var(--color-error); color: #fff; border-color: var(--color-error); }
  .btn-danger:hover:not(:disabled) { background: #b91c1c; }

  .btn-success { background: var(--color-success); color: #fff; border-color: var(--color-success); }
  .btn-success:hover:not(:disabled) { filter: brightness(0.9); }
</style>
