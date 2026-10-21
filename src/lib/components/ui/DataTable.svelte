<script lang="ts">
  import Skeleton from './Skeleton.svelte';
  import EmptyState from './EmptyState.svelte';

  export interface DataTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (row: unknown) => string;
  }

  export interface DataTableProps {
    columns?: DataTableColumn[];
    rows?: unknown[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: unknown) => void;
  }

  let {
    columns = [],
    rows = [],
    loading = false,
    emptyMessage = 'No data found',
    onRowClick
  }: DataTableProps = $props();

  type SortDir = 'asc' | 'desc';
  let sortKey = $state<string | null>(null);
  let sortDir = $state<SortDir>('asc');

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
  }

  let sortedRows = $derived.by(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey!];
      const bv = (b as Record<string, unknown>)[sortKey!];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  });

  function getCellValue(row: unknown, col: DataTableColumn): string {
    if (col.render) return col.render(row);
    return String((row as Record<string, unknown>)[col.key] ?? '');
  }
</script>

<div class="datatable-wrapper">
  {#if loading}
    <Skeleton variant="table" rows={5} />
  {:else}
    <div class="datatable-scroll">
      <table class="datatable">
        <thead>
          <tr>
            {#each columns as col}
              <th
                class="datatable-th"
                class:sortable={col.sortable}
                onclick={col.sortable ? () => toggleSort(col.key) : undefined}
                aria-sort={col.sortable && sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                scope="col"
              >
                <span class="th-inner">
                  {col.label}
                  {#if col.sortable}
                    <span class="sort-icon material-symbols-outlined" aria-hidden="true">
                      {sortKey === col.key ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  {/if}
                </span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#if sortedRows.length === 0}
            <tr>
              <td colspan={columns.length} class="datatable-empty">
                <EmptyState icon="table_rows" title={emptyMessage} />
              </td>
            </tr>
          {:else}
            {#each sortedRows as row, i}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <tr
                class="datatable-row"
                class:clickable={!!onRowClick}
                onclick={onRowClick ? () => onRowClick(row) : undefined}
                tabindex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {#each columns as col}
                  <td class="datatable-td">{getCellValue(row, col)}</td>
                {/each}
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .datatable-wrapper {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .datatable-scroll {
    overflow-x: auto;
    width: 100%;
  }

  .datatable {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .datatable-th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
    user-select: none;
  }

  .datatable-th.sortable {
    cursor: pointer;
  }

  .datatable-th.sortable:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .th-inner {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .sort-icon {
    font-size: 1rem;
    color: var(--color-text-subtle);
  }

  .datatable-row:nth-child(even) {
    background: var(--color-bg-subtle);
  }

  .datatable-row:hover {
    background: var(--color-bg-muted);
  }

  .datatable-row.clickable {
    cursor: pointer;
  }

  .datatable-row.clickable:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: -2px;
  }

  .datatable-td {
    padding: 0.75rem 1rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .datatable-row:last-child .datatable-td {
    border-bottom: none;
  }

  .datatable-empty {
    padding: 0;
    border: none;
  }
</style>
