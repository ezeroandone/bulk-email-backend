<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface InputProps {
    label?: string;
    value?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
    type?: string;
    placeholder?: string;
    name?: string;
    id?: string;
    'leading-icon'?: Snippet;
    'trailing-icon'?: Snippet;
  }

  let {
    label,
    value = $bindable(''),
    error,
    hint,
    disabled = false,
    required = false,
    type = 'text',
    placeholder,
    name,
    id,
    'leading-icon': leadingIcon,
    'trailing-icon': trailingIcon
  }: InputProps = $props();

  let inputId = $derived(id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined));
</script>

<div class="input-wrapper">
  {#if label}
    <label for={inputId} class="input-label">
      {label}
      {#if required}<span class="required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}

  <div class="input-field" class:has-error={!!error} class:disabled>
    {#if leadingIcon}
      <span class="input-icon input-icon--leading" aria-hidden="true">
        {@render leadingIcon()}
      </span>
    {/if}

    <input
      {type}
      {name}
      id={inputId}
      {placeholder}
      {disabled}
      {required}
      bind:value
      class:has-leading={!!leadingIcon}
      class:has-trailing={!!trailingIcon}
      aria-invalid={!!error}
      aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
    />

    {#if trailingIcon}
      <span class="input-icon input-icon--trailing" aria-hidden="true">
        {@render trailingIcon()}
      </span>
    {/if}
  </div>

  {#if error}
    <p id="{inputId}-error" class="input-error" role="alert">{error}</p>
  {:else if hint}
    <p id="{inputId}-hint" class="input-hint">{hint}</p>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .input-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required {
    color: var(--color-error);
    margin-left: 0.25rem;
  }

  .input-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-field input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    outline: none;
  }

  .input-field input::placeholder {
    color: var(--color-text-subtle);
  }

  .input-field input:focus {
    border-color: var(--color-brand);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .input-field.has-error input {
    border-color: var(--color-error);
  }

  .input-field.has-error input:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .input-field.disabled input {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
  }

  .input-icon {
    position: absolute;
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
    pointer-events: none;
    z-index: 1;
  }

  .input-icon--leading {
    left: 0.625rem;
  }

  .input-icon--trailing {
    right: 0.625rem;
  }

  .input-field input.has-leading {
    padding-left: 2.25rem;
  }

  .input-field input.has-trailing {
    padding-right: 2.25rem;
  }

  .input-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
  }

  .input-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
