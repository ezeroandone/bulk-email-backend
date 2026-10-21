<script lang="ts">
  import type { Snippet } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // ── Types ──────────────────────────────────────────────────────────────────

  export interface RecipientRow {
    id: string;
    email: string;
    data: Record<string, string>;
  }

  export interface FileEntry {
    name: string;
    storagePath: string;
  }

  export type MatchStatus = 'matched' | 'unmatched' | 'ambiguous' | 'duplicate';

  export interface MatchResult {
    recipient: RecipientRow;
    matchedFile?: FileEntry;
    confidence: number;
    status: MatchStatus;
  }

  export interface MatchingPreviewProps {
    results: MatchResult[];
    allFiles: FileEntry[];
    /** Called when the user confirms the final (possibly edited) match list */
    onConfirm?: (results: MatchResult[]) => void;
    recipientLabelColumn?: string;
    children?: Snippet;
  }

  // ── Props ──────────────────────────────────────────────────────────────────

  let {
    results = $bindable([]),
    allFiles = [],
    onConfirm,
    recipientLabelColumn = 'full_name'
  }: MatchingPreviewProps = $props();

  // ── Local state ────────────────────────────────────────────────────────────

  let selectedIds = $state<Set<string>>(new Set());
  let pickerOpen = $state(false);
  let pickerTargetId = $state<string | null>(null);
  let excludedIds = $state<Set<string>>(new Set());

  // ── Derived ────────────────────────────────────────────────────────────────

  const visibleResults = $derived(
    results.filter((r) => !excludedIds.has(r.recipient.id))
  );

  const matched = $derived(visibleResults.filter((r) => r.status === 'matched').length);
  const unmatched = $derived(visibleResults.filter((r) => r.status === 'unmatched').length);
  const ambiguous = $derived(visibleResults.filter((r) => r.status === 'ambiguous').length);
  const duplicate = $derived(visibleResults.filter((r) => r.status === 'duplicate').length);

  const hasErrors = $derived(unmatched + ambiguous + duplicate > 0);

  const allVisibleSelected = $derived(
    visibleResults.length > 0 &&
    visibleResults.every((r) => selectedIds.has(r.recipient.id))
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  function statusVariant(status: MatchStatus): 'success' | 'error' | 'warning' | 'neutral' {
    switch (status) {
      case 'matched':   return 'success';
      case 'unmatched': return 'error';
      case 'ambiguous': return 'warning';
      case 'duplicate': return 'warning';
    }
  }

  function statusLabel(status: MatchStatus): string {
    switch (status) {
      case 'matched':   return 'Matched';
      case 'unmatched': return 'Unmatched';
      case 'ambiguous': return 'Ambiguous';
      case 'duplicate': return 'Duplicate';
    }
  }

  function fmtConfidence(n: number): string {
    return `${Math.round(n * 100)}%`;
  }

  function recipientLabel(r: RecipientRow): string {
    return r.data[recipientLabelColumn] ?? r.email;
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds = next;
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      selectedIds = new Set();
    } else {
      selectedIds = new Set(visibleResults.map((r) => r.recipient.id));
    }
  }

  // ── Exclude actions ────────────────────────────────────────────────────────

  function excludeSelected() {
    const next = new Set(excludedIds);
    for (const id of selectedIds) next.add(id);
    excludedIds = next;
    selectedIds = new Set();
  }

  function excludeAllUnmatched() {
    const next = new Set(excludedIds);
    for (const r of results) {
      if (r.status === 'unmatched') next.add(r.recipient.id);
    }
    excludedIds = next;
  }

  function restoreAll() {
    excludedIds = new Set();
  }

  // ── File picker modal ──────────────────────────────────────────────────────

  function openPicker(recipientId: string) {
    pickerTargetId = recipientId;
    pickerOpen = true;
  }

  function assignFile(file: FileEntry) {
    if (!pickerTargetId) return;
    results = results.map((r) => {
      if (r.recipient.id !== pickerTargetId) return r;
      return {
        ...r,
        matchedFile: file,
        confidence: 1.0,
        status: 'matched' as MatchStatus
      };
    });
    pickerOpen = false;
    pickerTargetId = null;
  }

  function clearMatch(recipientId: string) {
    results = results.map((r) => {
      if (r.recipient.id !== recipientId) return r;
      return { ...r, matchedFile: undefined, confidence: 0, status: 'unmatched' as MatchStatus };
    });
  }

  // ── Confirm ────────────────────────────────────────────────────────────────

  function handleConfirm() {
    const final = results.filter((r) => !excludedIds.has(r.recipient.id));
    onConfirm?.(final);
  }
</script>

