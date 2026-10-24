<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  function fmtDate(iso: string): string {
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

  const queueCards = $derived([
    { label: 'Queued', key: 'queued', icon: 'schedule', color: 'info' },
    { label: 'Processing', key: 'processing', icon: 'sync', color: 'warning' },
    { label: 'Sent', key: 'sent', icon: 'mark_email_read', color: 'success' },
    { label: 'Delivered', key: 'delivered', icon: 'done_all', color: 'success' },
    { label: 'Failed', key: 'failed', icon: 'error', color: 'error' },
    { label: 'Cancelled', key: 'cancelled', icon: 'cancel', color: 'neutral' }
  ]);
</script>

<svelte:head>
  <title>Campaigns — Admin — MergeMail</title>
</svelte:head>

<div class="campaigns-page">
  <h1 class="page-title">Campaigns</h1>

  <!-- Queue health -->
  <section>
    <h2 class="section-title">
      <span class="material-symbols-outlined" aria-hidden="true">queue</span>
      Queue Health
    </h2>
    <div class="queue-grid">
      {#each queueCards as card}
        <div class="queue-card queue-card--{card.color}">
          <span class="material-symbols-outlined queue-icon" aria-hidden="true">{card.icon}</span>
          <div>
            <p class="queue-label">{card.label}</p>
            <p class="queue-value">{(data.queueHealth[card.key] ?? 0).toLocaleString()}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Campaigns table -->
  <section class="card">
    <h2 class="section-title no-margin">
      <span class="material-symbols-outlined" aria-hidden="true">campaign</span>
      All Campaigns
    </h2>
    {#if data.campaigns.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined">campaign</span>
        <p>No campaigns yet.</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Name</th>
              <th scope="col">User</th>
              <th scope="col">Mode</th>
              <th scope="col">Status</th>
              <th scope="col">Recipients</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {#each data.campaigns as c}
              <tr>
                <td class="mono">{(c.id as string).slice(0, 8)}…</td>
                <td class="campaign-name">{c.name}</td>
                <td>
                  {#if c.profiles}
                    <div class="user-cell">
                      <span>{(c.profiles as { full_name?: string | null; email: string }).full_name ?? '—'}</span>
                      <span class="user-email">{(c.profiles as { email: string }).email}</span>
                    </div>
                  {:else}
                    —
                  {/if}
                </td>
                <td><span class="type-badge">{c.mode}</span></td>
                <td><span class="status-badge status-{c.status}">{c.status}</span></td>
                <td>{(c.recipient_count as number ?? 0).toLocaleString()}</td>
                <td class="date-cell">{fmtDate(c.created_at as string)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Failed jobs -->
  <section class="card">
    <h2 class="section-title no-margin">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      Failed / Cancelled Jobs
    </h2>
    {#if data.failedJobs.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined">check_circle</span>
        <p>No failed jobs.</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Recipient</th>
              <th scope="col">Error</th>
              <th scope="col">Attempts</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {#each data.failedJobs as job}
              <tr>
                <td>{(job as { campaigns?: { name?: string } }).campaigns?.name ?? '—'}</td>
                <td class="mono">—</td>
                <td class="error-cell" title={(job as {last_error?: string|null}).last_error ?? ''}>
                  {(job as {last_error?: string|null}).last_error
                    ? ((job as {last_error: string}).last_error.length > 60
                      ? (job as {last_error: string}).last_error.slice(0, 60) + '…'
                      : (job as {last_error: string}).last_error)
                    : '—'}
                </td>
                <td>{(job as {attempt_count?: number}).attempt_count ?? 0}</td>
                <td class="date-cell">{fmtDateTime(job.updated_at as string)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>

<style>
  .campaigns-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .section-title.no-margin { margin: 0 0 1.25rem; }

  .section-title .material-symbols-outlined { font-size: 1.25rem; color: var(--color-text-muted); }

  /* Queue cards */
  .queue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .queue-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1rem;
  }

  .queue-icon {
    font-size: 1.5rem;
    padding: 0.375rem;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .queue-card--info .queue-icon { background: var(--color-info-light); color: var(--color-info); }
  .queue-card--warning .queue-icon { background: var(--color-warning-light); color: var(--color-warning); }
  .queue-card--success .queue-icon { background: var(--color-success-light); color: var(--color-success); }
  .queue-card--error .queue-icon { background: var(--color-error-light); color: var(--color-error); }
  .queue-card--neutral .queue-icon { background: var(--color-bg-muted); color: var(--color-text-muted); }

  .queue-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
  .queue-value { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); margin: 0; }

  /* Card */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  /* Table */
  .empty-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

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
  .campaign-name { font-weight: 500; }
  .error-cell { color: var(--color-error); max-width: 20rem; }
  .date-cell { color: var(--color-text-muted); white-space: nowrap; }

  .user-cell { display: flex; flex-direction: column; gap: 0.125rem; }
  .user-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }

  .type-badge {
    display: inline-flex;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    background: var(--color-bg-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .status-badge {
    display: inline-flex;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .status-completed, .status-sent, .status-delivered { background: var(--color-success-light); color: var(--color-success); }
  .status-failed, .status-cancelled { background: var(--color-error-light); color: var(--color-error); }
  .status-processing, .status-queued { background: var(--color-info-light); color: var(--color-info); }
  .status-paused { background: var(--color-warning-light); color: var(--color-warning); }
  .status-draft, .status-ready { background: var(--color-bg-muted); color: var(--color-text-muted); }
</style>
