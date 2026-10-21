<script lang="ts">
  import { Card, Button, FileUpload } from '$lib/components/ui';

  let files = $state<File[]>([]);
  let uploading = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (files.length === 0) return;
    uploading = true;
    // Full upload wizard (SpreadsheetUpload component) will be built in Step 2.
    // For now, navigate to datasets list after simulated prep.
    window.location.href = '/dashboard/datasets';
  }
</script>

<svelte:head>
  <title>Upload Spreadsheet — MergeMail</title>
</svelte:head>

<div class="new-dataset-page">
  <div class="page-header">
    <a href="/dashboard/datasets" class="back-link">
      <span class="material-symbols-outlined">arrow_back</span>
      Back to Datasets
    </a>
    <h1 class="page-title">Upload Spreadsheet</h1>
    <p class="page-subtitle">
      Upload a CSV or Excel file to create a recipient dataset. The full column-mapping wizard will
      be available in the next update.
    </p>
  </div>

  <Card>
    <form onsubmit={handleSubmit} class="upload-form">
      <FileUpload
        accept=".csv,.xlsx,.xls"
        maxSizeMB={50}
        bind:files
      />

      {#if files.length > 0}
        <div class="ready-hint">
          <span class="material-symbols-outlined hint-icon">info</span>
          <span>
            File ready. Click <strong>Continue</strong> to proceed to the column-mapping wizard.
          </span>
        </div>
      {/if}

      <div class="form-actions">
        <Button
          variant="secondary"
          onclick={() => (window.location.href = '/dashboard/datasets')}
          type="button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={files.length === 0}
          loading={uploading}
        >
          {#snippet icon()}<span class="material-symbols-outlined">arrow_forward</span>{/snippet}
          Continue
        </Button>
      </div>
    </form>
  </Card>

  <Card class="info-card">
    <h2 class="info-title">
      <span class="material-symbols-outlined">help_outline</span>
      Supported Formats
    </h2>
    <ul class="info-list">
      <li>
        <span class="material-symbols-outlined info-icon">table_chart</span>
        <strong>.xlsx / .xls</strong> — Microsoft Excel workbooks (first sheet is imported)
      </li>
      <li>
        <span class="material-symbols-outlined info-icon">description</span>
        <strong>.csv</strong> — Comma-separated values (UTF-8 recommended)
      </li>
    </ul>
    <p class="info-note">
      The first row of your spreadsheet must contain column headers. Each row becomes one recipient
      in your dataset.
    </p>
  </Card>
</div>

<style>
  .new-dataset-page {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header { display: flex; flex-direction: column; gap: 0.375rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: 0.25rem;
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
    line-height: 1.6;
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .ready-hint {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-info-light);
    color: var(--color-info);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  .hint-icon { font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem; }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  /* Info card */
  .info-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .info-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .info-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .info-icon {
    font-size: 1.125rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .info-note {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.6;
    padding: 0.75rem;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }
</style>
