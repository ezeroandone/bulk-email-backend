<script lang="ts">
  export interface ProgressBarProps {
    value?: number;
    max?: number;
    animated?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'error';
    label?: string;
  }

  let {
    value = 0,
    max = 100,
    animated = false,
    variant = 'default',
    label
  }: ProgressBarProps = $props();

  let pct = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
</script>

<div class="progress-wrapper">
  {#if label}
    <div class="progress-header">
      <span class="progress-label">{label}</span>
      <span class="progress-pct">{Math.round(pct)}%</span>
    </div>
  {/if}
  <div
    class="progress-track"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-label={label ?? 'Progress'}
  >
    <div
      class="progress-fill progress-fill-{variant}"
      class:animated
      style="width: {pct}%"
    ></div>
  </div>
  {#if !label}
    <span class="progress-pct-small" aria-hidden="true">{Math.round(pct)}%</span>
  {/if}
</div>

<style>
  .progress-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .progress-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .progress-pct {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .progress-pct-small {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .progress-track {
    height: 0.5rem;
    background: var(--color-bg-muted);
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease-out;
  }

  .progress-fill.animated {
    background-image: linear-gradient(
      90deg,
      transparent 25%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    from { background-position: 200% center; }
    to   { background-position: -200% center; }
  }

  .progress-fill-default { background-color: var(--color-brand); }
  .progress-fill-success { background-color: var(--color-success); }
  .progress-fill-warning { background-color: var(--color-warning); }
  .progress-fill-error   { background-color: var(--color-error); }
</style>
