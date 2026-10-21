<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface DropdownItem {
    label: string;
    icon?: string;
    separator?: boolean;
    onClick: () => void;
    disabled?: boolean;
  }

  export interface DropdownProps {
    items?: DropdownItem[];
    trigger?: Snippet;
  }

  let {
    items = [],
    trigger
  }: DropdownProps = $props();

  let open = $state(false);
  let activeIndex = $state(-1);
  let containerEl = $state<HTMLDivElement | undefined>(undefined);

  function toggle() {
    open = !open;
    if (open) activeIndex = -1;
  }

  function close() {
    open = false;
    activeIndex = -1;
  }

  function selectItem(item: DropdownItem) {
    if (item.disabled || item.separator) return;
    item.onClick();
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;

    const selectableItems = items.filter((it) => !it.separator && !it.disabled);
    const selectableIndexes = items
      .map((it, i) => (!it.separator && !it.disabled ? i : -1))
      .filter((i) => i !== -1);

    if (e.key === 'Escape') {
      close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentPos = selectableIndexes.indexOf(activeIndex);
      const next = currentPos < selectableIndexes.length - 1 ? currentPos + 1 : 0;
      activeIndex = selectableIndexes[next];
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentPos = selectableIndexes.indexOf(activeIndex);
      const prev = currentPos > 0 ? currentPos - 1 : selectableIndexes.length - 1;
      activeIndex = selectableIndexes[prev];
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectItem(items[activeIndex]);
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      close();
    }
  }
</script>

<svelte:window onclick={open ? handleClickOutside : undefined} onkeydown={handleKeydown} />

<div class="dropdown-wrapper" bind:this={containerEl}>
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    role="button"
    class="dropdown-trigger"
    onclick={toggle}
    aria-haspopup="menu"
    aria-expanded={open}
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }}}
  >
    {#if trigger}
      {@render trigger()}
    {/if}
  </div>

  {#if open}
    <div class="dropdown-menu" role="menu" aria-label="Actions">
      {#each items as item, i}
        {#if item.separator}
          <hr class="dropdown-sep" role="separator" />
        {:else}
          <button
            type="button"
            role="menuitem"
            class="dropdown-item"
            class:active={activeIndex === i}
            class:disabled={item.disabled}
            disabled={item.disabled}
            onclick={() => selectItem(item)}
          >
            {#if item.icon}
              <span class="material-symbols-outlined dropdown-item-icon" aria-hidden="true">{item.icon}</span>
            {/if}
            {item.label}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown-wrapper {
    position: relative;
    display: inline-block;
  }

  .dropdown-trigger {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }

  .dropdown-trigger:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.375rem);
    right: 0;
    min-width: 10rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    overflow: hidden;
    animation: dd-in 0.1s ease-out;
  }

  @keyframes dd-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.5rem 0.875rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-text);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .dropdown-item:hover:not(.disabled),
  .dropdown-item.active:not(.disabled) {
    background: var(--color-bg-muted);
  }

  .dropdown-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-item-icon {
    font-size: 1rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .dropdown-sep {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 0.25rem 0;
  }
</style>
