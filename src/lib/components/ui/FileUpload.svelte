<script lang="ts">
  export interface FileUploadProps {
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
    files?: File[];
  }

  let {
    accept = '*/*',
    multiple = false,
    maxSizeMB,
    files = $bindable([])
  }: FileUploadProps = $props();

  let dragging = $state(false);
  let error = $state('');
  let inputEl = $state<HTMLInputElement | undefined>(undefined);

  function validateAndAdd(incoming: FileList | null) {
    if (!incoming) return;
    error = '';
    const valid: File[] = [];

    for (const file of Array.from(incoming)) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        error = `"${file.name}" exceeds the ${maxSizeMB} MB size limit.`;
        continue;
      }
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map((s) => s.trim());
        const match = acceptedTypes.some((type) => {
          if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
          if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -2));
          return file.type === type;
        });
        if (!match) {
          error = `"${file.name}" is not an accepted file type.`;
          continue;
        }
      }
      valid.push(file);
    }

    if (valid.length) {
      files = multiple ? [...files, ...valid] : [valid[0]];
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    validateAndAdd(e.dataTransfer?.files ?? null);
  }

  function handleChange(e: Event) {
    validateAndAdd((e.target as HTMLInputElement).files);
    if (inputEl) inputEl.value = '';
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
</script>

<div class="file-upload">
  <!-- Drop zone -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drop-zone"
    class:dragging
    class:has-error={!!error}
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => { dragging = false; }}
    ondrop={handleDrop}
    onclick={() => inputEl?.click()}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputEl?.click(); }}
    aria-label="Upload files. Click or drag and drop."
  >
    <span class="material-symbols-outlined upload-icon" aria-hidden="true">cloud_upload</span>
    <p class="upload-label">
      <strong>Click to browse</strong> or drag and drop
    </p>
    {#if accept !== '*/*'}
      <p class="upload-hint">Accepted: {accept}</p>
    {/if}
    {#if maxSizeMB}
      <p class="upload-hint">Max size: {maxSizeMB} MB</p>
    {/if}
  </div>

  <input
    type="file"
    bind:this={inputEl}
    {accept}
    {multiple}
    class="file-input-hidden"
    onchange={handleChange}
    aria-hidden="true"
    tabindex="-1"
  />

  {#if error}
    <p class="upload-error" role="alert">{error}</p>
  {/if}

  {#if files.length > 0}
    <ul class="file-list" aria-label="Selected files">
      {#each files as file, i}
        <li class="file-item">
          <span class="material-symbols-outlined file-icon" aria-hidden="true">description</span>
          <div class="file-info">
            <span class="file-name">{file.name}</span>
            <span class="file-size">{formatSize(file.size)}</span>
          </div>
          <button
            type="button"
            class="file-remove"
            onclick={() => removeFile(i)}
            aria-label="Remove {file.name}"
          >
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .file-upload {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem 1.5rem;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    text-align: center;
  }

  .drop-zone:hover,
  .drop-zone.dragging {
    border-color: var(--color-brand);
    background: var(--color-brand-light);
  }

  .drop-zone.has-error {
    border-color: var(--color-error);
  }

  .drop-zone:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }

  .upload-icon {
    font-size: 2.5rem;
    color: var(--color-text-muted);
  }

  .upload-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .upload-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
    margin: 0;
  }

  .file-input-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    clip: rect(0, 0, 0, 0);
    overflow: hidden;
  }

  .upload-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
  }

  .file-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .file-icon {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .file-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .file-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .file-remove:hover {
    background: var(--color-error-light);
    color: var(--color-error);
  }

  .file-remove .material-symbols-outlined {
    font-size: 1rem;
  }
</style>
