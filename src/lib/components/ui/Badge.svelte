<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface BadgeProps {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';
    children?: Snippet;
  }

  let {
    variant = 'neutral',
    children
  }: BadgeProps = $props();
</script>

<span class="badge badge-{variant}">
  {#if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
  }

  .badge-success {
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .badge-warning {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }

  .badge-error {
    background: var(--color-error-light);
    color: var(--color-error);
  }

  .badge-info {
    background: var(--color-info-light);
    color: var(--color-info);
  }

  .badge-neutral {
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
  }

  .badge-pending {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }
</style>
