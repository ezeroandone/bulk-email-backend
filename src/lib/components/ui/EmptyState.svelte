<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface EmptyStateProps {
    icon?: string;
    title?: string;
    description?: string;
    actions?: Snippet;
  }

  let {
    icon = 'inbox',
    title = 'Nothing here yet',
    description,
    actions
  }: EmptyStateProps = $props();
</script>

<div class="empty-state">
  <span class="empty-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
  <h3 class="empty-title">{title}</h3>
  {#if description}
    <p class="empty-description">{description}</p>
  {/if}
  {#if actions}
    <div class="empty-actions">
      {@render actions()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    gap: 0.75rem;
  }

  .empty-icon {
    font-size: 3rem;
    color: var(--color-text-subtle);
  }

  .empty-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .empty-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    max-width: 28rem;
    line-height: 1.6;
  }

  .empty-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.5rem;
  }
</style>
