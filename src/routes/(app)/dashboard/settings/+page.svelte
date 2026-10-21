<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Input, ConfirmDialog } from '$lib/components/ui';
  import { theme } from '$lib/stores/theme';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let displayName = $state(data.profile?.full_name ?? '');
  let saving = $state(false);
  let deleteOpen = $state(false);

  let isDark = $state(false);
  theme.subscribe((v) => { isDark = v; });

  function toggleTheme() {
    theme.toggle();
  }

  // Onboarding
  interface OnboardingStep {
    key: keyof typeof data.steps;
    label: string;
    icon: string;
    href: string;
  }

  const onboardingSteps: OnboardingStep[] = [
    { key: 'profileComplete', label: 'Complete your profile', icon: 'person', href: '/dashboard/settings' },
    { key: 'smtpConfigured', label: 'Configure SMTP sender', icon: 'settings_ethernet', href: '/dashboard/settings/smtp' },
    { key: 'datasetUploaded', label: 'Upload a spreadsheet', icon: 'upload_file', href: '/dashboard/datasets/new' },
    { key: 'campaignCreated', label: 'Create a campaign', icon: 'campaign', href: '/dashboard/campaigns/new' }
  ];

  let completedCount = $derived(
    onboardingSteps.filter((s) => data.steps[s.key]).length
  );
  let progressPct = $derived(Math.round((completedCount / onboardingSteps.length) * 100));
</script>

<svelte:head>
  <title>Settings — MergeMail</title>
</svelte:head>

