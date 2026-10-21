<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import type { SelectOption } from '$lib/components/ui/Select.svelte';

  // ── Types ──────────────────────────────────────────────────────────────────

  export interface PlaceholderMapping {
    placeholder: string;
    column: string;
  }

  export interface DocxTemplateEditorProps {
    /** Placeholder names detected in the DOCX */
    placeholders: string[];
    /** Available dataset column names */
    columns: string[];
    /** Current mappings: placeholder → column */
    mappings?: PlaceholderMapping[];
    /** Preview data: first row from dataset */
    previewData?: Record<string, string>;
    onSave?: (mappings: PlaceholderMapping[]) => void;
    saving?: boolean;
  }

  // ── Props ──────────────────────────────────────────────────────────────────

  let {
    placeholders = [],
    columns = [],
    mappings = $bindable([]),
    previewData = {},
    onSave,
    saving = false
  }: DocxTemplateEditorProps = $props();

  // ── State ──────────────────────────────────────────────────────────────────

  // Build a mutable map: placeholder → column
  let mapping = $state<Record<string, string>>(
    Object.fromEntries(mappings.map((m) => [m.placeholder, m.column]))
  );

  let showPreview = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const columnOptions = $derived<SelectOption[]>(
    columns.map((c) => ({ value: c, label: c }))
  );

  const previewText = $derived(() => {
    if (!showPreview) return null;
    const lines: string[] = [];
    for (const ph of placeholders) {
      const col = mapping[ph];
      const val = col && previewData[col] ? previewData[col] : `{{${ph}}}`;
      lines.push(`${ph}: ${val}`);
    }
    return lines;
  });

  const unmappedCount = $derived(
    placeholders.filter((p) => !mapping[p]).length
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function setMapping(placeholder: string, column: string) {
    mapping = { ...mapping, [placeholder]: column };
  }

  function handleSave() {
    const result: PlaceholderMapping[] = placeholders
      .filter((p) => mapping[p])
      .map((p) => ({ placeholder: p, column: mapping[p] }));
    onSave?.(result);
  }

  // Auto-map: try to find a column whose name matches the placeholder
  function autoMap() {
    const next = { ...mapping };
    for (const ph of placeholders) {
      if (next[ph]) continue;
      const matched = columns.find(
        (c) =>
          c.toLowerCase() === ph.toLowerCase() ||
          c.toLowerCase().replace(/[\s_]/g, '_') === ph.toLowerCase()
      );
      if (matched) next[ph] = matched;
    }
    mapping = next;
  }
</script>

<div class="docx-editor">
  <div class="editor-header">
    <div class="header-left">
      <h2 class="editor-title">
        <span class="material-symbols-outlined" aria-hidden="true">article</span>
        Template Variables
      </h2>
      <p class="editor-subtitle">
        Map each template placeholder to a dataset column.
      </p>
    </div>
    <div class="header-actions">
      <Button variant="ghost" size="sm" onclick={autoMap} disabled={columns.length === 0}>
        {#snippet icon()}<span class="material-symbols-outlined">auto_fix_high</span>{/snippet}
        {#snippet children()}Auto-map{/snippet}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => (showPreview = !showPreview)}
        disabled={Object.keys(previewData).length === 0}
      >
        {#snippet icon()}<span class="material-symbols-outlined">{showPreview ? 'visibility_off' : 'preview'}</span>{/snippet}
        {#snippet children()}{showPreview ? 'Hide' : 'Preview'}{/snippet}
      </Button>
    </div>
  </div>

  {#if placeholders.length === 0}
    <div class="empty-state">
      <span class="material-symbols-outlined empty-icon" aria-hidden="true">data_object</span>
      <p>No placeholders detected in this template.</p>
    </div>
  {:else}
    <div class="mappings-table-wrap">
      <table class="mappings-table">
        <thead>
          <tr>
            <th>Placeholder</th>
            <th>Dataset Column</th>
            {#if showPreview}
              <th>Preview Value</th>
            {/if}
            <th class="col-status" aria-label="Status"></th>
          </tr>
        </thead>
        <tbody>
          {#each placeholders as ph (ph)}
            {@const col = mapping[ph] ?? ''}
            {@const preview = col && previewData[col] ? previewData[col] : undefined}
            <tr class="mapping-row" class:unmapped={!col}>
              <td class="col-placeholder">
                <code class="ph-code">{`{{${ph}}}`}</code>
              </td>
              <td class="col-column">
                <Select
                  value={col}
                  options={columnOptions}
                  placeholder="Select column…"
                  aria-label="Map {ph} to column"
                  onchange={(e: Event) => {
                    const t = e.target as HTMLSelectElement;
                    setMapping(ph, t.value);
                  }}
                />
              </td>
              {#if showPreview}
                <td class="col-preview">
                  {#if preview}
                    <span class="preview-val">{preview}</span>
                  {:else if col}
                    <span class="preview-empty">(empty)</span>
                  {:else}
                    <span class="preview-unset">—</span>
                  {/if}
                </td>
              {/if}
              <td class="col-status">
                {#if col}
                  <span class="status-ok material-symbols-outlined" aria-label="Mapped" title="Mapped">check_circle</span>
                {:else}
                  <span class="status-warn material-symbols-outlined" aria-label="Not mapped" title="Not mapped">radio_button_unchecked</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if unmappedCount > 0}
      <p class="unmapped-warn" role="status">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        {unmappedCount} placeholder{unmappedCount !== 1 ? 's are' : ' is'} not yet mapped and will remain unchanged.
      </p>
    {/if}

    <div class="editor-footer">
      <Button
        variant="primary"
        size="md"
        loading={saving}
        onclick={handleSave}
        disabled={saving || columns.length === 0}
      >
        {#snippet icon()}<span class="material-symbols-outlined">save</span>{/snippet}
        {#snippet children()}Save Mappings{/snippet}
      </Button>
    </div>
  {/if}
</div>

<style>
  .docx-editor {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .editor-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-left { display: flex; flex-direction: column; gap: 0.25rem; }

  .editor-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .editor-title .material-symbols-outlined { font-size: 1.25rem; color: var(--color-brand); }

  .editor-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 3rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .empty-icon { font-size: 2.5rem; }

  /* Table */
  .mappings-table-wrap {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow-x: auto;
  }

  .mappings-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .mappings-table th {
    padding: 0.625rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
  }

  .mappings-table td {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .mapping-row:last-child td { border-bottom: none; }

  .mapping-row.unmapped { background: var(--color-warning-light, #fffbeb); }

  /* Placeholder code */
  .ph-code {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    background: var(--color-bg-muted);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
  }

  /* Preview values */
  .preview-val   { color: var(--color-text); font-style: italic; }
  .preview-empty { color: var(--color-text-muted); font-style: italic; }
  .preview-unset { color: var(--color-text-muted); }

  /* Status icon */
  .col-status { width: 2.5rem; text-align: center; }

  .status-ok   { font-size: 1.125rem; color: var(--color-success); }
  .status-warn { font-size: 1.125rem; color: var(--color-text-muted); }

  /* Unmapped warning */
  .unmapped-warn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    color: var(--color-warning);
    padding: 0.625rem 0.875rem;
    background: var(--color-warning-light);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-warning);
    margin: 0;
  }

  .unmapped-warn .material-symbols-outlined { font-size: 1rem; flex-shrink: 0; }

  /* Footer */
  .editor-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
