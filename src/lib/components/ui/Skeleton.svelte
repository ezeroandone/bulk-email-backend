<script lang="ts">
  export interface SkeletonProps {
    variant?: 'line' | 'card' | 'table';
    lines?: number;
    rows?: number;
  }

  let {
    variant = 'line',
    lines = 3,
    rows = 5
  }: SkeletonProps = $props();
</script>

{#if variant === 'line'}
  <div class="skeleton-lines" aria-busy="true" aria-label="Loading…">
    {#each { length: lines } as _, i}
      <div class="skeleton-line" style="width: {i === lines - 1 ? '60%' : '100%'}"></div>
    {/each}
  </div>
{:else if variant === 'card'}
  <div class="skeleton-card" aria-busy="true" aria-label="Loading…">
    <div class="skeleton-card-header">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-card-meta">
        <div class="skeleton-line" style="width: 60%"></div>
        <div class="skeleton-line" style="width: 40%"></div>
      </div>
    </div>
    <div class="skeleton-line" style="width: 100%"></div>
    <div class="skeleton-line" style="width: 80%"></div>
    <div class="skeleton-line" style="width: 90%"></div>
  </div>
{:else if variant === 'table'}
  <div class="skeleton-table" aria-busy="true" aria-label="Loading…">
    <!-- Header -->
    <div class="skeleton-table-row skeleton-table-header">
      {#each { length: 4 } as _}
        <div class="skeleton-line" style="width: 80%"></div>
      {/each}
    </div>
    <!-- Rows -->
    {#each { length: rows } as _}
      <div class="skeleton-table-row">
        {#each { length: 4 } as _}
          <div class="skeleton-line" style="width: 75%"></div>
        {/each}
      </div>
    {/each}
  </div>
{/if}

<style>
  .skeleton-line,
  .skeleton-avatar {
    background: var(--color-bg-muted);
    border-radius: var(--radius-sm);
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  .skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .skeleton-line {
    height: 1rem;
  }

  /* Card variant */
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .skeleton-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .skeleton-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .skeleton-card-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Table variant */
  .skeleton-table {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .skeleton-table-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .skeleton-table-row:last-child {
    border-bottom: none;
  }

  .skeleton-table-header {
    background: var(--color-bg-subtle);
  }

  .skeleton-table-header .skeleton-line {
    height: 0.875rem;
  }
</style>
