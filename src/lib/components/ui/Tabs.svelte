<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface TabsProps {
    activeTab?: string;
    /** Array of tab definitions for rendering the tab bar */
    tabs?: Array<{ id: string; label: string }>;
    children?: Snippet;
  }

  let {
    activeTab = $bindable(''),
    tabs = [],
    children
  }: TabsProps = $props();

  function selectTab(id: string) {
    activeTab = id;
  }

  function handleKeydown(e: KeyboardEvent, id: string) {
    const ids = tabs.map((t) => t.id);
    const idx = ids.indexOf(id);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectTab(ids[(idx + 1) % ids.length]);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectTab(ids[(idx - 1 + ids.length) % ids.length]);
    }
    if (e.key === 'Home') { e.preventDefault(); selectTab(ids[0]); }
    if (e.key === 'End')  { e.preventDefault(); selectTab(ids[ids.length - 1]); }
  }
</script>

<div class="tabs-root">
  {#if tabs.length > 0}
    <div class="tabs-list" role="tablist">
      {#each tabs as tab}
        <button
          type="button"
          role="tab"
          id="tab-{tab.id}"
          aria-controls="tabpanel-{tab.id}"
          aria-selected={activeTab === tab.id}
          class="tab-btn"
          class:active={activeTab === tab.id}
          onclick={() => selectTab(tab.id)}
          onkeydown={(e) => handleKeydown(e, tab.id)}
          tabindex={activeTab === tab.id ? 0 : -1}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="tabs-content">
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .tabs-root {
    display: flex;
    flex-direction: column;
  }

  .tabs-list {
    display: flex;
    border-bottom: 2px solid var(--color-border);
    gap: 0;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 0.625rem 1rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    font-weight: 500;
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    white-space: nowrap;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .tab-btn:hover:not(.active) {
    color: var(--color-text);
    border-bottom-color: var(--color-border-strong);
  }

  .tab-btn.active {
    color: var(--color-brand);
    border-bottom-color: var(--color-brand);
  }

  .tab-btn:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: -2px;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }

  .tabs-content {
    min-height: 0;
  }
</style>
