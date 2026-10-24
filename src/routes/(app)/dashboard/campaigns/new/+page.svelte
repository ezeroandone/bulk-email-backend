<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Card, Button, VariablePicker } from '$lib/components/ui';
  import type { PageProps } from './$types';

  // ── Props ──────────────────────────────────────────────────────────────────

  let { data }: PageProps = $props();

  // ── Types ──────────────────────────────────────────────────────────────────

  type WizardMode = 'A' | 'B' | 'C' | null;

  interface DraftState {
    step: number;
    mode: WizardMode;
    datasetId: string;
    excludedRows: number[];
    templateId: string;
    smtpId: string;
    subject: string;
    body: string;
    recipientEmailCol: string;
    recipientNameCol: string;
    campaignName: string;
    consentChecked: boolean;
  }

  const DRAFT_KEY = 'mergemail_campaign_draft';

  // ── State ──────────────────────────────────────────────────────────────────

  let step = $state(1);
  let mode = $state<WizardMode>(null);
  let datasetId = $state('');
  let excludedRows = $state<number[]>([]);
  let templateId = $state('');
  let smtpId = $state('');
  let subject = $state('');
  let body = $state('');
  let recipientEmailCol = $state('');
  let recipientNameCol = $state('');
  let campaignName = $state('');
  let consentChecked = $state(false);
  let launching = $state(false);
  let launchError = $state<string | null>(null);
  let showDraftBanner = $state(false);
  let previewRecipientIndex = $state(0);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedDataset = $derived(data.datasets.find((d) => d.id === datasetId) ?? null);
  const datasetColumns = $derived<string[]>(
    ((selectedDataset as {dataset_columns?: {name: string}[]} | null)?.dataset_columns ?? []).map(c => c.name)
  );
  const eligibleCount = $derived(
    selectedDataset
      ? Math.max(0, (selectedDataset.row_count as number) - excludedRows.length)
      : 0
  );
  const creditsRequired = $derived(eligibleCount);
  const selectedSmtp = $derived(data.smtpConfigs.find((s) => s.id === smtpId) ?? null);
  const selectedTemplate = $derived(data.templates.find((t) => t.id === templateId) ?? null);

  const canNext = $derived(() => {
    switch (step) {
      case 1: return mode !== null;
      case 2: return datasetId !== '';
      case 3: return recipientEmailCol !== '' && eligibleCount > 0;
      case 4: return mode === 'C' || templateId !== '';
      case 5: return true; // matching/mapping can be skipped
      case 6: return subject.trim() !== '' && body.trim() !== '';
      case 7: return smtpId !== '';
      case 8: return true; // preview
      case 9: return consentChecked && campaignName.trim() !== '';
      default: return true;
    }
  });

  // Auto-advance mode C steps
  const effectiveSteps = $derived(() => {
    // For mode C, steps 4 (documents) and 5 (matching) are skipped
    return mode === 'C' ? [1,2,3,6,7,8,9,10] : [1,2,3,4,5,6,7,8,9,10];
  });

  // ── Draft persistence ──────────────────────────────────────────────────────

  function saveDraft() {
    const draft: DraftState = {
      step, mode, datasetId, excludedRows, templateId, smtpId,
      subject, body, recipientEmailCol, recipientNameCol, campaignName, consentChecked
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw) as DraftState;
      step = d.step ?? 1;
      mode = d.mode ?? null;
      datasetId = d.datasetId ?? '';
      excludedRows = d.excludedRows ?? [];
      templateId = d.templateId ?? '';
      smtpId = d.smtpId ?? '';
      subject = d.subject ?? '';
      body = d.body ?? '';
      recipientEmailCol = d.recipientEmailCol ?? '';
      recipientNameCol = d.recipientNameCol ?? '';
      campaignName = d.campaignName ?? '';
      consentChecked = false; // always reset consent
      return true;
    } catch {
      return false;
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function next() {
    if (!canNext()) return;
    saveDraft();
    if (mode === 'C' && step === 3) {
      step = 6;
    } else if (mode === 'C' && step === 4) {
      step = 6;
    } else {
      step = Math.min(10, step + 1);
    }
  }

  function back() {
    saveDraft();
    if (mode === 'C' && step === 6) {
      step = 3;
    } else {
      step = Math.max(1, step - 1);
    }
  }

  function insertVariable(varStr: string) {
    body = body + varStr;
  }

  function insertSubjectVariable(varStr: string) {
    subject = subject + varStr;
  }

  // ── Launch ─────────────────────────────────────────────────────────────────

  async function launch() {
    if (!consentChecked || !campaignName.trim()) return;
    launchError = null;
    launching = true;
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          mode,
          dataset_id: datasetId,
          smtp_config_id: smtpId,
          subject_template: subject.trim(),
          body_html: body.trim(),
          recipient_email_column: recipientEmailCol,
          recipient_name_column: recipientNameCol || undefined,
          template_id: templateId || undefined,
          excluded_row_indices: excludedRows
        })
      });
      const json = await res.json() as { success: boolean; error?: string; data?: { campaign_id?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Failed (${res.status})`);
      }
      clearDraft();
      const id = json.data?.campaign_id;
      goto(id ? `/dashboard/campaigns/${id}` : '/dashboard/campaigns');
    } catch (err) {
      launchError = err instanceof Error ? err.message : 'Failed to launch campaign.';
      launching = false;
    }
  }

  // ── Mount ──────────────────────────────────────────────────────────────────

  onMount(() => {
    const hasDraft = loadDraft();
    if (hasDraft && step > 1) {
      showDraftBanner = true;
    }
  });

  // ── Preview helpers ────────────────────────────────────────────────────────

  function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  const previewRecipients = $derived(
    selectedDataset
      ? ((selectedDataset as unknown as { preview_rows?: Record<string, string>[] }).preview_rows ?? [])
      : []
  );

  const previewVars = $derived(previewRecipients[previewRecipientIndex] ?? {});
  const previewSubject = $derived(interpolate(subject, previewVars as Record<string, string>));
  const previewBody = $derived(interpolate(body, previewVars as Record<string, string>));
  const previewEmail = $derived((previewVars as Record<string, string>)[recipientEmailCol] ?? '(unknown)');
</script>

<svelte:head>
  <title>New Campaign — MergeMail</title>
</svelte:head>

<div class="wizard-page">
  <!-- Draft resume banner -->
  {#if showDraftBanner}
    <div class="draft-banner" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">restore</span>
      <span>You have an unsaved draft. Resumed from step {step}.</span>
      <button type="button" class="draft-dismiss" onclick={() => { showDraftBanner = false; clearDraft(); step = 1; mode = null; }}>
        Start over
      </button>
      <button type="button" class="draft-close" onclick={() => { showDraftBanner = false; }} aria-label="Dismiss banner">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  {/if}

  <!-- Page header -->
  <div class="page-header">
    <a href="/dashboard/campaigns" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Campaigns
    </a>
    <h1 class="page-title">New Campaign</h1>
  </div>

  <!-- Step indicator -->
  <div class="step-indicator" aria-label="Wizard progress">
    {#each Array.from({ length: 10 }, (_, i) => i + 1) as s}
      <div
        class="step-dot"
        class:active={s === step}
        class:done={s < step}
        aria-current={s === step ? 'step' : undefined}
      >
        {#if s < step}
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
        {:else}
          {s}
        {/if}
      </div>
      {#if s < 10}
        <div class="step-line" class:done={s < step}></div>
      {/if}
    {/each}
  </div>

  <!-- ── STEP 1: Choose mode ───────────────────────────────────────────────── -->
  {#if step === 1}
    <div class="step-content">
      <h2 class="step-title">What would you like to send?</h2>
      <div class="mode-grid">
        <button
          type="button"
          class="mode-card"
          class:selected={mode === 'A'}
          onclick={() => { mode = 'A'; }}
        >
          <span class="mode-icon material-symbols-outlined" aria-hidden="true">attach_file</span>
          <span class="mode-label">Send Existing Documents</span>
          <span class="mode-desc">Attach pre-made PDFs or a ZIP of documents matched to each recipient.</span>
          {#if mode === 'A'}
            <span class="mode-check material-symbols-outlined" aria-hidden="true">check_circle</span>
          {/if}
        </button>

        <button
          type="button"
          class="mode-card"
          class:selected={mode === 'B'}
          onclick={() => { mode = 'B'; }}
        >
          <span class="mode-icon material-symbols-outlined" aria-hidden="true">description</span>
          <span class="mode-label">Generate from Template</span>
          <span class="mode-desc">Use a DOCX or PDF template to generate personalised documents for each recipient.</span>
          {#if mode === 'B'}
            <span class="mode-check material-symbols-outlined" aria-hidden="true">check_circle</span>
          {/if}
        </button>

        <button
          type="button"
          class="mode-card"
          class:selected={mode === 'C'}
          onclick={() => { mode = 'C'; }}
        >
          <span class="mode-icon material-symbols-outlined" aria-hidden="true">mail</span>
          <span class="mode-label">Email Only</span>
          <span class="mode-desc">Send a personalised email without any attachments.</span>
          {#if mode === 'C'}
            <span class="mode-check material-symbols-outlined" aria-hidden="true">check_circle</span>
          {/if}
        </button>
      </div>
    </div>

  <!-- ── STEP 2: Select dataset ────────────────────────────────────────────── -->
  {:else if step === 2}
    <div class="step-content">
      <h2 class="step-title">Select a dataset</h2>
      <p class="step-desc">Choose the spreadsheet that contains your recipients.</p>

      <Card>
        <div class="form-section">
          <div class="field-group">
            <label class="field-label" for="ds-select">Dataset</label>
            {#if data.datasets.length === 0}
              <p class="empty-hint">
                No datasets yet. <a href="/dashboard/datasets/new">Upload a spreadsheet</a> first.
              </p>
            {:else}
              <select id="ds-select" class="field-select" bind:value={datasetId}>
                <option value="">Select a dataset…</option>
                {#each data.datasets as ds (ds.id)}
                  <option value={ds.id}>{ds.name} ({ds.row_count} rows)</option>
                {/each}
              </select>
            {/if}
          </div>

          {#if selectedDataset}
            <div class="column-preview">
              <p class="column-preview-label">Columns in this dataset:</p>
              <div class="column-tags">
                {#each datasetColumns as col}
                  <span class="column-tag">{col}</span>
                {/each}
              </div>
              <p class="row-count-note">
                <span class="material-symbols-outlined" aria-hidden="true">people</span>
                {selectedDataset.row_count} rows
              </p>
            </div>
          {/if}

          <div class="upload-link-row">
            <a href="/dashboard/datasets/new" class="upload-link">
              <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
              Upload new spreadsheet
            </a>
          </div>
        </div>
      </Card>
    </div>

  <!-- ── STEP 3: Recipients ────────────────────────────────────────────────── -->
  {:else if step === 3}
    <div class="step-content">
      <h2 class="step-title">Configure recipients</h2>
      <p class="step-desc">Map columns and optionally exclude rows.</p>

      <Card>
        <div class="form-section">
          <div class="field-row">
            <div class="field-group flex-1">
              <label class="field-label" for="email-col">Email column <span class="required">*</span></label>
              <select id="email-col" class="field-select" bind:value={recipientEmailCol}>
                <option value="">Select email column…</option>
                {#each datasetColumns as col}
                  <option value={col}>{col}</option>
                {/each}
              </select>
            </div>
            <div class="field-group flex-1">
              <label class="field-label" for="name-col">Name column (optional)</label>
              <select id="name-col" class="field-select" bind:value={recipientNameCol}>
                <option value="">None</option>
                {#each datasetColumns as col}
                  <option value={col}>{col}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="eligibility-badge" class:zero={eligibleCount === 0}>
            <span class="material-symbols-outlined" aria-hidden="true">
              {eligibleCount > 0 ? 'check_circle' : 'warning'}
            </span>
            <span>
              {eligibleCount} eligible recipient{eligibleCount === 1 ? '' : 's'}
              {excludedRows.length > 0 ? `(${excludedRows.length} excluded)` : ''}
            </span>
          </div>
        </div>
      </Card>
    </div>

  <!-- ── STEP 4: Documents ─────────────────────────────────────────────────── -->
  {:else if step === 4}
    <div class="step-content">
      <h2 class="step-title">
        {mode === 'A' ? 'Upload documents' : 'Select template'}
      </h2>

      <Card>
        <div class="form-section">
          {#if mode === 'A'}
            <p class="step-desc">Upload PDFs, images (PNG, JPEG, WebP, GIF, TIFF), or a ZIP file containing per-recipient documents.</p>
            <div class="upload-note">
              <span class="material-symbols-outlined" aria-hidden="true">info</span>
              <span>Supported formats: PDF, PNG, JPEG, WebP, GIF, TIFF, and ZIP archives containing any of the above. Files will be matched to recipients using the matching rules you configure in the next step.</span>
            </div>
          {:else}
            <p class="step-desc">Choose a DOCX, PDF, or image template to generate personalised documents.</p>
            {#if data.templates.length === 0}
              <p class="empty-hint">
                No templates yet. <a href="/dashboard/templates/new">Upload a template</a> first.
              </p>
            {:else}
              <div class="field-group">
                <label class="field-label" for="template-select">Template</label>
                <select id="template-select" class="field-select" bind:value={templateId}>
                  <option value="">Select a template…</option>
                  {#each data.templates as t (t.id)}
                    <option value={t.id}>{t.name} ({t.type})</option>
                  {/each}
                </select>
              </div>
            {/if}
            <div class="upload-link-row">
              <a href="/dashboard/templates/new" class="upload-link">
                <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
                Upload new template
              </a>
            </div>
          {/if}
        </div>
      </Card>
    </div>

  <!-- ── STEP 5: Matching / Mapping ────────────────────────────────────────── -->
  {:else if step === 5}
    <div class="step-content">
      <h2 class="step-title">
        {mode === 'A' ? 'Document matching' : 'Field mapping'}
      </h2>

      <Card>
        <div class="form-section">
          {#if mode === 'A'}
            <div class="matching-note">
              <span class="material-symbols-outlined" aria-hidden="true">auto_match</span>
              <div>
                <p class="matching-note-title">Automatic matching</p>
                <p class="matching-note-desc">
                  Documents will be matched to recipients using the filename vs the recipient's email or name.
                  You can configure precise rules on the template detail page.
                </p>
              </div>
            </div>
            {#if selectedTemplate}
              <p class="template-hint">
                Template: <strong>{selectedTemplate.name}</strong>
              </p>
            {/if}
          {:else if mode === 'B'}
            <p class="step-desc">
              Variable mappings are configured on the template page.
              {#if selectedTemplate}
                <a href="/dashboard/templates/{templateId}" target="_blank" rel="noopener">
                  Edit template mappings
                  <span class="material-symbols-outlined" aria-hidden="true" style="font-size:0.875rem;vertical-align:middle">open_in_new</span>
                </a>
              {/if}
            </p>
          {/if}
        </div>
      </Card>
    </div>

  <!-- ── STEP 6: Email ─────────────────────────────────────────────────────── -->
  {:else if step === 6}
    <div class="step-content">
      <h2 class="step-title">Compose email</h2>
      <p class="step-desc">Write the subject and body. Use <code>{'{{column}}'}</code> placeholders for personalisation.</p>

      <Card>
        <div class="form-section">
          <div class="field-group">
            <label class="field-label" for="subject">Subject <span class="required">*</span></label>
            <div class="input-with-picker">
              <input
                id="subject"
                type="text"
                class="field-input"
                placeholder={'e.g. Your certificate, {{first_name}}'}
                bind:value={subject}
              />
              <VariablePicker columns={datasetColumns} onSelect={insertSubjectVariable} />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="body">Body (HTML) <span class="required">*</span></label>
            <div class="body-toolbar">
              <VariablePicker columns={datasetColumns} onSelect={insertVariable} />
            </div>
            <textarea
              id="body"
              class="field-textarea body-editor"
              rows="12"
              placeholder={'<p>Dear {{first_name}},</p><p>Please find your document attached.</p>'}
              bind:value={body}
            ></textarea>
          </div>
        </div>
      </Card>
    </div>

  <!-- ── STEP 7: SMTP ──────────────────────────────────────────────────────── -->
  {:else if step === 7}
    <div class="step-content">
      <h2 class="step-title">Choose SMTP configuration</h2>
      <p class="step-desc">Select the sending account for this campaign.</p>

      <Card>
        <div class="form-section">
          {#if data.smtpConfigs.length === 0}
            <p class="empty-hint">
              No SMTP configurations. <a href="/dashboard/settings/smtp">Add one</a> first.
            </p>
          {:else}
            <div class="field-group">
              <label class="field-label" for="smtp-select">SMTP configuration <span class="required">*</span></label>
              <select id="smtp-select" class="field-select" bind:value={smtpId}>
                <option value="">Select…</option>
                {#each data.smtpConfigs as s (s.id)}
                  <option value={s.id}>{s.name} &lt;{s.from_email}&gt;{s.is_default ? ' (default)' : ''}</option>
                {/each}
              </select>
            </div>
          {/if}
          <div class="upload-link-row">
            <a href="/dashboard/settings/smtp" class="upload-link">
              <span class="material-symbols-outlined" aria-hidden="true">add</span>
              Add SMTP configuration
            </a>
          </div>
        </div>
      </Card>
    </div>

  <!-- ── STEP 8: Preview ───────────────────────────────────────────────────── -->
  {:else if step === 8}
    <div class="step-content">
      <h2 class="step-title">Preview</h2>
      <p class="step-desc">See how the email will look for a specific recipient.</p>

      <Card>
        <div class="form-section">
          {#if previewRecipients.length > 0}
            <div class="field-group">
              <label class="field-label" for="preview-recipient">Preview as recipient</label>
              <select id="preview-recipient" class="field-select" bind:value={previewRecipientIndex}>
                {#each previewRecipients as r, i}
                  <option value={i}>Row {i + 1}: {(r as Record<string, string>)[recipientEmailCol] ?? `(row ${i + 1})`}</option>
                {/each}
              </select>
            </div>

            <div class="preview-block">
              <div class="preview-row">
                <span class="preview-label">To:</span>
                <span class="preview-val">{previewEmail}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">Subject:</span>
                <span class="preview-val">{previewSubject}</span>
              </div>
              <div class="preview-separator"></div>
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <div class="preview-body">{@html previewBody}</div>
            </div>
          {:else}
            <p class="empty-hint">No preview rows available for this dataset.</p>
            <div class="preview-block">
              <div class="preview-row">
                <span class="preview-label">Subject:</span>
                <span class="preview-val">{subject}</span>
              </div>
              <div class="preview-separator"></div>
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <div class="preview-body">{@html body}</div>
            </div>
          {/if}
        </div>
      </Card>
    </div>

  <!-- ── STEP 9: Review ────────────────────────────────────────────────────── -->
  {:else if step === 9}
    <div class="step-content">
      <h2 class="step-title">Review &amp; confirm</h2>

      <Card>
        <div class="form-section">
          <div class="field-group">
            <label class="field-label" for="campaign-name">Campaign name <span class="required">*</span></label>
            <input
              id="campaign-name"
              type="text"
              class="field-input"
              placeholder="e.g. Q3 Certificate Send"
              bind:value={campaignName}
            />
          </div>

          <div class="review-table">
            <div class="review-row">
              <span class="review-key">Mode</span>
              <span class="review-val">
                {mode === 'A' ? 'Send Existing Documents' : mode === 'B' ? 'Generate from Template' : 'Email Only'}
              </span>
            </div>
            <div class="review-row">
              <span class="review-key">Dataset</span>
              <span class="review-val">{selectedDataset?.name ?? '—'}</span>
            </div>
            <div class="review-row">
              <span class="review-key">Total recipients</span>
              <span class="review-val">{eligibleCount}</span>
            </div>
            <div class="review-row">
              <span class="review-key">Credits required</span>
              <span class="review-val review-credits">{creditsRequired}</span>
            </div>
            {#if selectedSmtp}
              <div class="review-row">
                <span class="review-key">Sending via</span>
                <span class="review-val">{selectedSmtp.name} &lt;{selectedSmtp.from_email}&gt;</span>
              </div>
            {/if}
          </div>

          <label class="consent-label">
            <input type="checkbox" bind:checked={consentChecked} />
            <span>I confirm I am authorised to email these recipients and they have consented to receive this communication.</span>
          </label>
        </div>
      </Card>
    </div>

  <!-- ── STEP 10: Launch ───────────────────────────────────────────────────── -->
  {:else if step === 10}
    <div class="step-content">
      <h2 class="step-title">Launching your campaign…</h2>
      <Card>
        <div class="form-section launch-section">
          {#if launching}
            <div class="launch-spinner">
              <span class="material-symbols-outlined spin" aria-hidden="true">sync</span>
              <span>Creating campaign and queuing jobs…</span>
            </div>
          {:else if launchError}
            <div class="launch-error" role="alert">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <div>
                <p class="launch-error-title">Failed to launch</p>
                <p class="launch-error-msg">{launchError}</p>
              </div>
            </div>
            <Button variant="primary" onclick={launch}>Retry</Button>
          {:else}
            <div class="launch-ready">
              <span class="material-symbols-outlined launch-icon" aria-hidden="true">rocket_launch</span>
              <p>Ready to launch <strong>{campaignName}</strong> to {eligibleCount} recipients.</p>
            </div>
            <Button variant="primary" size="lg" onclick={launch} loading={launching}>
              {#snippet icon()}<span class="material-symbols-outlined">send</span>{/snippet}
              {#snippet children()}Launch Campaign{/snippet}
            </Button>
          {/if}
        </div>
      </Card>
    </div>
  {/if}

  <!-- ── Navigation buttons ─────────────────────────────────────────────────── -->
  {#if step !== 10}
    <div class="wizard-nav">
      {#if step > 1}
        <Button variant="secondary" onclick={back}>
          {#snippet icon()}<span class="material-symbols-outlined">arrow_back</span>{/snippet}
          {#snippet children()}Back{/snippet}
        </Button>
      {:else}
        <a href="/dashboard/campaigns" class="cancel-link">Cancel</a>
      {/if}

      {#if step === 9}
        <Button
          variant="primary"
          disabled={!consentChecked || !campaignName.trim()}
          onclick={() => { step = 10; launch(); }}
        >
          {#snippet icon()}<span class="material-symbols-outlined">rocket_launch</span>{/snippet}
          {#snippet children()}Launch Campaign{/snippet}
        </Button>
      {:else}
        <Button
          variant="primary"
          disabled={!canNext()}
          onclick={next}
        >
          {#snippet children()}Next{/snippet}
          {#snippet icon()}<span class="material-symbols-outlined">arrow_forward</span>{/snippet}
        </Button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wizard-page {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Draft banner */
  .draft-banner {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.75rem 1rem;
    background: var(--color-brand-light);
    border: 1px solid var(--color-brand);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-brand);
  }

  .draft-banner .material-symbols-outlined { font-size: 1.125rem; flex-shrink: 0; }

  .draft-banner span:nth-child(2) { flex: 1; }

  .draft-dismiss, .draft-close {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
  }

  .draft-dismiss:hover, .draft-close:hover { background: rgba(99,102,241,0.1); }
  .draft-close .material-symbols-outlined { font-size: 1rem; }

  /* Header */
  .page-header { display: flex; flex-direction: column; gap: 0.25rem; }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: 0.375rem;
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

  /* Step indicator */
  .step-indicator {
    display: flex;
    align-items: center;
    gap: 0;
    overflow-x: auto;
    padding: 0.25rem 0;
  }

  .step-dot {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-bg-muted);
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .step-dot.active {
    background: var(--color-brand);
    border-color: var(--color-brand);
    color: var(--color-text-inverse);
  }

  .step-dot.done {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }

  .step-dot.done .material-symbols-outlined { font-size: 0.875rem; }

  .step-line {
    flex: 1;
    height: 2px;
    background: var(--color-border);
    min-width: 0.5rem;
    transition: background var(--transition-fast);
  }

  .step-line.done { background: var(--color-success); }

  /* Step content */
  .step-content { display: flex; flex-direction: column; gap: 1rem; }

  .step-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .step-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* Mode grid */
  .mode-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .mode-card {
    position: relative;
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
    font-family: inherit;
    color: var(--color-text);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
  }

  .mode-card:hover {
    border-color: var(--color-brand);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .mode-card.selected {
    border-color: var(--color-brand);
    background: var(--color-brand-light);
  }

  .mode-icon { font-size: 2rem; color: var(--color-brand); }
  .mode-label { font-size: var(--font-size-base); font-weight: 600; }
  .mode-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; flex: 1; }

  .mode-check {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    color: var(--color-brand);
    font-size: 1.25rem;
  }

  /* Form sections */
  .form-section { display: flex; flex-direction: column; gap: 1rem; }
  .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
  .field-row { display: flex; gap: 1rem; flex-wrap: wrap; }
  .flex-1 { flex: 1; min-width: 160px; }

  .field-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required { color: var(--color-error); margin-left: 0.125rem; }

  .field-select,
  .field-input {
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }

  .field-select:focus, .field-input:focus { border-color: var(--color-brand); }

  .field-textarea {
    padding: 0.5rem 0.75rem;
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    transition: border-color var(--transition-fast);
  }

  .field-textarea:focus { border-color: var(--color-brand); }

  .body-editor { min-height: 200px; }

  .empty-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .empty-hint a { color: var(--color-brand); }

  /* Column preview */
  .column-preview { display: flex; flex-direction: column; gap: 0.5rem; }
  .column-preview-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
  .column-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
  .column-tag {
    padding: 0.125rem 0.5rem;
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .row-count-note { display: flex; align-items: center; gap: 0.25rem; font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
  .row-count-note .material-symbols-outlined { font-size: 1rem; }

  .upload-link-row { display: flex; align-items: center; }
  .upload-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    color: var(--color-brand);
    text-decoration: none;
    padding: 0.375rem 0;
  }

  .upload-link:hover { text-decoration: underline; }
  .upload-link .material-symbols-outlined { font-size: 1rem; }

  /* Eligibility badge */
  .eligibility-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    background: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid var(--color-success);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .eligibility-badge.zero {
    background: var(--color-error-light);
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .eligibility-badge .material-symbols-outlined { font-size: 1.125rem; }

  /* Upload note */
  .upload-note {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .upload-note .material-symbols-outlined { font-size: 1.125rem; flex-shrink: 0; color: var(--color-brand); }

  /* Matching note */
  .matching-note {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .matching-note .material-symbols-outlined { font-size: 1.5rem; color: var(--color-brand); flex-shrink: 0; }
  .matching-note-title { font-weight: 600; font-size: var(--font-size-sm); margin: 0 0 0.25rem; }
  .matching-note-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

  .template-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

  /* Email composer */
  .input-with-picker { display: flex; gap: 0.5rem; align-items: flex-start; }
  .input-with-picker .field-input { flex: 1; }

  .body-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 0.25rem;
  }

  /* Preview */
  .preview-block {
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    font-size: var(--font-size-sm);
  }

  .preview-row { display: flex; gap: 0.75rem; margin-bottom: 0.375rem; }
  .preview-label { font-weight: 600; color: var(--color-text-muted); white-space: nowrap; min-width: 4.5rem; }
  .preview-val { color: var(--color-text); word-break: break-all; }
  .preview-separator { border-bottom: 1px solid var(--color-border); margin: 0.75rem 0; }
  .preview-body { color: var(--color-text); line-height: 1.6; }

  /* Review table */
  .review-table { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
  .review-row { display: flex; padding: 0.625rem 1rem; border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  .review-row:last-child { border-bottom: none; }
  .review-key { font-weight: 500; color: var(--color-text-muted); min-width: 10rem; flex-shrink: 0; }
  .review-val { color: var(--color-text); }
  .review-credits { font-weight: 600; color: var(--color-brand); }

  /* Consent */
  .consent-label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    cursor: pointer;
    line-height: 1.5;
  }

  .consent-label input[type="checkbox"] { margin-top: 0.15rem; flex-shrink: 0; }

  /* Launch */
  .launch-section { align-items: center; gap: 1.5rem; }

  .launch-spinner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
  }

  .launch-spinner .material-symbols-outlined { font-size: 1.5rem; color: var(--color-brand); }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }

  .launch-error {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.875rem 1rem;
    background: var(--color-error-light);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    color: var(--color-error);
    width: 100%;
  }

  .launch-error .material-symbols-outlined { font-size: 1.25rem; flex-shrink: 0; }
  .launch-error-title { font-weight: 600; margin: 0 0 0.25rem; }
  .launch-error-msg { margin: 0; font-size: var(--font-size-sm); }

  .launch-ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
    font-size: var(--font-size-base);
    color: var(--color-text);
  }

  .launch-icon { font-size: 3rem; color: var(--color-brand); }

  /* Navigation */
  .wizard-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
  }

  .cancel-link {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .cancel-link:hover { color: var(--color-text); }
</style>
