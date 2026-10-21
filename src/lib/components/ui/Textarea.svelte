<script lang="ts">
  export interface TextareaProps {
    label?: string;
    value?: string;
    error?: string;
    rows?: number;
    maxlength?: number;
    placeholder?: string;
    name?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string;
  }

  let {
    label,
    value = $bindable(''),
    error,
    rows = 4,
    maxlength,
    placeholder,
    name,
    required = false,
    disabled = false,
    id
  }: TextareaProps = $props();

  let textareaId = $derived(id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined));
  let charCount = $derived(value?.length ?? 0);
</script>

<div class="textarea-wrapper">
  {#if label}
    <div class="textarea-label-row">
      <label for={textareaId} class="textarea-label">
        {label}
        {#if required}<span class="required" aria-hidden="true">*</span>{/if}
      </label>
      {#if maxlength}
        <span class="char-count" class:near-limit={charCount >= maxlength * 0.9} class:over-limit={charCount >= maxlength}>
          {charCount}/{maxlength}
        </span>
      {/if}
    </div>
  {/if}

  <textarea
    id={textareaId}
    {name}
    {rows}
    {maxlength}
    {placeholder}
    {disabled}
    {required}
    bind:value
    class:has-error={!!error}
    aria-invalid={!!error}
    aria-describedby={error ? `${textareaId}-error` : undefined}
  ></textarea>

  {#if error}
    <p id="{textareaId}-error" class="textarea-error" role="alert">{error}</p>
  {/if}
</div>

<style>
  .textarea-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .textarea-label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .textarea-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required {
    color: var(--color-error);
    margin-left: 0.25rem;
  }

  .char-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .char-count.near-limit {
    color: var(--color-warning);
  }

  .char-count.over-limit {
    color: var(--color-error);
  }

  textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    resize: vertical;
    outline: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  textarea::placeholder {
    color: var(--color-text-subtle);
  }

  textarea:focus {
    border-color: var(--color-brand);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  textarea.has-error {
    border-color: var(--color-error);
  }

  textarea.has-error:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
  }

  .textarea-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
  }
</style>
