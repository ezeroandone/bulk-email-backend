<script lang="ts">
  import { Card, Button, Badge, EmptyState } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const typeLabel: Record<string, string> = {
    docx: 'Word',
    pdf: 'PDF',
    image: 'Image'
  };
</script>

<svelte:head>
  <title>Document Templates — MergeMail</title>
</svelte:head>

<div class="templates-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Document Templates</h1>
      <p class="page-subtitle">Manage your document templates for mail merge.</p>
    </div>
    <a href="/dashboard/templates/new" class="btn-link">
      <span class="material-symbols-outlined">add</span>
      New Template
    </a>
  </div>

  {#if data.templates.length === 0}
    <Card>
      <EmptyState
        icon="description"
        title="No templates yet"
        description="Upload a Word or PDF template with placeholder fields to get started."
      >
        {#snippet actions()}
          <a href="/dashboard/templates/new" class="btn-link">
            <span class="material-symbols-outlined">add</span>
            New Template
          </a>
        {/snippet}
      </EmptyState>
    </Card>
  {:else}
    <div class="templates-grid">
      {#each data.templates as tpl (tpl.id)}
        <Card hover>
          <div class="tpl-card">
            <div class="tpl-icon-wrap">
              <span class="material-symbols-outlined tpl-icon">description</span>
            </div>
            <div class="tpl-info">
              <div class="tpl-name-row">
                <h3 class="tpl-name">{tpl.name}</h3>
                <Badge variant="neutral">{typeLabel[tpl.type] ?? tpl.type}</Badge>
              </div>
              <div class="tpl-meta">
                {#if tpl.placeholders?.length}
                  <span class="meta-item">
                    <span class="material-symbols-outlined">data_object</span>
                    {tpl.placeholders.length} placeholders
                  </span>
                {/if}
                <span class="meta-item">
                  <span class="material-symbols-outlined">calendar_today</span>
                  {fmtDate(tpl.created_at)}
                </span>
              </div>
            </div>
            <a href="/dashboard/templates/{tpl.id}" class="tpl-link" aria-label="View template {tpl.name}">
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<style>
  .templates-page {
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

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1rem;
  }

  .tpl-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .tpl-icon-wrap {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    background: var(--color-brand-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tpl-icon {
    font-size: 1.5rem;
    color: var(--color-brand);
  }

  .tpl-info { flex: 1; min-width: 0; }

  .tpl-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
  }

  .tpl-name {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tpl-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0 0 0.375rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tpl-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .meta-item .material-symbols-outlined { font-size: 0.875rem; }

  .tpl-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: background var(--transition-fast), color var(--transition-fast);
    flex-shrink: 0;
  }

  .tpl-link:hover { background: var(--color-bg-muted); color: var(--color-brand); }
</style>
