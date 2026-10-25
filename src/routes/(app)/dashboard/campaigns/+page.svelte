<script lang="ts">
  import { Card, Button, Badge, StatusBadge, EmptyState, Input, Select } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let searchInput = $state(data.search);
  let statusFilter = $state(data.status);

  function applyFilters() {
    const url = new URL(window.location.href);
    if (searchInput) url.searchParams.set('q', searchInput);
    else url.searchParams.delete('q');
    if (statusFilter) url.searchParams.set('status', statusFilter);
    else url.searchParams.delete('status');
    window.location.href = url.toString();
  }

  async function handleDelete(e: Event, campaignId: string, campaignName: string) {
    e.preventDefault();
    if (!confirm(`Delete "${campaignName}"? This removes all recipients, jobs, and file matches. This cannot be undone.`)) return;
    const form = e.currentTarget as HTMLFormElement;
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
    if (res.ok) {
      window.location.reload();
    } else {
      const j = await res.json().catch(() => ({}));
      alert((j as Record<string, unknown>).error ?? 'Failed to delete campaign');
    }
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' },
    { value: 'queued', label: 'Queued' },
    { value: 'processing', label: 'Processing' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const modeLabels: Record<string, string> = {
    standard: 'Standard',
    ab: 'A/B',
    abc: 'A/B/C'
  };
</script>

<svelte:head>
  <title>Campaigns — MergeMail</title>
</svelte:head>

<div class="campaigns-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">Manage and track your bulk email campaigns.</p>
    </div>
    <a href="/dashboard/campaigns/new" class="btn-link">
      <span class="material-symbols-outlined">add</span>
      New Campaign
    </a>
  </div>

  <!-- Filters -->
  <div class="filters-row">
    <Input
      placeholder="Search campaigns…"
      bind:value={searchInput}
    />
    <Select
      options={statusOptions}
      bind:value={statusFilter}
      placeholder="All Statuses"
    />
    <Button variant="secondary" onclick={applyFilters}>
      {#snippet icon()}<span class="material-symbols-outlined">filter_list</span>{/snippet}
      Filter
    </Button>
    {#if data.status || data.search}
      <Button
        variant="ghost"
        onclick={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('q');
          url.searchParams.delete('status');
          window.location.href = url.toString();
        }}
      >
        Clear
      </Button>
    {/if}
  </div>

  {#if data.campaigns.length === 0}
    <Card>
      <EmptyState
        icon="campaign"
        title={data.status || data.search ? 'No campaigns match your filter' : 'No campaigns yet'}
        description={data.status || data.search
          ? 'Try adjusting your search or filter criteria.'
          : 'Create your first campaign to start sending personalized emails.'}
      >
        {#snippet actions()}
          {#if !data.status && !data.search}
            <a href="/dashboard/campaigns/new" class="btn-link">
              <span class="material-symbols-outlined">add</span>
              New Campaign
            </a>
          {/if}
        {/snippet}
      </EmptyState>
    </Card>
  {:else}
    <Card>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Mode</th>
              <th scope="col">Status</th>
              <th scope="col">Recipients</th>
              <th scope="col">Sent</th>
              <th scope="col">Failed</th>
              <th scope="col">Created</th>
              <th scope="col" class="action-col"></th>
            </tr>
          </thead>
          <tbody>
            {#each data.campaigns as campaign (campaign.id)}
              <tr
                class="clickable-row"
                onclick={() => { window.location.href = `/dashboard/campaigns/${campaign.id}`; }}
                onkeydown={(e) => { if (e.key === 'Enter') window.location.href = `/dashboard/campaigns/${campaign.id}`; }}
                role="link"
                tabindex="0"
                aria-label="View campaign {campaign.name}"
              >
                <td>
                  <span class="campaign-name">{campaign.name}</span>
                </td>
                <td>
                  <Badge variant="neutral">
                    {modeLabels[campaign.mode ?? 'standard'] ?? campaign.mode ?? 'Standard'}
                  </Badge>
                </td>
                <td><StatusBadge status={campaign.status} /></td>
                <td class="num-col">{(campaign.recipient_count ?? 0).toLocaleString()}</td>
                <td class="num-col count-sent">—</td>
                <td class="num-col count-failed">—</td>
                <td class="date-col">{fmtDate(campaign.created_at)}</td>
                <td class="action-col">
                  <form method="POST" action="?/delete" onsubmit={(e) => handleDelete(e, campaign.id, campaign.name)}>
                    <input type="hidden" name="campaign_id" value={campaign.id} />
                    <button type="submit" class="delete-btn" title="Delete campaign" aria-label="Delete campaign">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}
</div>

<style>
  .campaigns-page {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

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

  .btn-link {
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

  .btn-link:hover { background: var(--color-brand-hover); }

  .filters-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: flex-start;
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

  .clickable-row { cursor: pointer; }
  .clickable-row:hover td { background: var(--color-bg-subtle); }

  .clickable-row:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: -2px;
  }

  .campaign-name {
    font-weight: 500;
    color: var(--color-text);
  }

  .num-col  { text-align: right; font-variant-numeric: tabular-nums; }
  .count-sent  { color: var(--color-success); font-weight: 500; }
  .count-failed { color: var(--color-error);  font-weight: 500; }
  .date-col { white-space: nowrap; color: var(--color-text-muted); }

  .action-col { width: 3rem; text-align: center; }

  .delete-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .delete-btn:hover {
    background: var(--color-error-light);
    color: var(--color-error);
  }

  .delete-btn .material-symbols-outlined { font-size: 1.125rem; }
</style>
