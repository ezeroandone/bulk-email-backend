<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // ── State ──────────────────────────────────────────────────────────────────

  type TemplateMode = 'docx' | 'pdf' | 'image' | null;

  let selectedMode = $state<TemplateMode>(null);
  let file = $state<File | null>(null);
  let name = $state('');
  let description = $state('');
  let uploading = $state(false);
  let error = $state<string | null>(null);
  let dragOver = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const accept = $derived(() => {
    if (selectedMode === 'docx') return '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (selectedMode === 'pdf') return '.pdf,application/pdf';
    if (selectedMode === 'image') return '.png,.jpg,.jpeg,.webp,.gif,.tiff,.tif,image/png,image/jpeg,image/webp,image/gif,image/tiff';
    return '*';
  });

  const canUpload = $derived(file !== null && name.trim().length > 0 && !uploading);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) {
      file = input.files[0];
      if (!name.trim()) {
        // Auto-fill name from filename
        name = input.files[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      }
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const dropped = e.dataTransfer?.files[0];
    if (dropped) {
      file = dropped;
      if (!name.trim()) {
        name = dropped.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      }
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function handleUpload() {
    if (!file || !name.trim()) return;
    error = null;
    uploading = true;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', name.trim());
      form.append('description', description.trim());
      form.append('mode', selectedMode ?? 'pdf');

      const res = await fetch('/api/doc-templates', {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? `Upload failed (${res.status})`);
      }

      const json = await res.json() as { data?: { template?: { id?: string } } };
      const id = json.data?.template?.id;
      if (id) {
        goto(`/dashboard/templates/${id}`);
      } else {
        goto('/dashboard/templates');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Upload failed.';
    } finally {
      uploading = false;
    }
  }

  const modeCards: { mode: TemplateMode; icon: string; label: string; desc: string }[] = [
    {
      mode: 'docx',
      icon: 'article',
      label: 'Word Document',
      desc: 'Upload a .docx file with {{placeholder}} variables. MergeMail will detect all placeholders automatically.'
    },
    {
      mode: 'pdf',
      icon: 'picture_as_pdf',
      label: 'PDF Template',
      desc: 'Upload a PDF and visually place text fields on it using the field editor.'
    },
    {
      mode: 'image',
      icon: 'image',
      label: 'Image Template',
      desc: 'Upload a PNG, JPEG, WebP, GIF, or TIFF image as a background. Add text overlays to create a PDF.'
    }
  ];
</script>

<svelte:head>
  <title>New Template — MergeMail</title>
</svelte:head>

<div class="new-template-page">
  <div class="page-header">
    <a href="/dashboard/templates" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Templates
    </a>
    <h1 class="page-title">New Document Template</h1>
    <p class="page-subtitle">Choose the type of template you want to create.</p>
  </div>

  <!-- Step 1: choose mode -->
  {#if !selectedMode}
    <div class="mode-grid">
      {#each modeCards as card (card.mode)}
        <button
          type="button"
          class="mode-card"
          onclick={() => (selectedMode = card.mode)}
        >
          <span class="mode-icon material-symbols-outlined" aria-hidden="true">{card.icon}</span>
          <span class="mode-label">{card.label}</span>
          <span class="mode-desc">{card.desc}</span>
          <span class="mode-arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Step 2: upload form -->
    <Card>
      <div class="upload-form">
        <div class="step-back-row">
          <button
            type="button"
            class="step-back"
            onclick={() => { selectedMode = null; file = null; error = null; }}
          >
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Change type
          </button>
          <span class="selected-mode">
            <span class="material-symbols-outlined" aria-hidden="true">
              {modeCards.find((c) => c.mode === selectedMode)?.icon ?? 'description'}
            </span>
            {modeCards.find((c) => c.mode === selectedMode)?.label}
          </span>
        </div>

        <!-- Drop zone -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="drop-zone"
          class:drag-over={dragOver}
          class:has-file={file !== null}
          ondrop={handleDrop}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          onclick={() => document.getElementById('template-file-input')?.click()}
          role="button"
          tabindex="0"
          aria-label="Upload template file"
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('template-file-input')?.click(); }}
        >
          <input
            id="template-file-input"
            type="file"
            accept={accept()}
            class="file-input-hidden"
            aria-hidden="true"
            tabindex="-1"
            onchange={handleFileChange}
          />
          {#if file}
            <span class="material-symbols-outlined drop-icon ok" aria-hidden="true">check_circle</span>
            <span class="drop-filename">{file.name}</span>
            <span class="drop-hint">Click to change</span>
          {:else}
            <span class="material-symbols-outlined drop-icon" aria-hidden="true">upload_file</span>
            <span class="drop-label">Drop your file here or click to browse</span>
            <span class="drop-hint">
              {selectedMode === 'docx' ? '.docx files' : selectedMode === 'pdf' ? '.pdf files' : 'PNG, JPEG, WebP, GIF, or TIFF images'}
            </span>
          {/if}
        </div>

        <!-- Fields -->
        <div class="fields">
          <div class="field-group">
            <label class="field-label" for="tpl-name">
              Template Name <span class="required" aria-hidden="true">*</span>
            </label>
            <input
              id="tpl-name"
              type="text"
              class="field-input"
              placeholder="e.g. Certificate of Participation"
              bind:value={name}
            />
          </div>
          <div class="field-group">
            <label class="field-label" for="tpl-desc">Description</label>
            <textarea
              id="tpl-desc"
              class="field-textarea"
              rows="2"
              placeholder="Optional description…"
              bind:value={description}
            ></textarea>
          </div>
        </div>

        {#if error}
          <p class="upload-error" role="alert">
            <span class="material-symbols-outlined" aria-hidden="true">error</span>
            {error}
          </p>
        {/if}

        <div class="form-actions">
          <a href="/dashboard/templates" class="cancel-link">Cancel</a>
          <Button
            variant="primary"
            size="md"
            loading={uploading}
            disabled={!canUpload}
            onclick={handleUpload}
          >
            {#snippet icon()}<span class="material-symbols-outlined">upload</span>{/snippet}
            {#snippet children()}Upload Template{/snippet}
          </Button>
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .new-template-page {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header { display: flex; flex-direction: column; gap: 0.25rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: 0.5rem;
    width: fit-content;
  }

  .back-link:hover { color: var(--color-brand); }
  .back-link .material-symbols-outlined { font-size: 1rem; }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* Mode grid */
  .mode-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .mode-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-xl);
    cursor: pointer;
    text-align: left;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast),
      transform var(--transition-fast);
    font-family: inherit;
    color: var(--color-text);
  }

  .mode-card:hover {
    border-color: var(--color-brand);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .mode-icon {
    font-size: 2rem;
    color: var(--color-brand);
  }

  .mode-label {
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .mode-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.5;
    flex: 1;
  }

  .mode-arrow {
    color: var(--color-brand);
    align-self: flex-end;
  }

  /* Upload form */
  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .step-back-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .step-back {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color var(--transition-fast);
  }

  .step-back:hover { color: var(--color-brand); }
  .step-back .material-symbols-outlined { font-size: 1rem; }

  .selected-mode {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-brand);
    background: var(--color-brand-light);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  .selected-mode .material-symbols-outlined { font-size: 1rem; }

  /* Drop zone */
  .drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2.5rem 1rem;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-xl);
    cursor: pointer;
    text-align: center;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    background: var(--color-bg-muted);
    position: relative;
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    border-color: var(--color-brand);
    background: var(--color-brand-light);
  }

  .drop-zone.has-file { border-style: solid; border-color: var(--color-success); background: var(--color-success-light); }

  .file-input-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .drop-icon { font-size: 2.5rem; color: var(--color-text-muted); }
  .drop-icon.ok { color: var(--color-success); }

  .drop-label {
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--color-text);
  }

  .drop-filename {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-success);
  }

  .drop-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  /* Fields */
  .fields { display: flex; flex-direction: column; gap: 0.875rem; }

  .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .field-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required { color: var(--color-error); margin-left: 0.25rem; }

  .field-input,
  .field-textarea {
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast);
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
  }

  .field-input:focus,
  .field-textarea:focus { border-color: var(--color-brand); }

  /* Error */
  .upload-error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-error);
    padding: 0.625rem 0.875rem;
    background: var(--color-error-light);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-error);
    margin: 0;
  }

  .upload-error .material-symbols-outlined { font-size: 1rem; flex-shrink: 0; }

  /* Form actions */
  .form-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .cancel-link {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .cancel-link:hover { color: var(--color-text); }
</style>
