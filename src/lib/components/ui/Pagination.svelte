<script lang="ts">
  export interface PaginationProps {
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
  }

  let {
    page = $bindable(1),
    pageSize = 10,
    total = 0,
    onPageChange
  }: PaginationProps = $props();

  let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));

  function goTo(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    page = p;
    onPageChange?.(p);
  }

  /** Build page-number list with at most 7 items, using -1 for ellipsis */
  let pageNumbers = $derived.by((): number[] => {
    const tp = totalPages;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);

    const left  = Math.max(2, page - 1);
    const right = Math.min(tp - 1, page + 1);
    const pages: number[] = [1];

    if (left > 2) pages.push(-1);
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < tp - 1) pages.push(-1);
    pages.push(tp);
    return pages;
  });
</script>

<nav class="pagination" aria-label="Pagination">
  <button
    type="button"
    class="page-btn"
    onclick={() => goTo(page - 1)}
    disabled={page <= 1}
    aria-label="Previous page"
  >
    <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
  </button>

  {#each pageNumbers as p}
    {#if p === -1}
      <span class="page-ellipsis" aria-hidden="true">…</span>
    {:else}
      <button
        type="button"
        class="page-btn"
        class:active={p === page}
        onclick={() => goTo(p)}
        aria-label="Page {p}"
        aria-current={p === page ? 'page' : undefined}
      >
        {p}
      </button>
    {/if}
  {/each}

  <button
    type="button"
    class="page-btn"
    onclick={() => goTo(page + 1)}
    disabled={page >= totalPages}
    aria-label="Next page"
  >
    <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
  </button>
</nav>

<style>
  .pagination {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.375rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    font-weight: 500;
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  }

  .page-btn:hover:not(:disabled):not(.active) {
    background: var(--color-bg-muted);
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }

  .page-btn.active {
    background: var(--color-brand);
    color: var(--color-text-inverse);
    border-color: var(--color-brand);
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .page-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    user-select: none;
  }
</style>
