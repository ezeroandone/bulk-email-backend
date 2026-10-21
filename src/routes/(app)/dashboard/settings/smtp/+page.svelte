<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Input, Select, Modal, Badge, ConfirmDialog } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  // Modal state
  let modalOpen = $state(false);
  let editId = $state<string | null>(null);

  // Form fields
  let name = $state('');
  let host = $state('');
  let port = $state(587);
  let tls = $state<'ssl' | 'starttls' | 'none'>('starttls');
  let username = $state('');
  let password = $state('');
  let fromName = $state('');
  let fromEmail = $state('');
  let replyTo = $state('');
  let timeoutMs = $state(10000);
  let ratePerMinute = $state(60);
  let saving = $state(false);

  // Delete confirm
  let deleteOpen = $state(false);
  let deleteId = $state<string | null>(null);

  // Test loading
  let testingId = $state<string | null>(null);
  let testResult = $state<{ success: boolean; message: string } | null>(null);

  interface SmtpConfig {
    id: string;
    name: string;
    host: string;
    port: number;
    tls: string;
    from_name: string;
    from_email: string;
    reply_to: string | null;
    is_default: boolean;
    last_tested_at: string | null;
    is_verified: boolean;
    timeout_ms: number;
    rate_per_minute: number;
    created_at: string;
  }

  // Provider presets
  type Preset = { label: string; host: string; port: number; tls: 'ssl' | 'starttls' | 'none' };
  const PRESETS: Preset[] = [
    { label: 'Custom',       host: '',                          port: 587, tls: 'starttls' },
    { label: 'Gmail',        host: 'smtp.gmail.com',            port: 587, tls: 'starttls' },
    { label: 'Microsoft 365',host: 'smtp.office365.com',        port: 587, tls: 'starttls' },
    { label: 'Zoho Mail',    host: 'smtp.zoho.com',             port: 465, tls: 'ssl'      },
    { label: 'Hostinger',    host: 'smtp.hostinger.com',        port: 465, tls: 'ssl'      }
  ];

  function applyPreset(preset: Preset) {
    if (preset.host) {
      host = preset.host;
      port = preset.port;
      tls = preset.tls;
    }
  }

  function openAdd() {
    editId = null;
    name = ''; host = ''; port = 587; tls = 'starttls';
    username = ''; password = ''; fromName = ''; fromEmail = '';
    replyTo = ''; timeoutMs = 10000; ratePerMinute = 60;
    modalOpen = true;
  }

  function openEdit(cfg: SmtpConfig) {
    editId = cfg.id;
    name = cfg.name;
    host = cfg.host;
    port = cfg.port;
    tls = cfg.tls as 'ssl' | 'starttls' | 'none';
    username = '';        // never pre-fill
    password = '';        // never pre-fill
    fromName = cfg.from_name;
    fromEmail = cfg.from_email;
    replyTo = cfg.reply_to ?? '';
    timeoutMs = cfg.timeout_ms;
    ratePerMinute = cfg.rate_per_minute;
    modalOpen = true;
  }

  function confirmDelete(id: string) {
    deleteId = id;
    deleteOpen = true;
  }

  async function testConnection(configId: string) {
    testingId = configId;
    testResult = null;
    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_id: configId })
      });
      testResult = await res.json() as { success: boolean; message: string };
    } catch {
      testResult = { success: false, message: 'Connection test failed — network error.' };
    } finally {
      testingId = null;
    }
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const tlsOptions = [
    { value: 'starttls', label: 'STARTTLS (port 587)' },
    { value: 'ssl', label: 'SSL/TLS (port 465)' },
    { value: 'none', label: 'None (not recommended)' }
  ];
</script>

<svelte:head>
  <title>SMTP Settings — MergeMail</title>
</svelte:head>

