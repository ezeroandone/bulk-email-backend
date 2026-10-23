<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, VariablePicker } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let name = $state('');
  let subject = $state('');
  let body = $state('');
  let isHtml = $state(true);
  let saving = $state(false);

  const allColumns = $derived<string[]>(
    data.datasets.flatMap((ds) => (ds.columns as string[] | null) ?? [])
      .filter((c, i, arr) => arr.indexOf(c) === i)
  );

  function insertIntoSubject(varStr: string) {
    subject = subject + varStr;
  }

  function insertIntoBody(varStr: string) {
    body = body + varStr;
  }

  // Simple sanitize: strip script/iframe/etc. tags
  function sanitize(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
</script>

<svelte:head>
  <title>New Email Template — MergeMail</title>
</svelte:head>

<div class="new-template-page">
  <div class="page-header">
    <a href="/dashboard/email-templates" class="back-link">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Email Templates
    </a>
    <h1 class="page-title">New Email Template</h1>
    <p class="page-subtitle">Create a reusable subject and body template with variable placeholders.</p>
  </div>

  {#if form?.error}
    <div class="form-error" role="alert">
      <span class="material-symbols-outlined" aria-hidden="true">error</span>
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    action="?/create"
    use:enhance={() => {
      saving = true;
      // Sanitize body before submitting
      body = sanitize(body);
      return async ({ update }) => {
        await update();
        saving = false;
      };
    }}
  >
    <input type="hidden" name="is_html" value={isHtml ? 'true' : 'false'} />
    <input type="hidden" name="body_template" value={body} />

    <Card>
      <div class="form-section">
        <!-- Name -->
        <div class="field-group">
          <label class="field-label" for="tpl-name">
            Template name <span class="required" aria-hidden="true">*</span>
          </label>
          <input
            id="tpl-name"
            name="name"
            type="text"
            class="field-input"
            placeholder="e.g. Certificate Dispatch Email"
            bind:value={name}
            required
          />
        </div>

        <!-- Subject -->
        <div class="field-group">
          <label class="field-label" for="tpl-subject">
            Subject <span class="required" aria-hidden="true">*</span>
          </label>
          <div class="input-with-picker">
            <input
              id="tpl-subject"
              name="subject_template"
              type="text"
              class="field-input"
              placeholder={'e.g. Your certificate, {{first_name}}'}
              bind:value={subject}
              required
            />
            <VariablePicker columns={allColumns} onSelect={insertIntoSubject} />
          </div>
        </div>

        <!-- Format toggle -->
        <div class="format-toggle">
          <span class="field-label">Format</span>
          <div class="toggle-group">
            <button
              type="button"
              class="toggle-btn"
              class:active={isHtml}
              onclick={() => { isHtml = true; }}
            >HTML</button>
            <button
              type="button"
              class="toggle-btn"
              class:active={!isHtml}
              onclick={() => { isHtml = false; }}
            >Plain text</button>
          </div>
        </div>

        <!-- Body -->
        <div class="field-group">
          <div class="body-header">
            <label class="field-label" for="tpl-body">
              Body <span class="required" aria-hidden="true">*</span>
            </label>
            <VariablePicker columns={allColumns} onSelect={insertIntoBody} />
          </div>
          <textarea
            id="tpl-body"
            class="field-textarea body-editor"
            rows="14"
            placeholder={isHtml
              ? '<p>Dear {{first_name}},</p>\n<p>Please find your document attached.</p>'
              : 'Dear {{first_name}},\n\nPlease find your document attached.'}
            bind:value={body}
          ></textarea>
        </div>

        <!-- Preview -->
        {#if body.trim()}
          <div class="preview-section">
            <p class="preview-label">Preview</p>
            {#if isHtml}
              <div class="preview-html">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html sanitize(body)}
              </div>
            {:else}
              <pre class="preview-plain">{body}</pre>
            {/if}
          </div>
        {/if}
      </div>
    </Card>

    <div class="form-actions">
      <a href="/dashboard/email-templates" class="cancel-link">Cancel</a>
      <button type="submit" class="btn-primary" disabled={saving || !name.trim() || !subject.trim() || !body.trim()}>
        {#if saving}
          <span class="material-symbols-outlined spin" aria-hidden="true">sync</span>
        {:else}
          <span class="material-symbols-outlined" aria-hidden="true">save</span>
        {/if}
        Save Template
      </button>
    </div>
  </form>
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
    margin-bottom: 0.375rem;
    width: fit-content;
  }

  .back-link:hover { color: var(--color-brand); }
  .back-link .material-symbols-outlined { font-size: 1rem; }

  .page-title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text); margin: 0; }
  .page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

  .form-error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    background: var(--color-error-light);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }

  .form-error .material-symbols-outlined { font-size: 1.125rem; flex-shrink: 0; }

  .form-section { display: flex; flex-direction: column; gap: 1rem; }
  .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .field-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .required { color: var(--color-error); margin-left: 0.125rem; }

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

  .field-input:focus { border-color: var(--color-brand); }

  .input-with-picker { display: flex; gap: 0.5rem; align-items: flex-start; }
  .input-with-picker .field-input { flex: 1; }

  .format-toggle { display: flex; align-items: center; gap: 1rem; }
  .toggle-group { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
  .toggle-btn {
    padding: 0.375rem 0.875rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    cursor: pointer;
    background: var(--color-surface);
    border: none;
    color: var(--color-text-muted);
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .toggle-btn:not(:last-child) { border-right: 1px solid var(--color-border); }
  .toggle-btn.active { background: var(--color-brand); color: var(--color-text-inverse); font-weight: 500; }
  .toggle-btn:hover:not(.active) { background: var(--color-bg-muted); }

  .body-header { display: flex; align-items: center; justify-content: space-between; }

  .field-textarea {
    padding: 0.625rem 0.75rem;
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
  .body-editor { font-family: 'Courier New', monospace; min-height: 200px; }

  /* Preview */
  .preview-section { border-top: 1px solid var(--color-border); padding-top: 1rem; }
  .preview-label { font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin: 0 0 0.5rem; }
  .preview-html {
    padding: 1rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--color-text);
    min-height: 4rem;
  }

  .preview-plain {
    padding: 1rem;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    white-space: pre-wrap;
    margin: 0;
  }

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

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1.125rem;
    background: var(--color-brand);
    color: var(--color-text-inverse);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .btn-primary:hover:not(:disabled) { background: var(--color-brand-hover); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary .material-symbols-outlined { font-size: 1.125rem; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }
</style>
