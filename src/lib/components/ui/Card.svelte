<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface CardProps {
    padding?: 'sm' | 'md' | 'lg';
    hover?: boolean;
    clickable?: boolean;
    class?: string;
    children?: Snippet;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    padding = 'md',
    hover = false,
    clickable = false,
    class: extraClass = '',
    children,
    onclick
  }: CardProps = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card card-pad-{padding} {extraClass}"
  class:card-hover={hover}
  class:card-clickable={clickable}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .card-pad-sm { padding: 0.75rem; }
  .card-pad-md { padding: 1.25rem; }
  .card-pad-lg { padding: 2rem; }

  .card-hover {
    transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
  }

  .card-hover:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-strong);
  }

  .card-clickable {
    cursor: pointer;
    transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
  }

  .card-clickable:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-strong);
  }

  .card-clickable:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }
</style>
