<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import PdfFieldEditor from '$lib/components/documents/PdfFieldEditor.svelte';
  import DocxTemplateEditor from '$lib/components/documents/DocxTemplateEditor.svelte';
  import type { PdfFieldDef } from '$lib/server/services/documents/pdfGenerator';
  import type { PlaceholderMapping } from '$lib/components/documents/DocxTemplateEditor.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const templateId = $derived($page.params.id);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isDocx = $derived(data.template.format === 'docx');
  const isPdf  = $derived(data.template.format === 'pdf');
  const isImage = $derived(['png', 'jpg', 'jpeg'].includes(data.template.format ?? ''));

  const showPdfEditor  = $derived(isPdf || isImage);
  const showDocxEditor = $derived(isDocx);

  // Build column list from the first dataset (or empty)
  const columns = $derived<string[]>(
    data.datasets[0]?.columns?.map((c: { name: string }) => c.name) ?? []
  );

  // Convert DB fields to PdfFieldDef
  const initialPdfFields = $derived<PdfFieldDef[]>(
    data.mappings.map((m: {
      id: string;
      variable: string;
      x: number;
      y: number;
      font_size: number;
      font_family: string;
      color: string;
      alignment: string;
      page_index: number;
    }) => ({
      id: m.id,
      variable: m.variable,
      x: m.x,
      y: m.y,
      fontSize: m.font_size,
      fontFamily: m.font_family,
      color: m.color,
      alignment: m.alignment as PdfFieldDef['alignment'],
      pageIndex: m.page_index
    }))
  );

  // Convert DB mappings to PlaceholderMapping[]
  const initialDocxMappings = $derived<PlaceholderMapping[]>(
    data.mappings.map((m: { variable: string; font_family: string }) => ({
      placeholder: m.variable,
      column: m.font_family // reusing font_family column to store the dataset column name
    }))
  );

  // ── State ──────────────────────────────────────────────────────────────────

  let saving = $state(false);
  let saveError = $state<string | null>(null);
  let saveSuccess = $state(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function fmtSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  const formatLabel: Record<string, string> = {
    docx: 'Word (.docx)', pdf: 'PDF',
    png: 'PNG Image', jpg: 'JPEG Image', jpeg: 'JPEG Image',
    webp: 'WebP Image', gif: 'GIF Image', tiff: 'TIFF Image', tif: 'TIFF Image', bmp: 'BMP Image'
  };

  // ── Save PDF fields ────────────────────────────────────────────────────────

  async function savePdfFields(fields: PdfFieldDef[]) {
    saving = true;
    saveError = null;
    saveSuccess = false;
    try {
      const res = await fetch(`/api/templates/${templateId}/mappings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? `Save failed (${res.status})`);
      }
      saveSuccess = true;
      setTimeout(() => { saveSuccess = false; }, 3000);
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Save failed.';
    } finally {
      saving = false;
    }
  }

  // ── Save DOCX mappings ─────────────────────────────────────────────────────

  async function saveDocxMappings(mappings: PlaceholderMapping[]) {
    saving = true;
    saveError = null;
    saveSuccess = false;
    try {
      const res = await fetch(`/api/templates/${templateId}/mappings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? `Save failed (${res.status})`);
      }
      saveSuccess = true;
      setTimeout(() => { saveSuccess = false; }, 3000);
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Save failed.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{data.template.name} — MergeMail</title>
</svelte:head>

<div class="template-detail-page">
  <!-- Header -->
  <div class="page-header">
    <a href="/dashboard/templates" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Templates
    </a>
    <div class="header-content">
      <div class="header-left">
        <div class="template-icon-wrap">
          <span class="material-symbols-outlined template-icon" aria-hidden="true">
            {isPdf || isImage ? 'picture_as_pdf' : 'article'}
          </span>
        </div>
        <div>
          <h1 class="page-title">{data.template.name}</h1>
          {#if data.template.description}
            <p class="page-subtitle">{data.template.description}</p>
          {/if}
          <div class="template-meta">
            <Badge variant="neutral">{formatLabel[data.template.format] ?? data.template.format}</Badge>
            <span class="meta-item">
              <span class="material-symbols-outlined" aria-hidden="true">straighten</span>
              {fmtSize(data.template.file_size)}
            </span>
            <span class="meta-item">
              <span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>
              {fmtDate(data.template.created_at)}
            </span>
            {#if data.template.placeholders?.length}
              <span class="meta-item">
                <span class="material-symbols-outlined" aria-hidden="true">data_object</span>
                {data.template.placeholders.length} placeholders
              </span>
            {/if}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <Button variant="ghost" size="sm">
          {#snippet icon()}<span class="material-symbols-outlined">download</span>{/snippet}
          {#snippet children()}Download{/snippet}
        </Button>
        <Button variant="danger" size="sm">
          {#snippet icon()}<span class="material-symbols-outlined">delete</span>{/snippet}
          {#snippet children()}Delete{/snippet}
        </Button>
      </div>
    </div>
  </div>

  <!-- Save status -->
  {#if saveError}
    <div class="save-banner save-error" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      {saveError}
    </div>
  {/if}
  {#if saveSuccess}
    <div class="save-banner save-success" role="status">
      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
      Saved successfully.
    </div>
  {/if}

  <!-- Editor area -->
  <Card>
    {#if showPdfEditor}
      <PdfFieldEditor
        {templateId}
        variables={columns}
        initialFields={initialPdfFields}
        pdfUrl="/api/templates/{templateId}/file"
        previewUrl="/api/templates/{templateId}/preview"
        onSave={savePdfFields}
        {saving}
      />
    {:else if showDocxEditor}
      <DocxTemplateEditor
        placeholders={data.template.placeholders ?? []}
        {columns}
        mappings={initialDocxMappings}
        onSave={saveDocxMappings}
        {saving}
      />
    {:else}
      <div class="unsupported">
        <span class="material-symbols-outlined unsupported-icon" aria-hidden="true">help</span>
        <p>No editor available for format: <strong>{data.template.format}</strong>.</p>
      </div>
    {/if}
  </Card>
</div>

<style>
  .template-detail-page {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header { display: flex; flex-direction: column; gap: 0.75rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    width: fit-content;
    transition: color var(--transition-fast);
  }

  .back-link:hover { color: var(--color-brand); }
  .back-link .material-symbols-outlined { font-size: 1rem; }

  .header-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .template-icon-wrap {
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-md);
    background: var(--color-brand-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .template-icon { font-size: 1.75rem; color: var(--color-brand); }

  .page-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0 0 0.5rem;
  }

  .template-meta {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .meta-item .material-symbols-outlined { font-size: 0.875rem; }

  .header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

  /* Save banners */
  .save-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .save-banner .material-symbols-outlined { font-size: 1rem; flex-shrink: 0; }

  .save-error {
    background: var(--color-error-light);
    border: 1px solid var(--color-error);
    color: var(--color-error);
  }

  .save-success {
    background: var(--color-success-light);
    border: 1px solid var(--color-success);
    color: var(--color-success);
  }

  /* Unsupported */
  .unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 3rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .unsupported-icon { font-size: 2.5rem; }
  .unsupported p { font-size: var(--font-size-sm); margin: 0; }
</style>