<!-- File picker modal -->
<Modal bind:open={pickerOpen} title="Assign File Manually" size="lg">
  {#snippet children()}
    <p class="picker-hint">
      Select a file to assign to this recipient:
    </p>
    <ul class="file-list" role="listbox" aria-label="Available files">
      {#each allFiles as file (file.storagePath)}
        <li>
          <button
            type="button"
            class="file-item"
            onclick={() => assignFile(file)}
            role="option"
            aria-selected="false"
          >
            <span class="material-symbols-outlined file-icon" aria-hidden="true">description</span>
            <span class="file-name">{file.name}</span>
            <span class="material-symbols-outlined assign-arrow" aria-hidden="true">arrow_forward</span>
          </button>
        </li>
      {/each}
      {#if allFiles.length === 0}
        <li class="no-files">No files available.</li>
      {/if}
    </ul>
  {/snippet}
</Modal>

<!-- Main component -->
<div class="matching-preview">
  <!-- Summary bar -->
  <div class="summary-bar">
    <div class="summary-stats">
      <span class="stat matched">
        <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
        {matched} matched
      </span>
      <span class="stat unmatched">
        <span class="material-symbols-outlined" aria-hidden="true">cancel</span>
        {unmatched} unmatched
      </span>
      <span class="stat ambiguous">
        <span class="material-symbols-outlined" aria-hidden="true">help</span>
        {ambiguous} ambiguous
      </span>
      {#if duplicate > 0}
        <span class="stat duplicate">
          <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>
          {duplicate} duplicate
        </span>
      {/if}
      {#if excludedIds.size > 0}
        <span class="stat excluded">
          <span class="material-symbols-outlined" aria-hidden="true">visibility_off</span>
          {excludedIds.size} excluded
        </span>
      {/if}
    </div>
    <div class="summary-actions">
      {#if excludedIds.size > 0}
        <Button variant="ghost" size="sm" onclick={restoreAll}>
          {#snippet icon()}<span class="material-symbols-outlined">refresh</span>{/snippet}
          {#snippet children()}Restore all{/snippet}
        </Button>
      {/if}
      <Button variant="ghost" size="sm" onclick={excludeAllUnmatched} disabled={unmatched === 0}>
        {#snippet icon()}<span class="material-symbols-outlined">visibility_off</span>{/snippet}
        {#snippet children()}Exclude unmatched{/snippet}
      </Button>
      {#if selectedIds.size > 0}
        <Button variant="ghost" size="sm" onclick={excludeSelected}>
          {#snippet icon()}<span class="material-symbols-outlined">remove_circle</span>{/snippet}
          {#snippet children()}Exclude selected ({selectedIds.size}){/snippet}
        </Button>
      {/if}
    </div>
  </div>

  <!-- Blocking error banner -->
  {#if hasErrors}
    <div class="error-banner" role="alert">
      <span class="material-symbols-outlined banner-icon" aria-hidden="true">warning</span>
      <div class="banner-text">
        <strong>Unresolved issues detected.</strong>
        {unmatched > 0 ? `${unmatched} recipient(s) have no matched file.` : ''}
        {ambiguous > 0 ? `${ambiguous} recipient(s) have ambiguous matches.` : ''}
        {duplicate > 0 ? `${duplicate} recipient(s) share a file.` : ''}
        Resolve them above or exclude the affected rows to proceed.
      </div>
    </div>
  {/if}

  <!-- Table -->
  <div class="table-wrapper" role="region" aria-label="Document matching results">
    <table class="match-table">
      <thead>
        <tr>
          <th class="col-check">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={allVisibleSelected}
              indeterminate={selectedIds.size > 0 && !allVisibleSelected}
              onchange={toggleSelectAll}
            />
          </th>
          <th class="col-recipient">Recipient</th>
          <th class="col-email">Email</th>
          <th class="col-file">Matched File</th>
          <th class="col-confidence">Confidence</th>
          <th class="col-status">Status</th>
          <th class="col-actions" aria-label="Actions"></th>
        </tr>
      </thead>
      <tbody>
        {#each visibleResults as result (result.recipient.id)}
          <tr class="match-row status-{result.status}" class:selected={selectedIds.has(result.recipient.id)}>
            <td class="col-check">
              <input
                type="checkbox"
                aria-label="Select {recipientLabel(result.recipient)}"
                checked={selectedIds.has(result.recipient.id)}
                onchange={() => toggleSelect(result.recipient.id)}
              />
            </td>
            <td class="col-recipient">
              <span class="recipient-name">{recipientLabel(result.recipient)}</span>
            </td>
            <td class="col-email">
              <span class="email-text">{result.recipient.email}</span>
            </td>
            <td class="col-file">
              {#if result.matchedFile}
                <span class="file-chip">
                  <span class="material-symbols-outlined chip-icon" aria-hidden="true">description</span>
                  <span class="chip-name">{result.matchedFile.name}</span>
                </span>
              {:else}
                <span class="no-file">—</span>
              {/if}
            </td>
            <td class="col-confidence">
              {#if result.matchedFile}
                <span class="confidence-pill conf-{result.status}">
                  {fmtConfidence(result.confidence)}
                </span>
              {:else}
                <span class="no-file">—</span>
              {/if}
            </td>
            <td class="col-status">
              <Badge variant={statusVariant(result.status)}>
                {statusLabel(result.status)}
              </Badge>
            </td>
            <td class="col-actions">
              <div class="row-actions">
                <button
                  type="button"
                  class="action-btn"
                  aria-label="Assign file to {recipientLabel(result.recipient)}"
                  title="Manually assign file"
                  onclick={() => openPicker(result.recipient.id)}
                >
                  <span class="material-symbols-outlined" aria-hidden="true">folder_open</span>
                </button>
                {#if result.matchedFile}
                  <button
                    type="button"
                    class="action-btn action-clear"
                    aria-label="Clear match for {recipientLabel(result.recipient)}"
                    title="Clear match"
                    onclick={() => clearMatch(result.recipient.id)}
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">link_off</span>
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
        {#if visibleResults.length === 0}
          <tr>
            <td colspan="7" class="empty-row">
              <span class="material-symbols-outlined empty-icon" aria-hidden="true">inbox</span>
              No recipients to display.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Confirm button -->
  <div class="confirm-row">
    <Button
      variant="primary"
      size="md"
      disabled={hasErrors}
      onclick={handleConfirm}
    >
      {#snippet icon()}<span class="material-symbols-outlined">check</span>{/snippet}
      {#snippet children()}Confirm Matching{/snippet}
    </Button>
    {#if hasErrors}
      <span class="confirm-hint">Resolve or exclude all issues to proceed.</span>
    {/if}
  </div>
</div>

<style>
  .matching-preview {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Summary bar */
  .summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
    background: var(--color-bg-muted);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }

  .summary-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .stat .material-symbols-outlined { font-size: 1rem; }

  .stat.matched   { color: var(--color-success); }
  .stat.unmatched { color: var(--color-error); }
  .stat.ambiguous { color: var(--color-warning); }
  .stat.duplicate { color: var(--color-warning); }
  .stat.excluded  { color: var(--color-text-muted); }

  .summary-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Error banner */
  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--color-error-light);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    color: var(--color-error);
    font-size: var(--font-size-sm);
  }

  .banner-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }
  .banner-text { line-height: 1.6; }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .match-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .match-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .match-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    color: var(--color-text);
  }

  .match-row:last-child td { border-bottom: none; }

  .match-row.selected { background: var(--color-brand-light, #eef2ff); }

  .match-row:hover td { background: var(--color-bg-subtle); }

  /* Columns */
  .col-check     { width: 2.5rem; }
  .col-confidence { width: 6rem; text-align: center; }
  .col-status    { width: 7rem; }
  .col-actions   { width: 5rem; }

  .recipient-name { font-weight: 500; }
  .email-text     { color: var(--color-text-muted); }
  .no-file        { color: var(--color-text-muted); }

  /* File chip */
  .file-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: var(--color-bg-muted);
    border-radius: var(--radius-sm);
    max-width: 220px;
  }

  .chip-icon { font-size: 0.875rem; color: var(--color-text-muted); }

  .chip-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-xs);
  }

  /* Confidence pill */
  .confidence-pill {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  .conf-matched   { background: var(--color-success-light); color: var(--color-success); }
  .conf-ambiguous { background: var(--color-warning-light); color: var(--color-warning); }
  .conf-duplicate { background: var(--color-warning-light); color: var(--color-warning); }
  .conf-unmatched { background: var(--color-error-light);   color: var(--color-error); }

  /* Row actions */
  .row-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.875rem;
    height: 1.875rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .action-btn:hover { background: var(--color-bg-muted); color: var(--color-text); }
  .action-btn .material-symbols-outlined { font-size: 1.125rem; }

  .action-clear:hover { color: var(--color-error); }

  /* Empty row */
  .empty-row {
    text-align: center;
    padding: 2.5rem;
    color: var(--color-text-muted);
  }

  .empty-icon { font-size: 2rem; display: block; margin: 0 auto 0.5rem; }

  /* Confirm row */
  .confirm-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: flex-end;
  }

  .confirm-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  /* File picker modal */
  .picker-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0 0 0.75rem;
  }

  .file-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 24rem;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .file-item:hover { background: var(--color-brand-light); border-color: var(--color-brand); }

  .file-icon  { font-size: 1.125rem; color: var(--color-text-muted); flex-shrink: 0; }
  .file-name  { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .assign-arrow { font-size: 1rem; color: var(--color-brand); flex-shrink: 0; }

  .no-files {
    text-align: center;
    padding: 1.5rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
