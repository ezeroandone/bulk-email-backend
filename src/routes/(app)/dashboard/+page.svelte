<script lang="ts">
  import { Card, Button, Skeleton, StatusBadge } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // Profile display name from layout data
  let displayName = $derived(
    data.profile?.full_name ?? data.session?.user?.user_metadata?.full_name ?? 'there'
  );

  // Wallet from layout data
  let wallet = $derived(data.wallet);

  // NGN formatter
  function formatCredits(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toLocaleString();
  }

  // Chart helpers
  let chartData = $derived(data.chartData ?? []);
  let maxVal = $derived(Math.max(...chartData.map((d) => d.sent + d.failed), 1));

  function barHeight(val: number): number {
    return Math.round((val / maxVal) * 100);
  }

  function shortDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const campaignStatusMap: Record<string, string> = {
    draft: 'Draft',
    ready: 'Ready',
    queued: 'Queued',
    processing: 'Processing',
    paused: 'Paused',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };
</script>

<svelte:head>
  <title>Dashboard — MergeMail</title>
</svelte:head>

<div class="dashboard">
  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Welcome back, {displayName}</h1>
      <p class="page-subtitle">Here's what's happening with your campaigns.</p>
    </div>
    <div class="header-actions">
      <Button variant="secondary" onclick={() => (window.location.href = '/dashboard/datasets/new')}>
        {#snippet icon()}<span class="material-symbols-outlined">upload_file</span>{/snippet}
        Upload Spreadsheet
      </Button>
      <Button onclick={() => (window.location.href = '/dashboard/campaigns/new')}>
        {#snippet icon()}<span class="material-symbols-outlined">add</span>{/snippet}
        New Campaign
      </Button>
    </div>
  </div>

  <!-- Credit Balance Card -->
  <Card class="credit-card">
    <div class="credit-card-inner">
      <div class="credit-section">
        <span class="material-symbols-outlined credit-icon">toll</span>
        <div>
          <p class="credit-label">Available Credits</p>
          {#if wallet == null}
            <Skeleton variant="line" lines={1} />
          {:else}
            <p class="credit-value">{formatCredits(wallet.available_credits)}</p>
          {/if}
        </div>
      </div>
      <div class="credit-divider"></div>
      <div class="credit-section">
        <span class="material-symbols-outlined credit-icon credit-icon--reserved">lock</span>
        <div>
          <p class="credit-label">Reserved</p>
          {#if wallet == null}
            <Skeleton variant="line" lines={1} />
          {:else}
            <p class="credit-value credit-value--muted">{formatCredits(wallet.reserved_credits)}</p>
          {/if}
        </div>
      </div>
      <div class="credit-divider"></div>
      <div class="credit-section">
        <span class="material-symbols-outlined credit-icon credit-icon--consumed">send</span>
        <div>
          <p class="credit-label">Total Consumed</p>
          {#if wallet == null}
            <Skeleton variant="line" lines={1} />
          {:else}
            <p class="credit-value credit-value--muted">{formatCredits(wallet.total_consumed)}</p>
          {/if}
        </div>
      </div>
      <div class="credit-buy">
        <a href="/dashboard/billing" class="buy-link">
          <span class="material-symbols-outlined">shopping_cart</span>
          Buy Credits
        </a>
      </div>
    </div>
  </Card>

  <!-- Stats Row -->
  <div class="stats-row">
    <Card class="stat-card">
      <div class="stat-inner">
        <span class="material-symbols-outlined stat-icon stat-icon--campaigns">campaign</span>
        <div>
          <p class="stat-label">Total Campaigns</p>
          <p class="stat-value">{formatCredits(data.totalCampaigns)}</p>
        </div>
      </div>
    </Card>

    <Card class="stat-card">
      <div class="stat-inner">
        <span class="material-symbols-outlined stat-icon stat-icon--emails">mark_email_read</span>
        <div>
          <p class="stat-label">Accepted This Month</p>
          <p class="stat-value">{formatCredits(data.emailsThisMonth)}</p>
        </div>
      </div>
    </Card>

    <Card class="stat-card">
      <div class="stat-inner">
        <span class="material-symbols-outlined stat-icon stat-icon--rate">trending_up</span>
        <div>
          <p class="stat-label">Success Rate</p>
          <p class="stat-value">
            {data.successRate != null ? `${data.successRate}%` : '—'}
          </p>
        </div>
      </div>
    </Card>
  </div>

  <!-- Main Content Grid -->
  <div class="content-grid">
    <!-- Chart -->
    <Card class="chart-card">
      <h2 class="section-title">
        <span class="material-symbols-outlined">bar_chart</span>
        Emails Sent — Last 7 Days
      </h2>
      {#if chartData.length === 0}
        <div class="chart-empty">
          <span class="material-symbols-outlined chart-empty-icon">bar_chart</span>
          <p>No data yet. Send your first campaign to see results here.</p>
        </div>
      {:else}
        <div class="bar-chart" aria-label="Emails sent last 7 days">
          {#each chartData as day}
            <div class="bar-col">
              <div class="bar-stack">
                {#if day.failed > 0}
                  <div
                    class="bar bar--failed"
                    style="height: {barHeight(day.failed)}%"
                    title="{day.failed} failed on {shortDate(day.date)}"
                  ></div>
                {/if}
                <div
                  class="bar bar--sent"
                  style="height: {barHeight(day.sent)}%"
                  title="{day.sent} sent on {shortDate(day.date)}"
                ></div>
              </div>
              <span class="bar-label">{shortDate(day.date)}</span>
            </div>
          {/each}
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot legend-dot--sent"></span> Sent</span>
          <span class="legend-item"><span class="legend-dot legend-dot--failed"></span> Failed</span>
        </div>
      {/if}
    </Card>

    <!-- Quick Actions -->
    <Card class="actions-card">
      <h2 class="section-title">
        <span class="material-symbols-outlined">bolt</span>
        Quick Actions
      </h2>
      <div class="quick-actions">
        <a href="/dashboard/campaigns/new" class="quick-action-item">
          <span class="material-symbols-outlined quick-action-icon">add_circle</span>
          <div>
            <p class="quick-action-label">New Campaign</p>
            <p class="quick-action-desc">Start a new bulk email campaign</p>
          </div>
          <span class="material-symbols-outlined quick-action-arrow">chevron_right</span>
        </a>
        <a href="/dashboard/datasets/new" class="quick-action-item">
          <span class="material-symbols-outlined quick-action-icon">upload_file</span>
          <div>
            <p class="quick-action-label">Upload Spreadsheet</p>
            <p class="quick-action-desc">Add a new recipient dataset</p>
          </div>
          <span class="material-symbols-outlined quick-action-arrow">chevron_right</span>
        </a>
        <a href="/dashboard/billing" class="quick-action-item">
          <span class="material-symbols-outlined quick-action-icon">shopping_cart</span>
          <div>
            <p class="quick-action-label">Buy Credits</p>
            <p class="quick-action-desc">Top up your credit balance</p>
          </div>
          <span class="material-symbols-outlined quick-action-arrow">chevron_right</span>
        </a>
        <a href="/dashboard/settings/smtp" class="quick-action-item">
          <span class="material-symbols-outlined quick-action-icon">settings_ethernet</span>
          <div>
            <p class="quick-action-label">Configure SMTP</p>
            <p class="quick-action-desc">Add your email sender settings</p>
          </div>
          <span class="material-symbols-outlined quick-action-arrow">chevron_right</span>
        </a>
      </div>
    </Card>
  </div>

  <!-- Recent Campaigns -->
  <Card>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined">history</span>
        Recent Campaigns
      </h2>
      <a href="/dashboard/campaigns" class="view-all-link">
        View all
        <span class="material-symbols-outlined">arrow_forward</span>
      </a>
    </div>

    {#if data.campaigns.length === 0}
      <div class="table-empty">
        <span class="material-symbols-outlined table-empty-icon">campaign</span>
        <p>No campaigns yet. <a href="/dashboard/campaigns/new">Create your first one.</a></p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="recent-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Recipients</th>
              <th scope="col">Sent</th>
              <th scope="col">Failed</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {#each data.campaigns as campaign}
              <tr>
                <td>
                  <a href="/dashboard/campaigns/{campaign.id}" class="campaign-link">
                    {campaign.name}
                  </a>
                </td>
                <td><StatusBadge status={campaign.status} /></td>
                <td>{(campaign.recipient_count ?? 0).toLocaleString()}</td>
                <td class="count-sent">—</td>
                <td class="count-failed">—</td>
                <td class="date-col">{fmtDate(campaign.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Header */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Credit card */
  :global(.credit-card) {
    padding: 1.25rem 1.5rem !important;
  }

  .credit-card-inner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .credit-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 8rem;
  }

  .credit-icon {
    font-size: 2rem;
    color: var(--color-brand);
  }

  .credit-icon--reserved { color: var(--color-warning); }
  .credit-icon--consumed { color: var(--color-text-muted); }

  .credit-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .credit-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .credit-value--muted {
    color: var(--color-text-muted);
  }

  .credit-divider {
    width: 1px;
    height: 2.5rem;
    background: var(--color-border);
    flex-shrink: 0;
  }

  .credit-buy {
    margin-left: auto;
  }

  .buy-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: var(--color-brand);
    color: var(--color-text-inverse);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .buy-link:hover {
    background: var(--color-brand-hover);
  }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
    padding: 0.625rem;
    border-radius: var(--radius-lg);
    flex-shrink: 0;
  }

  .stat-icon--campaigns {
    background: var(--color-info-light);
    color: var(--color-info);
  }

  .stat-icon--emails {
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .stat-icon--rate {
    background: var(--color-brand-light);
    color: var(--color-brand);
  }

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

  /* Content grid */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.5rem;
  }

  @media (max-width: 900px) {
    .content-grid { grid-template-columns: 1fr; }
  }

  /* Bar chart */
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
    padding: 2.5rem 1rem;
    color: var(--color-text-muted);
    gap: 0.5rem;
    text-align: center;
    font-size: var(--font-size-sm);
  }

  .chart-empty-icon {
    font-size: 2.5rem;
    color: var(--color-text-subtle);
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 140px;
    padding-bottom: 1.75rem;
    position: relative;
  }

  .bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    position: relative;
  }

  .bar-stack {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 1px;
    justify-content: flex-start;
  }

  .bar {
    width: 100%;
    border-radius: 3px 3px 0 0;
    min-height: 2px;
    transition: height 0.3s ease;
  }

  .bar--sent {
    background: var(--color-brand);
  }

  .bar--failed {
    background: var(--color-error);
  }

  .bar-label {
    position: absolute;
    bottom: 0;
    font-size: 0.625rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    transform: translateX(-50%);
    left: 50%;
  }

  .chart-legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .legend-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
  }

  .legend-dot--sent { background: var(--color-brand); }
  .legend-dot--failed { background: var(--color-error); }

  /* Quick actions */
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .quick-action-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .quick-action-item:hover {
    background: var(--color-bg-muted);
  }

  .quick-action-icon {
    font-size: 1.5rem;
    color: var(--color-brand);
    flex-shrink: 0;
  }

  .quick-action-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
    margin: 0;
  }

  .quick-action-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .quick-action-arrow {
    font-size: 1.25rem;
    color: var(--color-text-subtle);
    margin-left: auto;
  }

  /* Recent campaigns table */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-header .section-title {
    margin: 0;
  }

  .view-all-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
    text-decoration: none;
    font-weight: 500;
  }

  .view-all-link:hover {
    text-decoration: underline;
  }

  .view-all-link .material-symbols-outlined {
    font-size: 1rem;
  }

  .table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1rem;
    color: var(--color-text-muted);
    gap: 0.5rem;
    text-align: center;
    font-size: var(--font-size-sm);
  }

  .table-empty-icon {
    font-size: 2.5rem;
    color: var(--color-text-subtle);
  }

  .table-empty a {
    color: var(--color-brand);
  }

  .table-scroll {
    overflow-x: auto;
  }

  .recent-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .recent-table th {
    padding: 0.625rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .recent-table td {
    padding: 0.75rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .recent-table tbody tr:last-child td {
    border-bottom: none;
  }

  .recent-table tbody tr:hover td {
    background: var(--color-bg-subtle);
  }

  .campaign-link {
    color: var(--color-text);
    text-decoration: none;
    font-weight: 500;
  }

  .campaign-link:hover {
    color: var(--color-brand);
    text-decoration: underline;
  }

  .count-sent { color: var(--color-success); font-weight: 500; }
  .count-failed { color: var(--color-error); font-weight: 500; }
  .date-col { color: var(--color-text-muted); white-space: nowrap; }
</style>
