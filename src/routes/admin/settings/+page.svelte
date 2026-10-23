<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let s = $derived(data.settings ?? {});

  let maxRecipients = $state(parseInt(s.max_recipients_per_campaign ?? '10000', 10));
  let defaultRate = $state(parseInt(s.default_sending_rate_per_minute ?? '60', 10));
  let maxAttachment = $state(parseFloat(s.max_attachment_size_mb ?? '10'));
  let maxUpload = $state(parseFloat(s.max_upload_size_mb ?? '50'));
  let maintenanceMode = $state(s.maintenance_mode === 'true');

  // Toast state
  let showToast = $state(false);
  let toastType = $state<'success' | 'error'>('success');
  let toastMsg = $state('');

  $effect(() => {
    if (form?.success) {
      toastType = 'success';
      toastMsg = 'Settings saved successfully.';
      showToast = true;
      const t = setTimeout(() => (showToast = false), 4000);
      return () => clearTimeout(t);
    }
    if (form?.error) {
      toastType = 'error';
      toastMsg = form.error as string;
      showToast = true;
      const t = setTimeout(() => (showToast = false), 5000);
      return () => clearTimeout(t);
    }
  });
</script>

<svelte:head>
  <title>Settings — Admin — MergeMail</title>
</svelte:head>

<div class="settings-page">
  <h1 class="page-title">Platform Settings</h1>

  <form method="POST" action="?/saveSettings" use:enhance class="settings-form">
    <!-- Campaigns -->
    <section class="card">
      <h2 class="card-title">
        <span class="material-symbols-outlined" aria-hidden="true">campaign</span>
        Campaign Limits
      </h2>

      <div class="form-grid">
        <div class="form-group">
          <label for="max-recipients" class="form-label">Max Recipients per Campaign</label>
          <input
            id="max-recipients"
            type="number"
            name="max_recipients_per_campaign"
            class="form-input"
            bind:value={maxRecipients}
            min="1"
            required
          />
          <p class="form-hint">Maximum number of recipients allowed in a single campaign.</p>
        </div>

        <div class="form-group">
          <label for="default-rate" class="form-label">Default Sending Rate (per minute)</label>
          <input
            id="default-rate"
            type="number"
            name="default_sending_rate_per_minute"
            class="form-input"
            bind:value={defaultRate}
            min="1"
            required
          />
          <p class="form-hint">Default rate at which emails are dispatched per minute.</p>
        </div>
      </div>
    </section>

    <!-- File Limits -->
    <section class="card">
      <h2 class="card-title">
        <span class="material-symbols-outlined" aria-hidden="true">attach_file</span>
        File Size Limits
      </h2>

      <div class="form-grid">
        <div class="form-group">
          <label for="max-attachment" class="form-label">Max Attachment Size (MB)</label>
          <input
            id="max-attachment"
            type="number"
            name="max_attachment_size_mb"
            class="form-input"
            bind:value={maxAttachment}
            min="1"
            step="0.5"
            required
          />
          <p class="form-hint">Maximum allowed size for email attachments.</p>
        </div>

        <div class="form-group">
          <label for="max-upload" class="form-label">Max Upload Size (MB)</label>
          <input
            id="max-upload"
            type="number"
            name="max_upload_size_mb"
            class="form-input"
            bind:value={maxUpload}
            min="1"
            step="1"
            required
          />
          <p class="form-hint">Maximum allowed size for dataset / template file uploads.</p>
        </div>
      </div>
    </section>

    <!-- Maintenance mode -->
    <section class="card">
      <h2 class="card-title">
        <span class="material-symbols-outlined" aria-hidden="true">construction</span>
        Maintenance
      </h2>

      <label class="checkbox-row" for="maintenance-mode">
        <input
          id="maintenance-mode"
          type="checkbox"
          name="maintenance_mode"
          bind:checked={maintenanceMode}
        />
        <div>
          <p class="checkbox-label-text">Maintenance Mode</p>
          <p class="form-hint">When enabled, the platform shows a maintenance page to all non-admin users.</p>
        </div>
      </label>
    </section>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">
        <span class="material-symbols-outlined" aria-hidden="true">save</span>
        Save Settings
      </button>
    </div>
  </form>

  <!-- Toast -->
  {#if showToast}
    <div class="toast toast-{toastType}" role="alert" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        {toastType === 'success' ? 'check_circle' : 'error'}
      </span>
      <span>{toastMsg}</span>
      <button type="button" class="toast-close" onclick={() => (showToast = false)} aria-label="Dismiss">
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Card */
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1.25rem;
  }

  .card-title .material-symbols-outlined { font-size: 1.25rem; color: var(--color-text-muted); }

  /* Form */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
  }

  .form-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .form-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
  }

  .form-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .form-input:focus { border-color: var(--color-brand); }

  .checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }

  .checkbox-row input[type="checkbox"] {
    margin-top: 0.25rem;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    accent-color: var(--color-brand);
  }

  .checkbox-label-text {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
    margin: 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Button */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-family: inherit;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    padding: 0.5rem 1.25rem;
    font-size: var(--font-size-sm);
    transition: background var(--transition-fast);
  }

  .btn:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
  .btn-primary { background: var(--color-brand); color: var(--color-text-inverse); border-color: var(--color-brand); }
  .btn-primary:hover { background: var(--color-brand-hover); }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    min-width: 16rem;
    max-width: 24rem;
    font-size: var(--font-size-sm);
    animation: toast-in 0.2s ease-out;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }

  .toast-success .material-symbols-outlined:first-child { color: var(--color-success); }
  .toast-error .material-symbols-outlined:first-child { color: var(--color-error); }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    cursor: pointer;
    padding: 0.25rem;
    flex-shrink: 0;
  }

  .toast-close:hover { background: var(--color-bg-muted); }
  .toast-close .material-symbols-outlined { font-size: 1rem; }
</style>
