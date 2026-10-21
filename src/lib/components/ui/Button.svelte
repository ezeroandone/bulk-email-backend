<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    icon?: Snippet;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    class: extraClass = '',
    onclick,
    icon,
    children
  }: ButtonProps = $props();

  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
</script>

<button
  {type}
  class="{baseClass} {variantClass} {sizeClass} {extraClass}"
  disabled={disabled || loading}
  {onclick}
  aria-busy={loading}
>
  {#if loading}
    <span class="btn-spinner" aria-hidden="true"></span>
  {:else if icon}
    {@render icon()}
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      color var(--transition-fast),
      border-color var(--transition-fast),
      opacity var(--transition-fast);
    white-space: nowrap;
    text-decoration: none;
    position: relative;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  /* Sizes */
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: var(--font-size-xs);
    line-height: 1.25rem;
  }

  .btn-md {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
    line-height: 1.5rem;
  }

  .btn-lg {
    padding: 0.625rem 1.25rem;
    font-size: var(--font-size-base);
    line-height: 1.75rem;
  }

  /* Variants */
  .btn-primary {
    background: var(--color-brand);
    color: var(--color-text-inverse);
    border-color: var(--color-brand);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-brand-hover);
    border-color: var(--color-brand-hover);
  }

  .btn-secondary {
    background: var(--color-bg-muted);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-subtle);
    border-color: var(--color-border-strong);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-muted);
    border-color: transparent;
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .btn-danger {
    background: var(--color-error);
    color: #fff;
    border-color: var(--color-error);
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
  }

  /* Spinner */
  .btn-spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  @keyframes btn-spin {
    to { transform: rotate(360deg); }
  }
</style>
