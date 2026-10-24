<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Input, Modal, ConfirmDialog, Pagination } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  interface DatasetRow {
    id: string;
    row_index: number;
    data: Record<string, unknown>;
  }

  interface DatasetColumn {
    id: string;
    name: string;
    normalized_name: string;
    position: number;
  }

  let columns = $derived(
    (data.dataset.dataset_columns as DatasetColumn[] | null) ?? []
  );

  // Edit modal
  let editOpen = $state(false);
  let editRow = $state<DatasetRow | null>(null);
  let editData = $state<Record<string, string>>({});

  function openEdit(row: DatasetRow) {
    editRow = row;
    editData = Object.fromEntries(
      Object.entries(row.data).map(([k, v]) => [k, String(v ?? '')])
    );
    editOpen = true;
  }

  // Delete confirm
  let deleteOpen = $state(false);
  let deleteRowId = $state<string | null>(null);

  function confirmDeleteRow(id: string) {
    deleteRowId = id;
    deleteOpen = true;
  }

  // Search
  let searchInput = $state(data.search);

  function handleSearch(e: Event) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchInput);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  let saving = $state(false);
</script>

<svelte:head>
  <title>{data.dataset.name} — Datasets — MergeMail</title>
</svelte:head>

<div class="dataset-detail-page">
  <!-- Header -->
  <div class="page-header">
    <div class="breadcrumb">
      <a href="/dashboard/datasets" class="back-link">
        <span class="material-symbols-outlined">arrow_back</span>
        Datasets
      </a>
    </div>
    <div class="header-main">
      <h1 class="page-title">{data.dataset.name}</h1>
      <div class="header-meta">
        <span class="meta-item">
          <span class="material-symbols-outlined meta-icon">table_rows</span>
          {(data.dataset.row_count ?? 0).toLocaleString()} rows
        </span>
        <span class="meta-item">
          <span class="material-symbols-outlined meta-icon">view_column</span>
          {(data.dataset.column_count ?? 0).toLocaleString()} columns
        </span>
        <span class="meta-item">
          <span class="material-symbols-outlined meta-icon">calendar_today</span>
          {fmtDate(data.dataset.created_at)}
        </span>
      </div>
    </div>
  </div>

  {#if form?.message}
    <div class="alert alert--error" role="alert">
      <span class="material-symbols-outlined">error</span>
      {form.message}
    </div>
  {/if}

  <!-- Search -->
  <form onsubmit={handleSearch} class="search-form">
    <Input
      placeholder="Search rows…"
      bind:value={searchInput}
      name="q"
    />
    <Button type="submit" variant="secondary">
      {#snippet icon()}<span class="material-symbols-outlined">search</span>{/snippet}
      Search
    </Button>
    {#if data.search}
      <Button
        variant="ghost"
        onclick={() => {
          searchInput = '';
          const url = new URL(window.location.href);
          url.searchParams.delete('q');
          url.searchParams.set('page', '1');
          window.location.href = url.toString();
        }}
      >
        Clear
      </Button>
    {/if}
  </form>

  <!-- Table -->
  <Card>
    {#if columns.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">table_rows</span>
        <p>No rows found{data.search ? ' matching your search' : ''}.</p>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              {#each columns as col}
                <th scope="col">{col.name}</th>
              {/each}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.rows as row (row.id)}
              <tr>
                <td class="row-num">{row.row_index + 1}</td>
                {#each columns as col}
                  <td class="data-cell">
                    {String((row.data as Record<string, unknown>)[col.name] ?? '')}
                  </td>
                {/each}
                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="icon-btn"
                      aria-label="Edit row"
                      onclick={() => openEdit(row)}
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      class="icon-btn icon-btn--danger"
                      aria-label="Delete row"
                      onclick={() => confirmDeleteRow(row.id)}
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

      {#if data.totalRows > 20}
        <div class="pagination-row">
          <Pagination
            page={data.page}
            pageSize={20}
            total={data.totalRows}
            onPageChange={(p) => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', String(p));
              window.location.href = url.toString();
            }}
          />
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- Edit row modal -->
<Modal bind:open={editOpen} title="Edit Row" size="md">
  {#snippet children()}
    {#if editRow}
      <form
        id="edit-row-form"
        method="POST"
        action="?/updateRow"
        use:enhance={() => {
          saving = true;
          return async ({ update }) => {
            saving = false;
            editOpen = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="row_id" value={editRow.id} />
        <input type="hidden" name="data" value={JSON.stringify(editData)} />
        <div class="edit-fields">
          {#each columns as col}
            <Input
              label={col.name}
              bind:value={editData[col.name]}
            />
          {/each}
        </div>
      </form>
    {/if}
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={() => { editOpen = false; }}>Cancel</Button>
    <Button type="submit" form="edit-row-form" loading={saving}>Save</Button>
  {/snippet}
</Modal>

<!-- Delete row confirm -->
<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Row"
  message="This will permanently delete this row from the dataset. Continue?"
  confirmLabel="Delete"
  danger
  onConfirm={async () => {
    if (!deleteRowId) return;
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '?/deleteRow';
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = 'row_id'; inp.value = deleteRowId;
    f.appendChild(inp);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<style>
  .dataset-detail-page {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .breadcrumb { margin-bottom: 0.25rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .back-link:hover { color: var(--color-brand); }
  .back-link .material-symbols-outlined { font-size: 1rem; }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.5rem;
  }

  .header-meta {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .meta-icon { font-size: 1rem; }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .alert--error { background: var(--color-error-light); color: var(--color-error); }

  .search-form {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
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
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .data-table td {
    padding: 0.625rem 0.75rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover td { background: var(--color-bg-subtle); }

  .row-num { color: var(--color-text-subtle); font-size: var(--font-size-xs); }

  .data-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-actions {
    display: flex;
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
    padding: 0;
  }

  .icon-btn:hover { background: var(--color-bg-muted); color: var(--color-text); }
  .icon-btn--danger:hover { background: var(--color-error-light); color: var(--color-error); }
  .icon-btn .material-symbols-outlined { font-size: 1.125rem; }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    gap: 0.75rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .empty-icon { font-size: 2.5rem; color: var(--color-text-subtle); }

  .pagination-row {
    display: flex;
    justify-content: center;
    padding: 1rem 0 0.25rem;
  }

  .edit-fields {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
</style>
