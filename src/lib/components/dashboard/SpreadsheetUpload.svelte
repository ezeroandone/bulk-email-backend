<script lang="ts">
  import { FileUpload, Button, Badge, Card, ProgressBar } from '$lib/components/ui';
  import { createSupabaseBrowserClient } from '$lib/supabase-browser';
  import type { ColumnDef, ValidationResult, Row, InvalidRow, Warning } from '$lib/server/services/spreadsheets/index';

  // ── Props ──────────────────────────────────────────────────────────────────
  interface Props {
    ondone?: (datasetId: string) => void;
  }

  let { ondone }: Props = $props();

  // ── Step machine ──────────────────────────────────────────────────────────
  // Steps: 'upload' → 'parsing' → 'configure' → 'saving' → 'done'
  type Step = 'upload' | 'parsing' | 'configure' | 'saving' | 'done';
  let step = $state<Step>('upload');
  let globalError = $state('');

  // ── File selection ─────────────────────────────────────────────────────────
  let files = $state<File[]>([]);
  let fileError = $state('');

  $effect(() => {
    if (files.length === 0) return;
    const f = files[0];
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      fileError = 'Only .xlsx and .csv files are supported.';
      files = [];
    } else {
      fileError = '';
    }
  });

  // ── Parsed data from server ────────────────────────────────────────────────
  interface ParsedResult {
    sheets: string[];
    activeSheet: string;
    columns: ColumnDef[];
    previewRows: Record<string, string>[];
    allRows: Record<string, string>[];
    validation: ValidationResult;
    emailColumn: string;
  }

  let parsed = $state<ParsedResult | null>(null);
  let selectedSheetIndex = $state(0);

  // ── Column config (editable by user) ──────────────────────────────────────
  interface ColConfig {
    original: string;
    normalized: string;
    guessedType: 'email' | 'identifier' | 'text';
    include: boolean;
    userNormalized: string; // editable
    userType: 'email' | 'identifier' | 'text';
  }

  let colConfigs = $state<ColConfig[]>([]);
  let emailColSelection = $state('');

  function initColConfigs(cols: ColumnDef[]) {
    colConfigs = cols.map((c) => ({
      original: c.original,
      normalized: c.normalized,
      guessedType: c.guessedType,
      include: true,
      userNormalized: c.normalized,
      userType: c.guessedType
    }));
  }

  // ── Dataset name ──────────────────────────────────────────────────────────
  let datasetName = $state('');

  // ── Saving progress ───────────────────────────────────────────────────────
  let savingProgress = $state(0);
  let savingLabel = $state('');

  // ── Validation summary display ────────────────────────────────────────────
  let showInvalidList = $state(false);
  let showWarningList = $state(false);

  // ── Derived helpers ────────────────────────────────────────────────────────
  let previewHeaders = $derived(
    colConfigs.filter((c) => c.include).map((c) => c.userNormalized)
  );

  let validCount = $derived(parsed?.validation.valid.length ?? 0);
  let invalidCount = $derived(parsed?.validation.invalid.length ?? 0);
  let warningCount = $derived(parsed?.validation.warnings.length ?? 0);
  let duplicateCount = $derived(parsed?.validation.duplicateEmails.length ?? 0);

  // ── Step 1: Parse file on server ──────────────────────────────────────────
  async function parseFile(sheetIdx = 0) {
    if (files.length === 0) return;
    step = 'parsing';
    globalError = '';

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('sheetIndex', String(sheetIdx));

      const res = await fetch('/api/datasets/parse', {
        method: 'POST',
        body: formData
      });

      const json: { success: boolean; data?: ParsedResult; error?: string } = await res.json();

      if (!json.success || !json.data) {
        globalError = json.error ?? 'Failed to parse file.';
        step = 'upload';
        return;
      }

      parsed = json.data;
      selectedSheetIndex = sheetIdx;
      datasetName = files[0].name.replace(/\.[^.]+$/, '');
      emailColSelection = json.data.emailColumn;
      initColConfigs(json.data.columns);
      step = 'configure';
    } catch (err) {
      globalError = 'An unexpected error occurred while parsing the file.';
      step = 'upload';
    }
  }

  function handleSheetChange(newIndex: number) {
    selectedSheetIndex = newIndex;
    void parseFile(newIndex);
  }

  // ── Step 2: Download validation report ────────────────────────────────────
  function downloadReport() {
    if (!parsed) return;
    // Build CSV client-side from the validation data
    const lines = ['"Row","Email","Status","Notes"'];
    for (const row of parsed.validation.valid) {
      const email = row.data[emailColSelection] ?? '';
      lines.push(`${row.index + 1},"${email}","valid",""`);
    }
    for (const row of parsed.validation.invalid) {
      const email = row.data[emailColSelection] ?? '';
      const reasons = row.reasons.join('; ').replace(/"/g, '""');
      lines.push(`${row.index + 1},"${email}","invalid","${reasons}"`);
    }
    for (const dup of parsed.validation.duplicateEmails) {
      lines.push(`,"${dup}","duplicate",""`);
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName}-validation-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Step 3: Save dataset ──────────────────────────────────────────────────
  async function saveDataset() {
    if (!parsed || !files[0]) return;

    step = 'saving';
    savingProgress = 0;
    savingLabel = 'Uploading file…';
    globalError = '';

    try {
      const supabase = createSupabaseBrowserClient();

      // 1. Upload to Supabase Storage
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        globalError = 'Session expired. Please reload and try again.';
        step = 'configure';
        return;
      }

      const ext = files[0].name.split('.').pop() ?? 'csv';
      const storagePath = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('datasets')
        .upload(storagePath, files[0], { upsert: false });

      if (uploadErr) {
        globalError = `Storage upload failed: ${uploadErr.message}`;
        step = 'configure';
        return;
      }

      savingProgress = 30;
      savingLabel = 'Creating dataset record…';

      // Build included columns for metadata
      const includedCols = colConfigs
        .filter((c) => c.include)
        .map((c, i) => ({
          index: i,
          name: c.userNormalized,
          sample: (parsed?.previewRows ?? [])
            .map((r) => r[c.normalized] ?? '')
            .slice(0, 5)
        }));

      // Preview rows using included columns only
      const previewRowsMapped = (parsed?.previewRows ?? []).map((r) => {
        const rec: Record<string, string> = {};
        colConfigs
          .filter((c) => c.include)
          .forEach((c) => {
            rec[c.userNormalized] = r[c.normalized] ?? '';
          });
        return rec;
      });

      // 2. POST dataset metadata
      const metaRes = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: datasetName.trim() || files[0].name,
          original_filename: files[0].name,
          storage_path: storagePath,
          mime_type: files[0].type || 'application/octet-stream',
          row_count: parsed?.allRows.length ?? 0,
          column_count: includedCols.length,
          columns: includedCols,
          preview_rows: previewRowsMapped
        })
      });

      const metaJson: { success: boolean; data?: { dataset: { id: string } }; error?: string } =
        await metaRes.json();

      if (!metaJson.success || !metaJson.data) {
        globalError = metaJson.error ?? 'Failed to create dataset record.';
        step = 'configure';
        return;
      }

      const datasetId = metaJson.data.dataset.id;
      savingProgress = 60;
      savingLabel = 'Saving rows…';

      // 3. POST rows in batches of 1000
      const allRows = (parsed?.allRows ?? []).map((r) => {
        const rec: Record<string, string> = {};
        colConfigs
          .filter((c) => c.include)
          .forEach((c) => {
            rec[c.userNormalized] = r[c.normalized] ?? '';
          });
        return rec;
      });

      const BATCH = 1000;
      for (let start = 0; start < allRows.length; start += BATCH) {
        const batch = allRows.slice(start, start + BATCH);
        const rowRes = await fetch(`/api/datasets/${datasetId}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: batch })
        });
        if (!rowRes.ok) {
          globalError = 'Failed to save rows.';
          step = 'configure';
          return;
        }
        savingProgress = 60 + Math.round((30 * (start + BATCH)) / allRows.length);
      }

      savingProgress = 100;
      savingLabel = 'Done!';
      step = 'done';
      ondone?.(datasetId);
    } catch {
      globalError = 'An unexpected error occurred while saving.';
      step = 'configure';
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    files = [];
    parsed = null;
    colConfigs = [];
    datasetName = '';
    emailColSelection = '';
    globalError = '';
    fileError = '';
    step = 'upload';
  }
</script>

<!-- ── Upload step ──────────────────────────────────────────────────────── -->
{#if step === 'upload'}
  <div class="wizard-step">
    <div class="step-header">
      <span class="material-symbols-outlined step-icon">upload_file</span>
      <div>
        <h2 class="step-title">Choose a spreadsheet</h2>
        <p class="step-desc">Upload a CSV or Excel (.xlsx) file to begin.</p>
      </div>
    </div>

    <FileUpload accept=".csv,.xlsx" maxSizeMB={50} bind:files />

    {#if fileError}
      <p class="error-text" role="alert">
        <span class="material-symbols-outlined">error</span>
        {fileError}
      </p>
    {/if}

    {#if globalError}
      <p class="error-text" role="alert">
        <span class="material-symbols-outlined">error</span>
        {globalError}
      </p>
    {/if}

    <div class="step-actions">
      <Button
        disabled={files.length === 0}
        onclick={() => void parseFile(0)}
      >
        {#snippet icon()}<span class="material-symbols-outlined">arrow_forward</span>{/snippet}
        Continue
      </Button>
    </div>
  </div>

<!-- ── Parsing step ─────────────────────────────────────────────────────── -->
{:else if step === 'parsing'}
  <div class="wizard-step centered">
    <span class="material-symbols-outlined spin-icon">sync</span>
    <p class="parsing-label">Parsing file…</p>
  </div>

<!-- ── Configure step ──────────────────────────────────────────────────── -->
{:else if step === 'configure' && parsed !== null}
  <div class="wizard-step">

    <!-- Dataset name -->
    <div class="field-group">
      <label class="field-label" for="dataset-name">Dataset name</label>
      <input
        id="dataset-name"
        class="text-input"
        type="text"
        bind:value={datasetName}
        placeholder="e.g. Recipients Q1 2025"
        aria-label="Dataset name"
      />
    </div>

    <!-- Sheet selector (XLSX only) -->
    {#if parsed.sheets.length > 1}
      <div class="field-group">
        <label class="field-label" for="sheet-select">Active sheet</label>
        <div class="select-wrap">
          <select
            id="sheet-select"
            class="text-input"
            onchange={(e) => handleSheetChange(Number((e.target as HTMLSelectElement).value))}
          >
            {#each parsed.sheets as sheetName, i}
              <option value={i} selected={i === selectedSheetIndex}>{sheetName}</option>
            {/each}
          </select>
          <span class="material-symbols-outlined chevron">expand_more</span>
        </div>
      </div>
    {/if}

    <!-- Email column selector -->
    <div class="field-group">
      <label class="field-label" for="email-col">Email column</label>
      <div class="select-wrap">
        <select id="email-col" class="text-input" bind:value={emailColSelection}>
          <option value="">— select email column —</option>
          {#each colConfigs as col}
            <option value={col.normalized}>{col.original}</option>
          {/each}
        </select>
        <span class="material-symbols-outlined chevron">expand_more</span>
      </div>
    </div>

    <!-- Column config table -->
    <section aria-label="Column configuration">
      <h3 class="section-title">
        <span class="material-symbols-outlined">table_chart</span>
        Columns
      </h3>
      <div class="table-scroll">
        <table class="col-table">
          <thead>
            <tr>
              <th>Original name</th>
              <th>Normalized name</th>
              <th>Type</th>
              <th>Include</th>
            </tr>
          </thead>
          <tbody>
            {#each colConfigs as col, i}
              <tr class:excluded={!col.include}>
                <td class="original-name">{col.original}</td>
                <td>
                  <input
                    class="inline-input"
                    type="text"
                    bind:value={colConfigs[i].userNormalized}
                    aria-label="Normalized name for {col.original}"
                  />
                </td>
                <td>
                  <div class="select-wrap-sm">
                    <select
                      class="inline-select"
                      bind:value={colConfigs[i].userType}
                      aria-label="Type for {col.original}"
                    >
                      <option value="email">email</option>
                      <option value="identifier">identifier</option>
                      <option value="text">text</option>
                    </select>
                    <span class="material-symbols-outlined chevron-sm">expand_more</span>
                  </div>
                </td>
                <td class="include-cell">
                  <label class="toggle-label" aria-label="Include {col.original}">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      bind:checked={colConfigs[i].include}
                    />
                    <span class="toggle-track">
                      <span class="toggle-thumb"></span>
                    </span>
                  </label>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Data preview -->
    <section aria-label="Data preview">
      <h3 class="section-title">
        <span class="material-symbols-outlined">preview</span>
        Preview (first 5 rows)
      </h3>
      {#if parsed.previewRows.length > 0 && previewHeaders.length > 0}
        <div class="table-scroll">
          <table class="preview-table">
            <thead>
              <tr>
                {#each previewHeaders as hdr}
                  <th>{hdr}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each parsed.previewRows as row}
                <tr>
                  {#each colConfigs.filter((c) => c.include) as col}
                    <td>{row[col.normalized] ?? ''}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="empty-preview">No data rows found.</p>
      {/if}
    </section>

    <!-- Validation summary -->
    <section class="validation-summary" aria-label="Validation summary">
      <h3 class="section-title">
        <span class="material-symbols-outlined">fact_check</span>
        Validation
      </h3>
      <div class="val-stats">
        <div class="val-stat val-stat--success">
          <span class="material-symbols-outlined">check_circle</span>
          <span class="val-count">{validCount}</span>
          <span class="val-label">valid</span>
        </div>
        <div class="val-stat val-stat--error">
          <span class="material-symbols-outlined">cancel</span>
          <span class="val-count">{invalidCount}</span>
          <span class="val-label">invalid</span>
        </div>
        <div class="val-stat val-stat--warning">
          <span class="material-symbols-outlined">warning</span>
          <span class="val-count">{warningCount}</span>
          <span class="val-label">warnings</span>
        </div>
        {#if duplicateCount > 0}
          <div class="val-stat val-stat--info">
            <span class="material-symbols-outlined">content_copy</span>
            <span class="val-count">{duplicateCount}</span>
            <span class="val-label">duplicates</span>
          </div>
        {/if}
      </div>

      {#if invalidCount > 0}
        <div class="val-section">
          <button
            type="button"
            class="val-toggle"
            onclick={() => (showInvalidList = !showInvalidList)}
            aria-expanded={showInvalidList}
          >
            <span class="material-symbols-outlined"
              >{showInvalidList ? 'expand_less' : 'expand_more'}</span
            >
            {showInvalidList ? 'Hide' : 'Show'} invalid rows ({invalidCount})
          </button>
          {#if showInvalidList}
            <ul class="issue-list">
              {#each parsed.validation.invalid.slice(0, 20) as row}
                <li class="issue-item issue-item--error">
                  <span class="material-symbols-outlined issue-icon">error</span>
                  <span>Row {row.index + 1}: {row.reasons.join(' | ')}</span>
                </li>
              {/each}
              {#if invalidCount > 20}
                <li class="issue-item issue-item--neutral">
                  … and {invalidCount - 20} more. Download the report for the full list.
                </li>
              {/if}
            </ul>
          {/if}
        </div>
      {/if}

      {#if warningCount > 0}
        <div class="val-section">
          <button
            type="button"
            class="val-toggle"
            onclick={() => (showWarningList = !showWarningList)}
            aria-expanded={showWarningList}
          >
            <span class="material-symbols-outlined"
              >{showWarningList ? 'expand_less' : 'expand_more'}</span
            >
            {showWarningList ? 'Hide' : 'Show'} warnings ({warningCount})
          </button>
          {#if showWarningList}
            <ul class="issue-list">
              {#each parsed.validation.warnings.slice(0, 20) as w}
                <li class="issue-item issue-item--warning">
                  <span class="material-symbols-outlined issue-icon">warning</span>
                  <span>{w.message}</span>
                </li>
              {/each}
              {#if warningCount > 20}
                <li class="issue-item issue-item--neutral">
                  … and {warningCount - 20} more.
                </li>
              {/if}
            </ul>
          {/if}
        </div>
      {/if}

      <div class="report-action">
        <Button variant="secondary" size="sm" onclick={downloadReport}>
          {#snippet icon()}<span class="material-symbols-outlined">download</span>{/snippet}
          Download validation report
        </Button>
      </div>
    </section>

    {#if globalError}
      <p class="error-text" role="alert">
        <span class="material-symbols-outlined">error</span>
        {globalError}
      </p>
    {/if}

    <div class="step-actions">
      <Button variant="secondary" onclick={reset}>
        {#snippet icon()}<span class="material-symbols-outlined">arrow_back</span>{/snippet}
        Start over
      </Button>
      <Button
        disabled={!emailColSelection || validCount === 0}
        onclick={() => void saveDataset()}
      >
        {#snippet icon()}<span class="material-symbols-outlined">save</span>{/snippet}
        Save dataset
        {#if validCount > 0}({validCount} rows){/if}
      </Button>
    </div>
  </div>

<!-- ── Saving step ──────────────────────────────────────────────────────── -->
{:else if step === 'saving'}
  <div class="wizard-step centered">
    <span class="material-symbols-outlined spin-icon">sync</span>
    <p class="parsing-label">{savingLabel}</p>
    <div class="save-progress">
      <ProgressBar value={savingProgress} max={100} animated label="Upload progress" />
    </div>
  </div>

<!-- ── Done step ───────────────────────────────────────────────────────── -->
{:else if step === 'done'}
  <div class="wizard-step centered">
    <span class="material-symbols-outlined done-icon">check_circle</span>
    <h2 class="step-title">Dataset saved!</h2>
    <p class="step-desc">Your spreadsheet has been imported and is ready to use in campaigns.</p>
    <div class="step-actions">
      <Button variant="secondary" onclick={reset}>
        {#snippet icon()}<span class="material-symbols-outlined">upload_file</span>{/snippet}
        Upload another
      </Button>
      <Button onclick={() => (window.location.href = '/dashboard/datasets')}>
        {#snippet icon()}<span class="material-symbols-outlined">list</span>{/snippet}
        View datasets
      </Button>
    </div>
  </div>
{/if}

<style>
  .wizard-step {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .wizard-step.centered {
    align-items: center;
    justify-content: center;
    min-height: 16rem;
    text-align: center;
    gap: 1rem;
  }

  /* Step header */
  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .step-icon {
    font-size: 2rem;
    color: var(--color-brand);
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .step-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .step-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0.25rem 0 0;
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Field groups */
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .field-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .text-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .text-input:focus {
    border-color: var(--color-brand);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .select-wrap select,
  .select-wrap-sm select {
    appearance: none;
    cursor: pointer;
  }

  .select-wrap .text-input {
    padding-right: 2.25rem;
  }

  .chevron {
    position: absolute;
    right: 0.625rem;
    font-size: 1.25rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  /* Section headers */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.75rem;
  }

  .section-title .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  /* Column config table */
  .table-scroll {
    overflow-x: auto;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .col-table,
  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .col-table th,
  .col-table td,
  .preview-table th,
  .preview-table td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .col-table th,
  .preview-table th {
    background: var(--color-bg-subtle);
    font-weight: 600;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .col-table tr:last-child td,
  .preview-table tr:last-child td {
    border-bottom: none;
  }

  .col-table tr.excluded td {
    opacity: 0.45;
  }

  .original-name {
    color: var(--color-text-muted);
    font-style: italic;
  }

  .inline-input {
    width: 10rem;
    padding: 0.25rem 0.5rem;
    font-family: inherit;
    font-size: var(--font-size-xs);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    outline: none;
  }

  .inline-input:focus {
    border-color: var(--color-brand);
  }

  .select-wrap-sm {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .inline-select {
    appearance: none;
    padding: 0.25rem 1.75rem 0.25rem 0.5rem;
    font-family: inherit;
    font-size: var(--font-size-xs);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    outline: none;
  }

  .inline-select:focus {
    border-color: var(--color-brand);
  }

  .chevron-sm {
    position: absolute;
    right: 0.25rem;
    font-size: 1rem;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .include-cell {
    text-align: center;
  }

  /* Toggle */
  .toggle-label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .toggle-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .toggle-track {
    position: relative;
    display: inline-block;
    width: 2.25rem;
    height: 1.25rem;
    background: var(--color-border-strong);
    border-radius: 9999px;
    transition: background var(--transition-fast);
  }

  .toggle-input:checked ~ .toggle-track {
    background: var(--color-brand);
  }

  .toggle-thumb {
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1rem;
    height: 1rem;
    background: #fff;
    border-radius: 50%;
    transition: transform var(--transition-fast);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .toggle-input:checked ~ .toggle-track .toggle-thumb {
    transform: translateX(1rem);
  }

  /* Preview */
  .empty-preview {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    padding: 1rem;
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    text-align: center;
  }

  /* Validation */
  .validation-summary {
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .val-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .val-stat {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
  }

  .val-stat .material-symbols-outlined {
    font-size: 1.125rem;
  }

  .val-count {
    font-weight: 700;
    font-size: var(--font-size-base);
  }

  .val-label {
    color: var(--color-text-muted);
  }

  .val-stat--success .material-symbols-outlined { color: var(--color-success); }
  .val-stat--success .val-count { color: var(--color-success); }
  .val-stat--error   .material-symbols-outlined { color: var(--color-error); }
  .val-stat--error   .val-count { color: var(--color-error); }
  .val-stat--warning .material-symbols-outlined { color: var(--color-warning); }
  .val-stat--warning .val-count { color: var(--color-warning); }
  .val-stat--info    .material-symbols-outlined { color: var(--color-info); }
  .val-stat--info    .val-count { color: var(--color-info); }

  .val-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .val-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    padding: 0;
  }

  .val-toggle:hover { color: var(--color-text); }

  .val-toggle .material-symbols-outlined { font-size: 1.125rem; }

  .issue-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 14rem;
    overflow-y: auto;
  }

  .issue-item {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    font-size: var(--font-size-xs);
    padding: 0.375rem 0.5rem;
    border-radius: var(--radius-sm);
    line-height: 1.5;
  }

  .issue-icon { font-size: 0.875rem; flex-shrink: 0; margin-top: 0.125rem; }

  .issue-item--error   { background: var(--color-error-light);   color: var(--color-error); }
  .issue-item--warning { background: var(--color-warning-light); color: var(--color-warning); }
  .issue-item--neutral { background: var(--color-bg-muted);      color: var(--color-text-muted); }

  .report-action { display: flex; justify-content: flex-end; }

  /* Parsing / saving */
  .spin-icon {
    font-size: 3rem;
    color: var(--color-brand);
    animation: spin 1s linear infinite;
  }

  .parsing-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .save-progress {
    width: 100%;
    max-width: 20rem;
  }

  /* Done */
  .done-icon {
    font-size: 4rem;
    color: var(--color-success);
  }

  /* Error text */
  .error-text {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-error);
    margin: 0;
  }

  .error-text .material-symbols-outlined { font-size: 1.125rem; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
