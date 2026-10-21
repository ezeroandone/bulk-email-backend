<script lang="ts">
  import { Card, Button, Badge, EmptyState } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Email Templates — MergeMail</title>
</svelte:head>

<div class="email-templates-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Email Templates</h1>
      <p class="page-subtitle">Reusable subject and body templates for your campaigns.</p>
    </div>
    <a href="/dashboard/email-templates/new" class="btn-link">
      <span class="material-symbols-outlined">add</span>
      New Template
    </a>
  </div>

  {#if data.templates.length === 0}
    <Card>
      <EmptyState
        icon="mail"
        title="No email templates yet"
        description="Create reusable subject lines and email bodies with variable placeholders."
      >
        {#snippet actions()}
          <a href="/dashboard/email-templates/new" class="btn-link">
            <span class="material-symbols-outlined">add</span>
            New Template
          </a>
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
              <th scope="col">Subject Preview</th>
              <th scope="col">Format</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.templates as tpl (tpl.id)}
              <tr>
                <td class="name-cell">
                  <a href="/dashboard/email-templates/{tpl.id}" class="tpl-link">{tpl.name}</a>
                </td>
                <td class="subject-cell">{tpl.subject_template}</td>
                <td>
                  <Badge variant="neutral">{tpl.is_html ? 'HTML' : 'Plain Text'}</Badge>
                </td>
                <td class="date-col">{fmtDate(tpl.created_at)}</td>
                <td>
                  <a href="/dashboard/email-templates/{tpl.id}" class="icon-btn" aria-label="Edit template">
                    <span class="material-symbols-outlined">edit</span>
                  </a>
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
  .email-templates-page {
    max-width: 1100px;
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

  .name-cell { font-weight: 500; }
  .subject-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-muted);
  }

  .date-col { white-space: nowrap; color: var(--color-text-muted); }

  .tpl-link {
    color: var(--color-text);
    text-decoration: none;
  }

  .tpl-link:hover { color: var(--color-brand); text-decoration: underline; }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .icon-btn:hover { background: var(--color-bg-muted); color: var(--color-text); }
  .icon-btn .material-symbols-outlined { font-size: 1.125rem; }
</style>
