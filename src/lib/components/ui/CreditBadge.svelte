<script lang="ts">
  export interface CreditBadgeProps {
    balance?: number;
    lowThreshold?: number;
  }

  let {
    balance = 0,
    lowThreshold = 10
  }: CreditBadgeProps = $props();

  let isLow = $derived(balance <= lowThreshold);
</script>

<span class="credit-badge" class:low={isLow} aria-label="Credit balance: {balance.toLocaleString()}">
  <span class="material-symbols-outlined credit-icon" aria-hidden="true">toll</span>
  <span class="credit-number">{balance.toLocaleString()}</span>
  {#if isLow}
    <span class="credit-warning material-symbols-outlined" aria-label="Low credits" title="Low credits">warning</span>
  {/if}
</span>

<style>
  .credit-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    background: var(--color-brand-light);
    color: var(--color-brand);
    font-size: var(--font-size-sm);
    font-weight: 600;
    transition: background var(--transition-fast);
    white-space: nowrap;
  }

  .credit-badge.low {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }

  .credit-icon {
    font-size: 1rem;
  }

  .credit-number {
    font-variant-numeric: tabular-nums;
  }

  .credit-warning {
    font-size: 1rem;
  }
</style>