<div class="smtp-page">
  <div class="page-header">
    <div>
      <h1 class="page-title">SMTP Configurations</h1>
      <p class="page-subtitle">Manage the email senders used to deliver your campaigns.</p>
    </div>
    <Button onclick={openAdd}>
      {#snippet icon()}<span class="material-symbols-outlined">add</span>{/snippet}
      Add Configuration
    </Button>
  </div>

  {#if form?.success}
    <div class="alert alert--success" role="status">
      <span class="material-symbols-outlined">check_circle</span>
      SMTP configuration saved.
    </div>
  {/if}
  {#if form?.message}
    <div class="alert alert--error" role="alert">
      <span class="material-symbols-outlined">error</span>
      {form.message}
    </div>
  {/if}

  {#if testResult}
    <div class="alert" class:alert--success={testResult.success} class:alert--error={!testResult.success} role="status">
      <span class="material-symbols-outlined">{testResult.success ? 'check_circle' : 'error'}</span>
      {testResult.message}
    </div>
  {/if}

  {#if data.configs.length === 0}
    <Card>
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">settings_ethernet</span>
        <p class="empty-title">No SMTP configurations yet</p>
        <p class="empty-desc">Add a configuration to start sending campaigns.</p>
        <Button onclick={openAdd}>
          {#snippet icon()}<span class="material-symbols-outlined">add</span>{/snippet}
          Add Configuration
        </Button>
      </div>
    </Card>
  {:else}
    <div class="configs-list">
      {#each data.configs as cfg (cfg.id)}
        <Card>
          <div class="config-row">
            <div class="config-info">
              <div class="config-name-row">
                <h3 class="config-name">{cfg.name}</h3>
                {#if cfg.is_default}
                  <Badge variant="info">Default</Badge>
                {/if}
                {#if cfg.is_verified}
                  <Badge variant="success">Verified</Badge>
                {:else}
                  <Badge variant="warning">Unverified</Badge>
                {/if}
              </div>
              <p class="config-meta">
                <span class="material-symbols-outlined meta-icon">dns</span>
                {cfg.host}:{cfg.port} ({cfg.tls.toUpperCase()})
              </p>
              <p class="config-meta">
                <span class="material-symbols-outlined meta-icon">alternate_email</span>
                {cfg.from_name} &lt;{cfg.from_email}&gt;
              </p>
              <p class="config-meta">
                <span class="material-symbols-outlined meta-icon">schedule</span>
                Last tested: {fmtDate(cfg.last_tested_at)}
              </p>
            </div>
            <div class="config-actions">
              <Button
                variant="secondary"
                size="sm"
                loading={testingId === cfg.id}
                onclick={() => testConnection(cfg.id)}
              >
                {#snippet icon()}<span class="material-symbols-outlined">network_check</span>{/snippet}
                Test
              </Button>
              {#if !cfg.is_default}
                <form method="POST" action="?/setDefault" use:enhance>
                  <input type="hidden" name="id" value={cfg.id} />
                  <Button variant="ghost" size="sm" type="submit">Set Default</Button>
                </form>
              {/if}
              <Button variant="ghost" size="sm" onclick={() => openEdit(cfg)}>
                {#snippet icon()}<span class="material-symbols-outlined">edit</span>{/snippet}
                Edit
              </Button>
              <Button variant="danger" size="sm" onclick={() => confirmDelete(cfg.id)}>
                {#snippet icon()}<span class="material-symbols-outlined">delete</span>{/snippet}
                Delete
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Add / Edit Modal -->
<Modal bind:open={modalOpen} title={editId ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'} size="lg">
  {#snippet children()}
    <!-- Provider presets -->
    <div class="presets">
      <p class="presets-label">Quick presets:</p>
      <div class="presets-row">
        {#each PRESETS as preset}
          <button
            type="button"
            class="preset-btn"
            onclick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        {/each}
      </div>
    </div>

    <form
      id="smtp-form"
      method="POST"
      action={editId ? '?/save' : '?/save'}
      use:enhance={() => {
        saving = true;
        return async ({ update }) => {
          saving = false;
          modalOpen = false;
          await update();
        };
      }}
    >
      {#if editId}
        <input type="hidden" name="edit_id" value={editId} />
      {/if}

      {#if form?.errors}
        <div class="form-errors" role="alert">
          {#each Object.entries(form.errors) as [field, msgs]}
            {#if msgs}
              <p class="form-error-item">{field}: {msgs[0]}</p>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="form-grid">
        <div class="form-full">
          <Input label="Configuration name" name="name" bind:value={name} required placeholder="e.g. Main Sender" error={form?.errors?.name?.[0]} />
        </div>
        <Input label="SMTP host" name="host" bind:value={host} required placeholder="smtp.example.com" error={form?.errors?.host?.[0]} />
        <Input label="Port" name="port" type="number" bind:value={port as unknown as string} required error={form?.errors?.port?.[0]} />
        <div class="form-full">
          <Select label="Encryption" name="tls" bind:value={tls} options={tlsOptions} error={form?.errors?.tls?.[0]} />
        </div>
        <Input label="Username" name="username" bind:value={username} required={!editId} placeholder={editId ? 'Enter new username to update' : 'user@example.com'} error={form?.errors?.username?.[0]} />
        <Input label="Password" name="password" type="password" bind:value={password} required={!editId} placeholder={editId ? 'Enter new password to update' : ''} error={form?.errors?.password?.[0]} />
        <Input label="Sender display name" name="from_name" bind:value={fromName} required placeholder="MergeMail" error={form?.errors?.from_name?.[0]} />
        <Input label="Sender email" name="from_email" type="email" bind:value={fromEmail} required placeholder="noreply@example.com" error={form?.errors?.from_email?.[0]} />
        <div class="form-full">
          <Input label="Reply-to (optional)" name="reply_to" type="email" bind:value={replyTo} placeholder="replies@example.com" error={form?.errors?.reply_to?.[0]} />
        </div>
        <Input label="Timeout (ms)" name="timeout_ms" type="number" bind:value={timeoutMs as unknown as string} error={form?.errors?.timeout_ms?.[0]} />
        <Input label="Rate limit (emails/min)" name="rate_per_minute" type="number" bind:value={ratePerMinute as unknown as string} error={form?.errors?.rate_per_minute?.[0]} />
      </div>
    </form>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={() => { modalOpen = false; }}>Cancel</Button>
    <Button type="submit" form="smtp-form" loading={saving}>
      {editId ? 'Save Changes' : 'Add Configuration'}
    </Button>
  {/snippet}
</Modal>

<!-- Delete confirm -->
<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Configuration"
  message="This will permanently remove this SMTP configuration. Campaigns that reference it may fail. Continue?"
  confirmLabel="Delete"
  danger
  onConfirm={async () => {
    if (!deleteId) return;
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = '?/delete';
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = 'id'; inp.value = deleteId;
    f.appendChild(inp);
    document.body.appendChild(f);
    f.submit();
  }}
/>

<style>
  .smtp-page {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .alert--success { background: var(--color-success-light); color: var(--color-success); }
  .alert--error   { background: var(--color-error-light);   color: var(--color-error); }

  .configs-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .config-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .config-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
    flex-wrap: wrap;
  }

  .config-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .config-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0 0 0.25rem;
  }

  .meta-icon { font-size: 0.875rem; }

  .config-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1.5rem;
    gap: 0.75rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    color: var(--color-text-subtle);
  }

  .empty-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .empty-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  /* Presets */
  .presets {
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
  }

  .presets-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0 0 0.5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .presets-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 0.25rem 0.75rem;
    font-size: var(--font-size-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-subtle);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
    font-family: inherit;
  }

  .preset-btn:hover {
    background: var(--color-brand-light);
    color: var(--color-brand);
    border-color: var(--color-brand);
  }

  /* Form grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-full { grid-column: 1 / -1; }

  .form-errors {
    background: var(--color-error-light);
    color: var(--color-error);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .form-error-item {
    font-size: var(--font-size-xs);
    margin: 0 0 0.25rem;
  }

  .form-error-item:last-child { margin: 0; }
</style>
