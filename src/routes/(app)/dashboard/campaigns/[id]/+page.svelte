<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Card, Button, Badge, StatusBadge, ProgressBar } from '$lib/components/ui';
  import { createSupabaseBrowserClient } from '$lib/supabase-browser';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // ── Reactive state ─────────────────────────────────────────────────────────

  let campaign = $state(data.campaign);
  let stats = $state(data.stats);
  let recipients = $state(data.recipients);

  let actionLoading = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const progressPct = $derived(
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0
  );

  const canPause = $derived(campaign.status === 'queued' || campaign.status === 'processing');
  const canResume = $derived(campaign.status === 'paused');
  const canCancel = $derived(
    campaign.status === 'queued' || campaign.status === 'processing' || campaign.status === 'paused'
  );
  const canRetry = $derived(campaign.status === 'failed' || stats.failed > 0);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function truncate(s: string | null, n = 80): string {
    if (!s) return '';
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  // ── Campaign actions ───────────────────────────────────────────────────────

  async function doAction(action: 'pause' | 'resume' | 'cancel') {
    actionLoading = action;
    actionError = null;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        actionError = (j as { error?: string }).error ?? `Failed to ${action} campaign.`;
        return;
      }
      await refreshStats();
    } catch {
      actionError = `Network error while trying to ${action}.`;
    } finally {
      actionLoading = null;
    }
  }

  async function refreshStats() {
    const res = await fetch(`/api/campaigns/${campaign.id}`);
    if (res.ok) {
      const j = await res.json() as { data?: { campaign: typeof campaign; stats: typeof stats } };
      if (j.data) {
        campaign = j.data.campaign;
        stats = j.data.stats;
      }
    }
  }

  // ── Realtime + polling ────────────────────────────────────────────────────

  let realtimeChannel: ReturnType<ReturnType<typeof createSupabaseBrowserClient>['channel']> | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    const supabase = createSupabaseBrowserClient();

    try {
      realtimeChannel = supabase
        .channel(`campaign-${campaign.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_jobs',
            filter: `campaign_id=eq.${campaign.id}`
          },
          () => {
            refreshStats();
          }
        )
        .subscribe();
    } catch {
      // Realtime unavailable — fall through to polling
    }

    // Polling fallback: every 10s
    pollInterval = setInterval(() => {
      if (campaign.status === 'queued' || campaign.status === 'processing') {
        refreshStats();
      }
    }, 10_000);
  });

  onDestroy(() => {
    if (realtimeChannel) {
      createSupabaseBrowserClient().removeChannel(realtimeChannel);
    }
    if (pollInterval) clearInterval(pollInterval);
  });

  // ── Report download ────────────────────────────────────────────────────────

  function downloadReport() {
    window.location.href = `/api/campaigns/${campaign.id}/report`;
  }

  // ── Mode label ─────────────────────────────────────────────────────────────

  const modeLabels: Record<string, string> = {
    A: 'Send Existing Documents',
    B: 'Generate from Template',
    C: 'Email Only'
  };
</script>

<svelte:head>
  <title>{campaign.name} — MergeMail</title>
</svelte:head>

<div class="campaign-detail">
  <!-- Header -->
  <div class="page-header">
    <div class="header-left">
      <a href="/dashboard/campaigns" class="back-link">
        <span class="material-symbols-outlined">arrow_back</span>
        Campaigns
      </a>
      <div class="header-title-row">
        <h1 class="page-title">{campaign.name}</h1>
        <StatusBadge status={campaign.status} />
      </div>
      <p class="page-meta">
        <span class="material-symbols-outlined meta-icon">calendar_today</span>
        Created {fmtDate(campaign.created_at)}
        {#if campaign.started_at}
          &nbsp;·&nbsp;Started {fmtDate(campaign.started_at)}
        {/if}
        {#if campaign.completed_at}
          &nbsp;·&nbsp;Completed {fmtDate(campaign.completed_at)}
        {/if}
      </p>
    </div>
    <div class="header-actions">
      <Badge variant="neutral">{modeLabels[campaign.mode as string] ?? campaign.mode}</Badge>
      <Button
        variant="secondary"
        size="sm"
        onclick={downloadReport}
      >
        {#snippet icon()}<span class="material-symbols-outlined">download</span>{/snippet}
        {#snippet children()}Download Report{/snippet}
      </Button>
    </div>
  </div>

  {#if actionError}
    <div class="error-banner" role="alert">
      <span class="material-symbols-outlined">error</span>
      {actionError}
      <button type="button" class="banner-close" onclick={() => { actionError = null; }} aria-label="Dismiss">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  {/if}

  <!-- Stats row -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">Total</span>
      <span class="stat-value">{stats.total.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-queued">
      <span class="stat-label">Queued</span>
      <span class="stat-value">{stats.queued.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-processing">
      <span class="stat-label">Processing</span>
      <span class="stat-value">{stats.claimed.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-success">
      <span class="stat-label">Accepted</span>
      <span class="stat-value">{stats.accepted.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-failed">
      <span class="stat-label">Failed</span>
      <span class="stat-value">{stats.failed.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-warning">
      <span class="stat-label">Retrying</span>
      <span class="stat-value">{stats.retrying.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-neutral">
      <span class="stat-label">Cancelled</span>
      <span class="stat-value">{stats.cancelled.toLocaleString()}</span>
    </div>
    <div class="stat-card stat-uncertain">
      <span class="stat-label">Uncertain</span>
      <span class="stat-value">{stats.uncertain.toLocaleString()}</span>
    </div>
  </div>

  <!-- Progress bar -->
  <Card>
    <div class="progress-section">
      <div class="progress-header-row">
        <span class="progress-title">Delivery Progress</span>
        <span class="progress-pct">{progressPct}%</span>
      </div>
      <ProgressBar
        value={stats.accepted}
        max={stats.total}
        animated={campaign.status === 'queued' || campaign.status === 'processing'}
        variant={stats.failed > 0 ? 'warning' : 'success'}
      />
      <p class="progress-sub">
        {stats.accepted.toLocaleString()} of {stats.total.toLocaleString()} emails accepted
      </p>
    </div>
  </Card>

  <!-- Controls -->
  <Card>
    <div class="controls-row">
      <span class="controls-label">Actions</span>
      <div class="controls-btns">
        {#if canPause}
          <Button
            variant="secondary"
            size="sm"
            loading={actionLoading === 'pause'}
            disabled={!!actionLoading}
            onclick={() => doAction('pause')}
          >
            {#snippet icon()}<span class="material-symbols-outlined">pause</span>{/snippet}
            {#snippet children()}Pause{/snippet}
          </Button>
        {/if}
        {#if canResume}
          <Button
            variant="secondary"
            size="sm"
            loading={actionLoading === 'resume'}
            disabled={!!actionLoading}
            onclick={() => doAction('resume')}
          >
            {#snippet icon()}<span class="material-symbols-outlined">play_arrow</span>{/snippet}
            {#snippet children()}Resume{/snippet}
          </Button>
        {/if}
        {#if canRetry}
          <Button
            variant="secondary"
            size="sm"
            disabled={true}
          >
            {#snippet icon()}<span class="material-symbols-outlined">refresh</span>{/snippet}
            {#snippet children()}Retry Failures{/snippet}
          </Button>
        {/if}
        {#if canCancel}
          <Button
            variant="danger"
            size="sm"
            loading={actionLoading === 'cancel'}
            disabled={!!actionLoading}
            onclick={() => doAction('cancel')}
          >
            {#snippet icon()}<span class="material-symbols-outlined">cancel</span>{/snippet}
            {#snippet children()}Cancel{/snippet}
          </Button>
        {/if}
      </div>
    </div>
  </Card>

  <!-- Recipients table -->
  <Card>
    <div class="table-header">
      <h2 class="table-title">
        <span class="material-symbols-outlined">group</span>
        Recipients
      </h2>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
            <th scope="col" class="num-col">Attempts</th>
            <th scope="col">Last Error</th>
            <th scope="col">Last Attempt</th>
          </tr>
        </thead>
        <tbody>
          {#if recipients.length === 0}
            <tr>
              <td colspan="6" class="empty-row">
                <span class="material-symbols-outlined empty-icon">inbox</span>
                No recipients yet.
              </td>
            </tr>
          {:else}
            {#each recipients as r (r.id)}
              <tr>
                <td>{(r.name as string | null) ?? '—'}</td>
                <td class="email-col">{r.email as string}</td>
                <td><StatusBadge status={r.status as string} /></td>
                <td class="num-col">{r.attempt_count as number}</td>
                <td class="error-col" title={(r.error_message as string | null) ?? ''}>
                  {truncate(r.error_message as string | null)}
                </td>
                <td class="date-col">{fmtDate(r.last_attempt_at as string | null)}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
    {#if recipients.length === 50}
      <p class="table-note">Showing first 50 recipients. Download the report for the full list.</p>
    {/if}
  </Card>
</div>

<style>
  .campaign-detail {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Header */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-link:hover { color: var(--color-text); }
  .back-link .material-symbols-outlined { font-size: 1.125rem; }

  .header-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .page-meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .meta-icon { font-size: 0.875rem; }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Error banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-error-light);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: var(--font-size-sm);
  }

  .error-banner .material-symbols-outlined { font-size: 1.125rem; flex-shrink: 0; }

  .banner-close {
    margin-left: auto;
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-error);
    padding: 0;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .stat-success .stat-value  { color: var(--color-success); }
  .stat-failed .stat-value   { color: var(--color-error); }
  .stat-warning .stat-value  { color: var(--color-warning); }
  .stat-processing .stat-value { color: var(--color-info); }
  .stat-uncertain .stat-value { color: var(--color-warning); }

  /* Progress section */
  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 0.25rem 0;
  }

  .progress-header-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .progress-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .progress-pct {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .progress-sub {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* Controls */
  .controls-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.25rem 0;
  }

  .controls-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    min-width: 4rem;
  }

  .controls-btns {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Table */
  .table-header {
    display: flex;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.75rem;
  }

  .table-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .table-title .material-symbols-outlined { font-size: 1.125rem; color: var(--color-brand); }

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

  .num-col  { text-align: right; font-variant-numeric: tabular-nums; }
  .email-col { color: var(--color-text-muted); }
  .error-col { color: var(--color-error); font-size: var(--font-size-xs); max-width: 250px; }
  .date-col { white-space: nowrap; color: var(--color-text-muted); font-size: var(--font-size-xs); }

  .empty-row {
    text-align: center;
    padding: 2.5rem;
    color: var(--color-text-muted);
  }

  .empty-icon {
    display: block;
    font-size: 2rem;
    margin: 0 auto 0.5rem;
  }

  .table-note {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: center;
    padding-top: 0.75rem;
    margin: 0;
    border-top: 1px solid var(--color-border);
  }
</style>
