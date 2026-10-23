<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let stats = $derived(data.stats);
  let emailsPerDay = $derived(data.emails_per_day ?? []);
  let recentFailed = $derived(data.recent_failed_jobs ?? []);

  // Bar chart helpers
  let maxCount = $derived(Math.max(...emailsPerDay.map((d) => d.count), 1));

  function barHeight(count: number): number {
    return Math.round((count / maxCount) * 100);
  }

  function shortDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtNGN(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 });
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statCards = $derived([
    {
      label: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: 'group',
      color: 'brand'
    },
    {
      label: 'Active Users (30d)',
      value: stats.active_users_30d.toLocaleString(),
      icon: 'person_check',
      color: 'success'
    },
    {
      label: 'Total Campaigns',
      value: stats.total_campaigns.toLocaleString(),
      icon: 'campaign',
      color: 'info'
    },
    {
      label: 'Emails Sent',
      value: stats.total_accepted_jobs.toLocaleString(),
      icon: 'mark_email_read',
      color: 'success'
    },
    {
      label: 'Revenue',
      value: fmtNGN(stats.total_revenue_kobo),
      icon: 'payments',
      color: 'brand'
    },
    {
      label: 'Credits Sold',
      value: stats.total_credits_sold.toLocaleString(),
      icon: 'toll',
      color: 'warning'
    },
    {
      label: 'Active Jobs',
      value: stats.active_jobs.toLocaleString(),
      icon: 'sync',
      color: 'info'
    },
    {
      label: 'Failed (24h)',
      value: stats.failed_jobs_24h.toLocaleString(),
      icon: 'error',
      color: 'error'
    }
  ]);
</script>

<svelte:head>
  <title>Admin Overview — MergeMail</title>
</svelte:head>

<div class="admin-overview">
  <h1 class="page-title">Platform Overview</h1>

  <!-- Stat cards -->
  <div class="stat-grid">
    {#each statCards as card}
      <div class="stat-card stat-card--{card.color}">
        <span class="material-symbols-outlined stat-icon" aria-hidden="true">{card.icon}</span>
        <div class="stat-body">
          <p class="stat-label">{card.label}</p>
          <p class="stat-value">{card.value}</p>
        </div>
      </div>
    {/each}
  </div>

  <!-- Bar chart: emails per day (last 14 days) -->
  <div class="chart-card">
    <h2 class="section-title">
      <span class="material-symbols-outlined" aria-hidden="true">bar_chart</span>
      Emails Accepted — Last 14 Days
    </h2>

    {#if emailsPerDay.length === 0 || emailsPerDay.every((d) => d.count === 0)}
      <div class="chart-empty">
        <span class="material-symbols-outlined chart-empty-icon">bar_chart</span>
        <p>No email data yet.</p>
      </div>
    {:else}
      <div class="bar-chart" role="img" aria-label="Bar chart: emails accepted last 14 days">
        {#each emailsPerDay as day}
          <div class="bar-col">
            <div class="bar-wrap">
              <div
                class="bar"
                style="height: {barHeight(day.count)}%"
                title="{day.count} emails on {shortDate(day.date)}"
              ></div>
            </div>
            <span class="bar-label">{shortDate(day.date)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Recent failed jobs table -->
  <div class="table-card">
    <h2 class="section-title">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      Recent Failed Jobs
    </h2>

    {#if recentFailed.length === 0}
      <div class="table-empty">
        <span class="material-symbols-outlined">check_circle</span>
        <p>No failed jobs. All good!</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Job ID</th>
              <th scope="col">Campaign</th>
              <th scope="col">Recipient</th>
              <th scope="col">Error</th>
              <th scope="col">Time</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each recentFailed as job}
              <tr>
                <td class="mono">{(job.id as string).slice(0, 8)}…</td>
                <td>{(job as { campaigns?: { name?: string } }).campaigns?.name ?? '—'}</td>
                <td class="mono">{job.recipient_email ?? '—'}</td>
                <td class="error-cell" title={job.error_message ?? ''}>
                  {job.error_message
                    ? job.error_message.length > 60
                      ? job.error_message.slice(0, 60) + '…'
                      : job.error_message
                    : '—'}
                </td>
                <td class="date-cell">{fmtDate(job.updated_at as string)}</td>
                <td>
                  <form method="POST" action="?/retryJob" use:enhance>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button type="submit" class="retry-btn">
                      <span class="material-symbols-outlined" aria-hidden="true">refresh</span>
                      Retry
                    </button>
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
  .admin-overview {
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

  /* Stat cards */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
    padding: 0.5rem;
    border-radius: var(--radius-lg);
    flex-shrink: 0;
  }

  .stat-card--brand .stat-icon { background: var(--color-brand-light); color: var(--color-brand); }
  .stat-card--success .stat-icon { background: var(--color-success-light); color: var(--color-success); }
  .stat-card--info .stat-icon { background: var(--color-info-light); color: var(--color-info); }
  .stat-card--warning .stat-icon { background: var(--color-warning-light); color: var(--color-warning); }
  .stat-card--error .stat-icon { background: var(--color-error-light); color: var(--color-error); }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  /* Chart */
  .chart-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1.25rem;
  }

  .section-title .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  .chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .chart-empty-icon { font-size: 2.5rem; color: var(--color-text-subtle); }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.375rem;
    height: 160px;
    padding-bottom: 1.75rem;
  }

  .bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    position: relative;
    min-width: 0;
  }

  .bar-wrap {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }

  .bar {
    width: 100%;
    min-height: 2px;
    background: #3b82f6;
    border-radius: 3px 3px 0 0;
    transition: height 0.3s ease;
  }

  .bar-label {
    position: absolute;
    bottom: 0;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    left: 50%;
    transform: translateX(-50%);
  }

  /* Table */
  .table-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  .table-empty {
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
    padding: 0.625rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .data-table td {
    padding: 0.75rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover td { background: var(--color-bg-subtle); }

  .mono { font-family: monospace; font-size: 0.75rem; }
  .error-cell { color: var(--color-error); max-width: 20rem; }
  .date-cell { color: var(--color-text-muted); white-space: nowrap; }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .retry-btn:hover { background: var(--color-bg-subtle); }
  .retry-btn .material-symbols-outlined { font-size: 1rem; }
</style>
