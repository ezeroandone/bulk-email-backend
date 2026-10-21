<script lang="ts">
  import { Card } from '$lib/components/ui';
  import SpreadsheetUpload from '$lib/components/dashboard/SpreadsheetUpload.svelte';

  function handleDone(datasetId: string) {
    window.location.href = `/dashboard/datasets/${datasetId}`;
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
      Upload a CSV or Excel file to create a recipient dataset. Map columns, review validation, then save.
    </p>
  </div>

  <Card>
    <SpreadsheetUpload ondone={handleDone} />
  </Card>
</div>

<style>
  .new-dataset-page {
    max-width: 820px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: 0.25rem;
  }

  .back-link:hover {
    color: var(--color-brand);
  }

  .back-link .material-symbols-outlined {
    font-size: 1rem;
  }

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
</style>
