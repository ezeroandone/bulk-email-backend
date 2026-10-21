<script lang="ts">
  export interface VariablePickerProps {
    columns?: string[];
    onSelect?: (variable: string) => void;
  }

  let {
    columns = [],
    onSelect
  }: VariablePickerProps = $props();

  let open = $state(false);
  let search = $state('');
  let activeIndex = $state(-1);
  let containerEl = $state<HTMLDivElement | undefined>(undefined);

  let filtered = $derived(
    search.trim()
      ? columns.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
      : columns
  );

  function select(col: string) {
    onSelect?.(`{{${col}}}`);
    open = false;
    search = '';
    activeIndex = -1;
  }

  function toggle() {
    open = !open;
    if (open) {
      search = '';
      activeIndex = -1;
    }
  }

  function close() {
    open = false;
    search = '';
    activeIndex = -1;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(filtered[activeIndex]);
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      close();
    }
  }
</script>

<svelte:window onclick={open ? handleClickOutside : undefined} />

<div class="vp-wrapper" bind:this={containerEl} onkeydown={handleKeydown}>
  <button
    type="button"
    class="vp-trigger"
    onclick={toggle}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="Insert variable"
    title="Insert variable"
  >
    <span class="material-symbols-outlined" aria-hidden="true">data_object</span>
    <span>Insert variable</span>
    <span class="material-symbols-outlined" aria-hidden="true">{open ? 'expand_less' : 'expand_more'}</span>
  </button>

  {#if open}
    <div class="vp-panel" role="dialog" aria-label="Variable picker">
      <div class="vp-search">
        <span class="material-symbols-outlined vp-search-icon" aria-hidden="true">search</span>
        <input
          type="text"
          placeholder="Search columns…"
          bind:value={search}
          class="vp-search-input"
          aria-label="Search columns"
          autofocus
        />
      </div>
      {#if filtered.length > 0}
        <ul class="vp-list" role="listbox" aria-label="Available columns">
          {#each filtered as col, i}
            <li
              role="option"
              class="vp-item"
              class:focused={activeIndex === i}
              aria-selected={false}
              onclick={() => select(col)}
              onmouseenter={() => { activeIndex = i; }}
            >
              <span class="vp-item-name">{col}</span>
              <code class="vp-item-preview">{'{{' + col + '}}'}</code>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="vp-empty">No columns match "{search}"</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .vp-wrapper {
    position: relative;
    display: inline-block;
  }

  .vp-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .vp-trigger:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .vp-trigger:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .vp-trigger .material-symbols-outlined {
    font-size: 1.125rem;
  }

  .vp-panel {
    position: absolute;
    top: calc(100% + 0.375rem);
    left: 0;
    width: 16rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    overflow: hidden;
    animation: vp-in 0.1s ease-out;
  }

  @keyframes vp-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .vp-search {
    position: relative;
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
  }

  .vp-search-icon {
    position: absolute;
    left: 1rem;
    font-size: 1rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .vp-search-input {
    width: 100%;
    padding: 0.375rem 0.5rem 0.375rem 2rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
  }

  .vp-search-input:focus {
    border-color: var(--color-brand);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .vp-list {
    list-style: none;
    margin: 0;
    padding: 0.25rem;
    max-height: 14rem;
    overflow-y: auto;
  }

  .vp-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
    gap: 0.5rem;
  }

  .vp-item:hover,
  .vp-item.focused {
    background: var(--color-bg-muted);
  }

  .vp-item-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vp-item-preview {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: var(--color-bg-muted);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Courier New', monospace;
  }

  .vp-empty {
    padding: 1rem;
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