<div class="settings-page">
  <div class="page-header">
    <h1 class="page-title">Account Settings</h1>
    <p class="page-subtitle">Manage your profile, preferences, and account.</p>
  </div>

  <div class="settings-grid">
    <!-- Profile section -->
    <Card>
      <h2 class="section-title">
        <span class="material-symbols-outlined">person</span>
        Profile
      </h2>

      <!-- Avatar -->
      <div class="avatar-row">
        {#if data.profile?.avatar_url}
          <img
            src={data.profile.avatar_url}
            alt="Profile photo"
            class="avatar"
            width="72"
            height="72"
          />
        {:else}
          <div class="avatar-placeholder" aria-hidden="true">
            <span class="material-symbols-outlined">person</span>
          </div>
        {/if}
        <div>
          <p class="avatar-name">{data.profile?.full_name ?? 'Your Name'}</p>
          <p class="avatar-email">{data.profile?.email ?? data.session?.user?.email ?? ''}</p>
          <p class="avatar-hint">Profile photo is synced from your Google account.</p>
        </div>
      </div>

      {#if form?.success}
        <div class="alert alert--success" role="status">
          <span class="material-symbols-outlined">check_circle</span>
          Profile updated successfully.
        </div>
      {/if}
      {#if form?.message}
        <div class="alert alert--error" role="alert">
          <span class="material-symbols-outlined">error</span>
          {form.message}
        </div>
      {/if}

      <form
        method="POST"
        action="?/updateProfile"
        use:enhance={() => {
          saving = true;
          return async ({ update }) => {
            saving = false;
            await update();
          };
        }}
      >
        <div class="form-fields">
          <Input
            label="Display name"
            name="displayName"
            bind:value={displayName}
            required
            placeholder="Your full name"
            error={form?.errors?.displayName?.[0]}
          />
          <Input
            label="Email address"
            value={data.profile?.email ?? data.session?.user?.email ?? ''}
            disabled
            hint="Email is managed by your Google account and cannot be changed here."
          />
        </div>

        <Button type="submit" loading={saving} class="save-btn">
          {#snippet icon()}<span class="material-symbols-outlined">save</span>{/snippet}
          Save Changes
        </Button>
      </form>
    </Card>

    <!-- Preferences -->
    <Card>
      <h2 class="section-title">
        <span class="material-symbols-outlined">palette</span>
        Preferences
      </h2>

      <div class="pref-row">
        <div class="pref-info">
          <p class="pref-label">Theme</p>
          <p class="pref-desc">Choose between light and dark mode.</p>
        </div>
        <button
          type="button"
          class="theme-toggle"
          onclick={toggleTheme}
          aria-pressed={isDark}
          aria-label="Toggle {isDark ? 'light' : 'dark'} mode"
        >
          <span class="material-symbols-outlined theme-icon" aria-hidden="true">
            {isDark ? 'dark_mode' : 'light_mode'}
          </span>
          <span class="theme-label">{isDark ? 'Dark' : 'Light'}</span>
          <span class="toggle-track">
            <span class="toggle-thumb" class:checked={isDark}></span>
          </span>
        </button>
      </div>
    </Card>

    <!-- Onboarding progress -->
    <Card>
      <h2 class="section-title">
        <span class="material-symbols-outlined">checklist</span>
        Getting Started
      </h2>

      <div class="progress-header">
        <span class="progress-text">{completedCount} of {onboardingSteps.length} steps complete</span>
        <span class="progress-pct">{progressPct}%</span>
      </div>
      <div class="progress-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div class="progress-fill" style="width: {progressPct}%"></div>
      </div>

      <ul class="step-list">
        {#each onboardingSteps as step}
          <li class="step-item" class:step-done={data.steps[step.key]}>
            <span class="step-check material-symbols-outlined" aria-hidden="true">
              {data.steps[step.key] ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {#if data.steps[step.key]}
              <span class="step-label">{step.label}</span>
            {:else}
              <a href={step.href} class="step-label step-link">{step.label}</a>
            {/if}
            <span class="material-symbols-outlined step-icon" aria-hidden="true">{step.icon}</span>
          </li>
        {/each}
      </ul>
    </Card>

    <!-- Danger zone -->
    <Card class="danger-card">
      <h2 class="section-title section-title--danger">
        <span class="material-symbols-outlined">warning</span>
        Danger Zone
      </h2>

      <div class="danger-row">
        <div>
          <p class="danger-label">Delete Account</p>
          <p class="danger-desc">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <Button
          variant="danger"
          onclick={() => { deleteOpen = true; }}
        >
          {#snippet icon()}<span class="material-symbols-outlined">delete_forever</span>{/snippet}
          Delete Account
        </Button>
      </div>
    </Card>
  </div>
</div>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Account"
  message="This will permanently delete your account, campaigns, datasets, and all associated data. This action cannot be undone. Are you sure?"
  confirmLabel="Yes, delete my account"
  cancelLabel="Cancel"
  danger
  onConfirm={async () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '?/deleteAccount';
    document.body.appendChild(form);
    form.submit();
  }}
/>

<style>
  .settings-page {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header { margin-bottom: 0.25rem; }

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

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1.25rem;
  }

  .section-title .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  .section-title--danger { color: var(--color-error); }
  .section-title--danger .material-symbols-outlined { color: var(--color-error); }

  /* Avatar */
  .avatar-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border);
    flex-shrink: 0;
  }

  .avatar-placeholder {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--color-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-border);
    flex-shrink: 0;
  }

  .avatar-placeholder .material-symbols-outlined {
    font-size: 2rem;
    color: var(--color-text-subtle);
  }

  .avatar-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.125rem;
  }

  .avatar-email {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0 0 0.25rem;
  }

  .avatar-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
    margin: 0;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    margin-bottom: 1rem;
  }

  .alert--success {
    background: var(--color-success-light);
    color: var(--color-success);
  }

  .alert--error {
    background: var(--color-error-light);
    color: var(--color-error);
  }

  /* Form */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  :global(.save-btn) {
    margin-top: 0.25rem;
  }

  /* Preferences */
  .pref-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .pref-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .pref-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    transition: background var(--transition-fast);
  }

  .theme-toggle:hover {
    background: var(--color-bg-muted);
  }

  .theme-icon {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  .theme-label {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    min-width: 2.5rem;
  }

  .toggle-track {
    position: relative;
    width: 2.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    transition: background var(--transition-fast);
  }

  .theme-toggle[aria-pressed='true'] .toggle-track {
    background: var(--color-brand);
    border-color: var(--color-brand);
  }

  .toggle-thumb {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform var(--transition-fast);
  }

  .toggle-thumb.checked {
    transform: translateX(1rem);
  }

  /* Onboarding */
  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .progress-pct {
    font-weight: 600;
    color: var(--color-brand);
  }

  .progress-track {
    height: 6px;
    background: var(--color-bg-muted);
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 1.25rem;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-brand);
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  .step-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem;
    border-radius: var(--radius-md);
  }

  .step-check {
    font-size: 1.25rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
  }

  .step-done .step-check {
    color: var(--color-success);
  }

  .step-label {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .step-link {
    color: var(--color-brand);
    text-decoration: none;
  }

  .step-link:hover {
    text-decoration: underline;
  }

  .step-icon {
    font-size: 1.125rem;
    color: var(--color-text-subtle);
  }

  /* Danger zone */
  :global(.danger-card) {
    border-color: var(--color-error) !important;
  }

  .danger-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .danger-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text);
    margin: 0 0 0.25rem;
  }

  .danger-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
    max-width: 36rem;
  }
</style>
