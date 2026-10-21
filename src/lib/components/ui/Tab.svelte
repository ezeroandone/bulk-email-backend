<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface TabProps {
    id: string;
    label: string;
    children?: Snippet;
    /** Set by parent Tabs component */
    active?: boolean;
    onActivate?: (id: string) => void;
  }

  let {
    id,
    label,
    children,
    active = false,
    onActivate
  }: TabProps = $props();
</script>

<!-- Tab button rendered by parent Tabs; this component only exposes the panel -->
{#if active}
  <div
    role="tabpanel"
    id="tabpanel-{id}"
    aria-labelledby="tab-{id}"
    class="tab-panel"
    tabindex="0"
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
{/if}

<style>
  .tab-panel {
    outline: none;
    padding-top: 1rem;
  }

  .tab-panel:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
</style>
