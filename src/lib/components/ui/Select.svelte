<script lang="ts">
  export interface SelectOption {
    value: string;
    label: string;
  }

  export interface SelectProps {
    label?: string;
    value?: string;
    error?: string;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    name?: string;
    required?: boolean;
    id?: string;
  }

  let {
    label,
    value = $bindable(''),
    error,
    options = [],
    placeholder = 'Select…',
    disabled = false,
    name,
    required = false,
    id
  }: SelectProps = $props();

  let selectId = $derived(id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined));
</script>

<div class="select-wrapper">
  {#if label}
    <label for={selectId} class="select-label">
      {label}
      {#if required}<span class="required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}

  <div class="select-field" class:has-error={!!error} class:disabled>
    <select
      id={selectId}
      {name}
      {disabled}
      {required}
      bind:value
      aria-invalid={!!error}
      aria-describedby={error ? `${selectId}-error` : undefined}
    >
      {#if placeholder}
        <option value="" disabled selected={!value}>{placeholder}</option>
      {/if}
      {#each options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <span class="select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
  </div>

  {#if error}
    <p id="{selectId}-error" class="select-error" role="alert">{error}</p>
  {/if}
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .select-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required {
    color: var(--color-error);
    margin-left: 0.25rem;
  }

  .select-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .select-field select {
    width: 100%;
    padding: 0.5rem 2.25rem 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    appearance: none;
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .select-field select:focus {
    border-color: var(--color-brand);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .select-field.has-error select {
    border-color: var(--color-error);
  }

  .select-field.disabled select {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
  }

  .select-chevron {
    position: absolute;
    right: 0.625rem;
    font-size: 1.25rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .select-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
  }
</style>
