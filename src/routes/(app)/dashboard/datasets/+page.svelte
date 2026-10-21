<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Input, ConfirmDialog, EmptyState, Badge } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  interface Dataset {
    id: string;
    name: string;
    row_count: number | null;
    column_count: number | null;
    original_filename: string | null;
    created_at: string;
  }

  // Rename state
  let renamingId = $state<string | null>(null);
  let renameValue = $state('');

  function startRename(ds: Dataset) {
    renamingId = ds.id;
    renameValue = ds.name;
  }

  function cancelRename() {
    renamingId = null;
    renameValue = '';
  }

  // Delete confirm
  let deleteOpen = $state(false);
  let deleteId = $state<string | null>(null);

  function confirmDelete(id: string) {
    deleteId = id;
    deleteOpen = true;
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Datasets — MergeMail</title>
</svelte:head>

<div class="datasets-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Datasets</h1>
      <p class="page-subtitle">Your uploaded spreadsheets and recipient lists.</p>
    </div>
    <a href="/dashboard/datasets/new" class="btn-link">
      <span class="material-symbols-outlined">upload_file</span>
      Upload Spreadsheet
    </a>
  </div>

  {#if form?.message}
    <div class="alert alert--error" role="alert">
      <span class="material-symbols-outlined">error</span>
      {form.message}
    </div>
  {/if}

  {#if data.datasets.length === 0}
    <Card>
      <EmptyState
        icon="table_chart"
        title="No datasets yet"
        description="Upload a spreadsheet to create your first recipient list."
      >
        {#snippet actions()}
          <a href="/dashboard/datasets/new" class="btn-link">
            <span class="material-symbols-outlined">upload_file</span>
            Upload Spreadsheet
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
              <th scope="col">Rows</th>
              <th scope="col">Columns</th>
              <th scope="col">Uploaded</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.datasets as ds (ds.id)}
              <tr>
                <td>
                  {#if renamingId === ds.id}
                    <form
                      method="POST"
                      action="?/rename"
                      use:enhance={() => {
                        return async ({ update }) => {
                          renamingId = null;
                          await update();
                        };
                      }}
                      class="rename-form"
                    >
                      <input type="hidden" name="id" value={ds.id} />
                      <Input name="name" bind:value={renameValue} required />
                      <Button type="submit" size="sm">Save</Button>
                      <Button variant="ghost" size="sm" onclick={cancelRename}>Cancel</Button>
                    </form>
                  {:else}
                    <div class="name-cell">
                      <a href="/dashboard/datasets/{ds.id}" class="dataset-link">{ds.name}</a>
                      {#if ds.original_filename}
                        <span class="filename-hint">{ds.original_filename}</span>
                      {/if}
                    </div>
                  {/if}
                </td>
                <td class="num-col">{(ds.row_count ?? 0).toLocaleString()}</td>
                <td class="num-col">{(ds.column_count ?? 0).toLocaleString()}</td>
                <td class="date-col">{fmtDate(ds.created_at)}</td>
                <td>
                  <div class="row-actions">
                    <a href="/dashboard/datasets/{ds.id}" class="icon-btn" aria-label="View dataset">
                      <span class="material-symbols-outlined">visibility</span>
                    </a>
                    <button
                      type="button"
                      class="icon-btn"
                      aria-label="Rename dataset"
                      onclick={() => startRename(ds)}
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <form method="POST" action="?/duplicate" use:enhance>
                      <input type="hidden" name="id" value={ds.id} />
                      <button type="submit" class="icon-btn" aria-label="Duplicate dataset">
                        <span class="material-symbols-outlined">content_copy</span>
                      </button>
                    </form>
                    <button
                      type="button"
                      class="icon-btn icon-btn--danger"
                      aria-label="Delete dataset"
                      onclick={() => confirmDelete(ds.id)}
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}
</div>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Dataset"
  message="This will permanently delete the dataset and all associated row data. Campaigns that use it will be affected. Continue?"
  confirmLabel="Delete"
  danger
  onConfirm={async () => {
    if (!deleteId) return;
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '?/delete';
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = 'id'; inp.value = deleteId;
    f.appendChild(inp);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<style>
  .datasets-page {
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

  .btn-link:hover {
    background: var(--color-brand-hover);
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .alert--error { background: var(--color-error-light); color: var(--color-error); }

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

  .name-cell {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .dataset-link {
    font-weight: 500;
    color: var(--color-text);
    text-decoration: none;
  }

  .dataset-link:hover { color: var(--color-brand); text-decoration: underline; }

  .filename-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
  }

  .num-col { text-align: right; font-variant-numeric: tabular-nums; color: var(--color-text-muted); }
  .date-col { white-space: nowrap; color: var(--color-text-muted); }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    text-decoration: none;
    padding: 0;
  }

  .icon-btn:hover { background: var(--color-bg-muted); color: var(--color-text); }
  .icon-btn--danger:hover { background: var(--color-error-light); color: var(--color-error); }

  .icon-btn .material-symbols-outlined { font-size: 1.125rem; }

  .rename-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
