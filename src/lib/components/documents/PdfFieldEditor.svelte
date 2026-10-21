<script lang="ts">
  import { onMount } from 'svelte';
  import type { PdfFieldDef } from '$lib/server/services/documents/pdfGenerator';
  import Button from '$lib/components/ui/Button.svelte';

  // ── Types ──────────────────────────────────────────────────────────────────

  export interface PdfFieldEditorProps {
    templateId: string;
    /** Available variable names (from dataset columns) */
    variables: string[];
    /** Initial field definitions */
    initialFields?: PdfFieldDef[];
    /** URL to the PDF file to display */
    pdfUrl: string;
    /** Preview endpoint base, e.g. /api/templates/[id]/preview */
    previewUrl?: string;
    onSave?: (fields: PdfFieldDef[]) => void;
    saving?: boolean;
  }

  // ── Props ──────────────────────────────────────────────────────────────────

  let {
    templateId,
    variables = [],
    initialFields = [],
    pdfUrl,
    previewUrl,
    onSave,
    saving = false
  }: PdfFieldEditorProps = $props();

  // ── State ──────────────────────────────────────────────────────────────────

  let canvasEl = $state<HTMLCanvasElement | undefined>(undefined);
  let overlayEl = $state<HTMLDivElement | undefined>(undefined);

  let fields = $state<PdfFieldDef[]>(initialFields.length > 0 ? initialFields : []);
  let selectedFieldId = $state<string | null>(null);
  let currentPage = $state(0);
  let totalPages = $state(1);

  let canvasWidth = $state(0);
  let canvasHeight = $state(0);
  let pageHeightPt = $state(841.89); // A4 default

  let previewLoading = $state(false);
  let previewError = $state<string | null>(null);
  let previewDataUrl = $state<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedField = $derived(
    fields.find((f) => f.id === selectedFieldId) ?? null
  );

  const pageFields = $derived(
    fields.filter((f) => f.pageIndex === currentPage)
  );

  // ── PDF rendering (client-side only) ─────────────────────────────────────

  let pdfDoc: unknown = null;

  async function loadAndRenderPdf() {
    if (!canvasEl) return;
    try {
      // Lazy-import pdfjs-dist (browser-only)
      const pdfjs = await import('pdfjs-dist');
      // Set worker source — use the bundled worker
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;

      const loadingTask = pdfjs.getDocument(pdfUrl);
      pdfDoc = await loadingTask.promise;
      const docAny = pdfDoc as { numPages: number };
      totalPages = docAny.numPages;

      await renderPage(currentPage);
    } catch (err) {
      console.error('[PdfFieldEditor] Failed to load PDF:', err);
    }
  }

  async function renderPage(pageIndex: number) {
    if (!pdfDoc || !canvasEl) return;
    const docAny = pdfDoc as { getPage: (n: number) => Promise<unknown> };
    const page = await docAny.getPage(pageIndex + 1); // pdfjs is 1-indexed
    const pageAny = page as {
      getViewport: (opts: { scale: number }) => { width: number; height: number; scale: number };
      render: (ctx: unknown) => { promise: Promise<void> };
      view: number[];
    };

    const viewport = pageAny.getViewport({ scale: 1.5 });
    canvasWidth = viewport.width;
    canvasHeight = viewport.height;

    // Store the actual page height in points (from view array: [x, y, w, h])
    pageHeightPt = pageAny.view[3] ?? 841.89;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    canvasEl.width = viewport.width;
    canvasEl.height = viewport.height;

    await pageAny.render({ canvasContext: ctx, viewport }).promise;
  }

  onMount(() => {
    loadAndRenderPdf();
  });

  $effect(() => {
    // Re-render when page changes
    if (pdfDoc) {
      renderPage(currentPage);
    }
  });

  // ── Coordinate conversion ─────────────────────────────────────────────────

  function browserToPdf(browserX: number, browserY: number): { x: number; y: number } {
    if (!canvasEl) return { x: 0, y: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const canvasX = (browserX - rect.left) * scaleX;
    const canvasY = (browserY - rect.top) * scaleY;

    // Convert from canvas (72dpi) to PDF points, flipping Y
    const ptPerPx = pageHeightPt / canvasHeight;
    const pdfX = canvasX * ptPerPx;
    const pdfY = pageHeightPt - canvasY * ptPerPx;

    return { x: Math.round(pdfX), y: Math.round(pdfY) };
  }

  // ── Field management ──────────────────────────────────────────────────────

  function generateId(): string {
    return `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addField() {
    const newField: PdfFieldDef = {
      id: generateId(),
      variable: variables[0] ?? '',
      x: 100,
      y: Math.max(50, pageHeightPt - 100),
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      alignment: 'left',
      pageIndex: currentPage
    };
    fields = [...fields, newField];
    selectedFieldId = newField.id;
  }

  function deleteField(id: string) {
    fields = fields.filter((f) => f.id !== id);
    if (selectedFieldId === id) selectedFieldId = null;
  }

  function updateField(id: string, patch: Partial<PdfFieldDef>) {
    fields = fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
  }

  // ── Dragging ──────────────────────────────────────────────────────────────

  let draggingId = $state<string | null>(null);
  let dragOffset = $state({ dx: 0, dy: 0 });

  function onFieldPointerDown(e: PointerEvent, fieldId: string) {
    e.stopPropagation();
    selectedFieldId = fieldId;
    draggingId = fieldId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const field = fields.find((f) => f.id === fieldId);
    if (!field || !canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const scale = canvasWidth / rect.width;
    const ptPerPx = pageHeightPt / canvasHeight;

    // Current canvas pixel positions
    const canvasX = field.x / ptPerPx;
    const canvasY = (pageHeightPt - field.y) / ptPerPx;
    const screenX = canvasX / scale + rect.left;
    const screenY = canvasY / scale + rect.top;

    dragOffset = { dx: e.clientX - screenX, dy: e.clientY - screenY };
  }

  function onOverlayPointerMove(e: PointerEvent) {
    if (!draggingId) return;
    const coords = browserToPdf(e.clientX - dragOffset.dx, e.clientY - dragOffset.dy);
    updateField(draggingId, { x: coords.x, y: coords.y });
  }

  function onOverlayPointerUp() {
    draggingId = null;
  }

  // Compute display position of a field div
  function fieldScreenPos(field: PdfFieldDef): { left: string; top: string } {
    if (!canvasEl || canvasWidth === 0) return { left: '0px', top: '0px' };
    const rect = canvasEl.getBoundingClientRect();
    const ptPerPx = pageHeightPt / canvasHeight;
    const scale = rect.width / canvasWidth;

    const canvasX = field.x / ptPerPx;
    const canvasY = (pageHeightPt - field.y) / ptPerPx;

    return {
      left: `${canvasX * scale}px`,
      top: `${canvasY * scale}px`
    };
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  async function loadPreview() {
    if (!previewUrl) return;
    previewLoading = true;
    previewError = null;
    try {
      const res = await fetch(previewUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: Object.fromEntries(variables.map((v) => [v, `[${v}]`])) })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { base64?: string; mimeType?: string } };
      const base64 = json.data?.base64;
      const mime = json.data?.mimeType ?? 'application/pdf';
      if (base64) previewDataUrl = `data:${mime};base64,${base64}`;
    } catch (err) {
      previewError = err instanceof Error ? err.message : 'Preview failed';
    } finally {
      previewLoading = false;
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    onSave?.(fields);
  }
</script>

<div class="pdf-editor">
  <!-- Toolbar -->
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <Button variant="primary" size="sm" onclick={addField}>
        {#snippet icon()}<span class="material-symbols-outlined">add</span>{/snippet}
        {#snippet children()}Add Field{/snippet}
      </Button>
      {#if totalPages > 1}
        <div class="page-nav" role="group" aria-label="Page navigation">
          <button
            type="button"
            class="page-btn"
            aria-label="Previous page"
            disabled={currentPage === 0}
            onclick={() => { currentPage -= 1; }}
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="page-label">Page {currentPage + 1} / {totalPages}</span>
          <button
            type="button"
            class="page-btn"
            aria-label="Next page"
            disabled={currentPage >= totalPages - 1}
            onclick={() => { currentPage += 1; }}
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      {/if}
    </div>
    <div class="toolbar-right">
      {#if previewUrl}
        <Button
          variant="ghost"
          size="sm"
          loading={previewLoading}
          onclick={loadPreview}
        >
          {#snippet icon()}<span class="material-symbols-outlined">preview</span>{/snippet}
          {#snippet children()}Preview{/snippet}
        </Button>
      {/if}
      <Button
        variant="primary"
        size="sm"
        loading={saving}
        onclick={handleSave}
        disabled={saving}
      >
        {#snippet icon()}<span class="material-symbols-outlined">save</span>{/snippet}
        {#snippet children()}Save Fields{/snippet}
      </Button>
    </div>
  </div>

  <div class="editor-body">
    <!-- Canvas + overlay -->
    <div class="canvas-area">
      <div
        class="canvas-wrap"
        role="application"
        aria-label="PDF page with draggable fields"
        style:width="{canvasWidth}px"
        style:height="{canvasHeight}px"
      >
        <canvas bind:this={canvasEl} class="pdf-canvas"></canvas>

        <!-- Overlay for field placement -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="field-overlay"
          bind:this={overlayEl}
          style:width="{canvasWidth}px"
          style:height="{canvasHeight}px"
          onpointermove={onOverlayPointerMove}
          onpointerup={onOverlayPointerUp}
        >
          {#each pageFields as field (field.id)}
            {@const pos = fieldScreenPos(field)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="field-chip"
              class:selected={selectedFieldId === field.id}
              style:left={pos.left}
              style:top={pos.top}
              onpointerdown={(e) => onFieldPointerDown(e, field.id)}
              role="button"
              tabindex="0"
              aria-label="Field: {field.variable}"
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedFieldId = field.id; }}
            >
              <span class="material-symbols-outlined chip-grip" aria-hidden="true">drag_indicator</span>
              <span class="chip-label">{field.variable || '(no variable)'}</span>
              <button
                type="button"
                class="chip-delete"
                aria-label="Delete field {field.variable}"
                onclick={(e) => { e.stopPropagation(); deleteField(field.id); }}
              >
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Properties panel -->
    <aside class="properties-panel">
      <h3 class="panel-title">
        <span class="material-symbols-outlined" aria-hidden="true">tune</span>
        Field Properties
      </h3>

      {#if selectedField}
        <div class="prop-group">
          <label class="prop-label" for="prop-variable">Variable</label>
          <select
            id="prop-variable"
            class="prop-select"
            value={selectedField.variable}
            onchange={(e) => updateField(selectedField.id, { variable: (e.target as HTMLSelectElement).value })}
          >
            {#each variables as v (v)}
              <option value={v}>{v}</option>
            {/each}
            {#if variables.length === 0}
              <option value="">No variables available</option>
            {/if}
          </select>
        </div>

        <div class="prop-row">
          <div class="prop-group">
            <label class="prop-label" for="prop-x">X (pt)</label>
            <input
              id="prop-x"
              type="number"
              class="prop-input"
              value={selectedField.x}
              min="0"
              oninput={(e) => updateField(selectedField.id, { x: Number((e.target as HTMLInputElement).value) })}
            />
          </div>
          <div class="prop-group">
            <label class="prop-label" for="prop-y">Y (pt)</label>
            <input
              id="prop-y"
              type="number"
              class="prop-input"
              value={selectedField.y}
              min="0"
              oninput={(e) => updateField(selectedField.id, { y: Number((e.target as HTMLInputElement).value) })}
            />
          </div>
        </div>

        <div class="prop-row">
          <div class="prop-group">
            <label class="prop-label" for="prop-size">Font Size</label>
            <input
              id="prop-size"
              type="number"
              class="prop-input"
              value={selectedField.fontSize}
              min="6"
              max="144"
              oninput={(e) => updateField(selectedField.id, { fontSize: Number((e.target as HTMLInputElement).value) })}
            />
          </div>
          <div class="prop-group">
            <label class="prop-label" for="prop-color">Color</label>
            <input
              id="prop-color"
              type="color"
              class="prop-color"
              value={selectedField.color}
              oninput={(e) => updateField(selectedField.id, { color: (e.target as HTMLInputElement).value })}
            />
          </div>
        </div>

        <div class="prop-group">
          <label class="prop-label" id="alignment-label">Alignment</label>
          <div class="alignment-btns" role="group" aria-labelledby="alignment-label">
            {#each ['left', 'center', 'right'] as align (align)}
              <button
                type="button"
                class="align-btn"
                class:active={selectedField.alignment === align}
                aria-pressed={selectedField.alignment === align}
                aria-label="Align {align}"
                onclick={() => updateField(selectedField.id, { alignment: align as PdfFieldDef['alignment'] })}
              >
                <span class="material-symbols-outlined" aria-hidden="true">format_align_{align}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="prop-group">
          <label class="prop-label" for="prop-page">Page</label>
          <input
            id="prop-page"
            type="number"
            class="prop-input"
            value={selectedField.pageIndex}
            min="0"
            max={totalPages - 1}
            oninput={(e) => updateField(selectedField.id, { pageIndex: Number((e.target as HTMLInputElement).value) })}
          />
        </div>

        <button
          type="button"
          class="delete-field-btn"
          onclick={() => deleteField(selectedField.id)}
        >
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          Delete field
        </button>
      {:else}
        <div class="no-selection">
          <span class="material-symbols-outlined no-sel-icon" aria-hidden="true">touch_app</span>
          <p>Click a field on the canvas to edit its properties, or add a new field above.</p>
        </div>
      {/if}

      <!-- Field list -->
      {#if fields.length > 0}
        <div class="field-list-section">
          <h4 class="field-list-title">All Fields ({fields.length})</h4>
          <ul class="field-list" role="list">
            {#each fields as f (f.id)}
              <li>
                <button
                  type="button"
                  class="field-list-item"
                  class:active={selectedFieldId === f.id}
                  onclick={() => {
                    selectedFieldId = f.id;
                    currentPage = f.pageIndex;
                  }}
                >
                  <span class="material-symbols-outlined fli-icon" aria-hidden="true">text_fields</span>
                  <span class="fli-variable">{f.variable || '(empty)'}</span>
                  <span class="fli-page">p.{f.pageIndex + 1}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </aside>
  </div>

  <!-- Preview panel -->
  {#if previewDataUrl || previewError}
    <div class="preview-panel">
      <h3 class="preview-title">
        <span class="material-symbols-outlined" aria-hidden="true">preview</span>
        Preview
        <button
          type="button"
          class="preview-close"
          aria-label="Close preview"
          onclick={() => { previewDataUrl = null; previewError = null; }}
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </h3>
      {#if previewError}
        <p class="preview-error">
          <span class="material-symbols-outlined" aria-hidden="true">error</span>
          {previewError}
        </p>
      {:else if previewDataUrl}
        <iframe
          title="Document preview"
          src={previewDataUrl}
          class="preview-frame"
          aria-label="Generated document preview"
        ></iframe>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pdf-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  /* Toolbar */
  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Page navigation */
  .page-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--color-text-muted);
    transition: background var(--transition-fast);
  }

  .page-btn:hover:not(:disabled) { background: var(--color-bg-muted); }
  .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .page-btn .material-symbols-outlined { font-size: 1.25rem; }

  .page-label { font-size: var(--font-size-sm); color: var(--color-text-muted); white-space: nowrap; }

  /* Editor body */
  .editor-body {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    min-height: 0;
    flex: 1;
  }

  /* Canvas area */
  .canvas-area {
    flex: 1;
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: #f0f0f0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
  }

  .canvas-wrap {
    position: relative;
    display: inline-block;
    box-shadow: var(--shadow-md);
  }

  .pdf-canvas {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .field-overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: all;
    overflow: hidden;
  }

  /* Field chip on canvas */
  .field-chip {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.375rem 0.125rem 0.25rem;
    background: rgba(99, 102, 241, 0.12);
    border: 1.5px solid var(--color-brand, #6366f1);
    border-radius: var(--radius-sm);
    cursor: grab;
    user-select: none;
    touch-action: none;
    white-space: nowrap;
    font-size: 0.6875rem;
    color: var(--color-brand, #6366f1);
    transition: background var(--transition-fast);
    transform: translateY(-50%);
  }

  .field-chip.selected {
    background: rgba(99, 102, 241, 0.22);
    box-shadow: 0 0 0 2px var(--color-brand, #6366f1);
  }

  .field-chip:active { cursor: grabbing; }

  .chip-grip { font-size: 0.875rem; color: var(--color-brand, #6366f1); }
  .chip-label { font-weight: 500; }

  .chip-delete {
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-brand, #6366f1);
    padding: 0;
    line-height: 1;
  }

  .chip-delete .material-symbols-outlined { font-size: 0.875rem; }
  .chip-delete:hover { color: var(--color-error); }

  /* Properties panel */
  .properties-panel {
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    overflow-y: auto;
    max-height: 70vh;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .panel-title .material-symbols-outlined { font-size: 1rem; color: var(--color-brand); }

  .prop-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .prop-label {
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .prop-select,
  .prop-input {
    padding: 0.375rem 0.625rem;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    width: 100%;
    font-family: inherit;
    transition: border-color var(--transition-fast);
  }

  .prop-select:focus,
  .prop-input:focus { border-color: var(--color-brand); }

  .prop-color {
    width: 2.5rem;
    height: 2rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 2px;
    cursor: pointer;
    background: transparent;
  }

  .prop-row {
    display: flex;
    gap: 0.5rem;
  }

  .prop-row .prop-group { flex: 1; }

  /* Alignment buttons */
  .alignment-btns {
    display: flex;
    gap: 0.25rem;
  }

  .align-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  }

  .align-btn:hover { background: var(--color-bg-muted); color: var(--color-text); }
  .align-btn.active {
    background: var(--color-brand-light);
    color: var(--color-brand);
    border-color: var(--color-brand);
  }

  .align-btn .material-symbols-outlined { font-size: 1.125rem; }

  /* Delete button */
  .delete-field-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--color-error-light);
    color: var(--color-error);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition-fast);
    font-family: inherit;
  }

  .delete-field-btn:hover { background: var(--color-error); color: #fff; }
  .delete-field-btn .material-symbols-outlined { font-size: 1rem; }

  /* No selection placeholder */
  .no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 0;
    text-align: center;
    color: var(--color-text-muted);
  }

  .no-sel-icon { font-size: 2rem; }
  .no-selection p { font-size: var(--font-size-sm); margin: 0; }

  /* Field list */
  .field-list-section {
    border-top: 1px solid var(--color-border);
    padding-top: 0.75rem;
  }

  .field-list-title {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.5rem;
  }

  .field-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .field-list-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    padding: 0.375rem 0.5rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    font-family: inherit;
  }

  .field-list-item:hover { background: var(--color-bg-muted); }
  .field-list-item.active { background: var(--color-brand-light); border-color: var(--color-brand); color: var(--color-brand); }

  .fli-icon { font-size: 0.875rem; flex-shrink: 0; }
  .fli-variable { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fli-page { color: var(--color-text-muted); flex-shrink: 0; }

  /* Preview panel */
  .preview-panel {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .preview-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
    margin: 0;
  }

  .preview-title .material-symbols-outlined { font-size: 1rem; color: var(--color-brand); }

  .preview-close {
    margin-left: auto;
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0;
  }

  .preview-close:hover { color: var(--color-text); }

  .preview-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .preview-frame {
    width: 100%;
    height: 600px;
    border: none;
    display: block;
  }
</style>
