<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Card, Button, ProgressBar } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // ── State ──────────────────────────────────────────────────────────────────

  let currentStep = $state(data.onboardingDone ? 5 : (data.onboardingStep ?? 0));
  let saving = $state(false);

  const TOTAL_STEPS = 6; // steps 0–5

  interface OnboardingStep {
    title: string;
    icon: string;
    description: string;
    cta: { label: string; href: string; icon: string } | null;
  }

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to MergeMail',
      icon: 'waving_hand',
      description: 'MergeMail lets you send personalised emails with custom attachments to large lists of recipients — all from one place. This guide will walk you through the key features in a few minutes.',
      cta: null
    },
    {
      title: 'Credits',
      icon: 'toll',
      description: 'Each email you send costs one credit. You received 100 free credits to get started. Buy more credits any time from the billing page. Credits never expire.',
      cta: { label: 'View billing', href: '/dashboard/billing', icon: 'payments' }
    },
    {
      title: 'Connect your email',
      icon: 'mail_lock',
      description: 'Add your SMTP credentials so MergeMail can send emails on your behalf. We support Gmail, Outlook, SendGrid, Postmark, and any SMTP provider.',
      cta: { label: 'Add SMTP config', href: '/dashboard/settings/smtp', icon: 'settings' }
    },
    {
      title: 'Upload a spreadsheet',
      icon: 'table',
      description: 'Upload an Excel or CSV file with your recipients\' data. MergeMail will auto-detect columns and let you map them to your email template variables.',
      cta: { label: 'Upload spreadsheet', href: '/dashboard/datasets/new', icon: 'upload_file' }
    },
    {
      title: 'Upload documents',
      icon: 'folder_zip',
      description: 'Optionally upload a ZIP of PDFs or a DOCX/PDF template to attach personalised documents to each email.',
      cta: { label: 'Upload template', href: '/dashboard/templates/new', icon: 'upload' }
    },
    {
      title: 'Create your first campaign',
      icon: 'rocket_launch',
      description: 'You\'re ready! Start a new campaign and use the step-by-step wizard to compose your email, map variables, preview, and launch.',
      cta: { label: 'New campaign', href: '/dashboard/campaigns/new', icon: 'add' }
    }
  ];

  const progress = $derived(Math.round((currentStep / (TOTAL_STEPS - 1)) * 100));
  const isDone = $derived(currentStep >= TOTAL_STEPS - 1);

  async function saveStep(step: number, done = false) {
    saving = true;
    try {
      const fd = new FormData();
      fd.set('step', String(step));
      fd.set('done', done ? 'true' : 'false');
      await fetch('?/saveStep', { method: 'POST', body: fd });
    } catch {
      // non-fatal
    } finally {
      saving = false;
    }
  }

  function next() {
    if (currentStep < TOTAL_STEPS - 1) {
      currentStep += 1;
      saveStep(currentStep, currentStep === TOTAL_STEPS - 1);
    }
  }

  function skip() {
    currentStep = TOTAL_STEPS - 1;
    saveStep(TOTAL_STEPS - 1, true);
  }

  async function finish() {
    await saveStep(TOTAL_STEPS - 1, true);
    goto('/dashboard');
  }

  const currentStepData = $derived(steps[currentStep] ?? steps[0]);
</script>

<svelte:head>
  <title>Getting Started — MergeMail</title>
</svelte:head>

<div class="onboarding-page">
  <div class="onboarding-header">
    <div>
      <h1 class="page-title">Getting Started</h1>
      <p class="page-subtitle">Complete these steps to set up your account.</p>
    </div>
    <button type="button" class="skip-all-btn" onclick={skip} disabled={isDone}>
      Skip all
    </button>
  </div>

  <!-- Progress bar -->
  <div class="progress-section">
    <ProgressBar value={progress} max={100} label="Onboarding progress" />
    <span class="progress-label">Step {currentStep + 1} of {TOTAL_STEPS}</span>
  </div>

  <!-- Step tabs -->
  <div class="step-tabs" role="tablist" aria-label="Onboarding steps">
    {#each steps as s, i}
      <button
        role="tab"
        class="step-tab"
        class:active={i === currentStep}
        class:done={i < currentStep}
        aria-selected={i === currentStep}
        aria-label="Step {i + 1}: {s.title}"
        onclick={() => { if (i <= currentStep) currentStep = i; }}
      >
        {#if i < currentStep}
          <span class="material-symbols-outlined tab-icon done" aria-hidden="true">check_circle</span>
        {:else}
          <span class="material-symbols-outlined tab-icon" class:active={i === currentStep} aria-hidden="true">{s.icon}</span>
        {/if}
        <span class="tab-label">{s.title}</span>
      </button>
    {/each}
  </div>

  <!-- Current step card -->
  <Card padding="lg">
    <div class="step-card">
      <div class="step-icon-wrap" class:done={isDone && currentStep === TOTAL_STEPS - 1}>
        <span class="material-symbols-outlined step-big-icon" aria-hidden="true">
          {currentStepData.icon}
        </span>
      </div>

      <div class="step-body">
        <h2 class="step-title">{currentStepData.title}</h2>
        <p class="step-desc">{currentStepData.description}</p>

        {#if currentStepData.cta}
          <a href={currentStepData.cta.href} class="step-cta">
            <span class="material-symbols-outlined" aria-hidden="true">{currentStepData.cta.icon}</span>
            {currentStepData.cta.label}
          </a>
        {/if}
      </div>

      <div class="step-actions">
        {#if !isDone}
          <button type="button" class="skip-step-btn" onclick={skip} disabled={saving}>
            Skip remaining steps
          </button>
          <Button variant="primary" onclick={next} loading={saving}>
            {#snippet icon()}<span class="material-symbols-outlined">arrow_forward</span>{/snippet}
            {#snippet children()}
              {currentStep < TOTAL_STEPS - 2 ? 'Next step' : 'Finish'}
            {/snippet}
          </Button>
        {:else}
          <div class="done-state">
            <span class="material-symbols-outlined done-check" aria-hidden="true">task_alt</span>
            <p class="done-text">All steps complete! You're ready to send your first campaign.</p>
          </div>
          <Button variant="primary" onclick={finish} loading={saving}>
            {#snippet icon()}<span class="material-symbols-outlined">dashboard</span>{/snippet}
            {#snippet children()}Go to Dashboard{/snippet}
          </Button>
        {/if}
      </div>
    </div>
  </Card>

  <!-- Quick links -->
  <div class="quick-links">
    <p class="quick-links-title">Quick links</p>
    <div class="quick-links-grid">
      <a href="/dashboard/campaigns/new" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
        New campaign
      </a>
      <a href="/dashboard/datasets/new" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
        Upload spreadsheet
      </a>
      <a href="/dashboard/settings/smtp" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">mail_lock</span>
        SMTP settings
      </a>
      <a href="/dashboard/billing" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">payments</span>
        Buy credits
      </a>
    </div>
  </div>
</div>

<style>
  .onboarding-page {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .onboarding-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-title { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; }
  .page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

  .skip-all-btn {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }

  .skip-all-btn:hover:not(:disabled) { color: var(--color-text); border-color: var(--color-border-strong); }
  .skip-all-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Progress */
  .progress-section { display: flex; align-items: center; gap: 1rem; }
  .progress-section :global(.progress-bar) { flex: 1; }
  .progress-label { font-size: var(--font-size-sm); color: var(--color-text-muted); white-space: nowrap; }

  /* Step tabs */
  .step-tabs {
    display: flex;
    gap: 0;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-subtle);
    padding: 0.25rem;
  }

  .step-tab {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .step-tab.active {
    background: var(--color-surface);
    color: var(--color-brand);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .step-tab.done { color: var(--color-success); }
  .step-tab:hover:not(.active) { background: var(--color-bg-muted); color: var(--color-text); }

  .tab-icon { font-size: 1.125rem; }
  .tab-icon.active { color: var(--color-brand); }
  .tab-icon.done { color: var(--color-success); }
  .tab-label { font-size: var(--font-size-sm); }

  /* Step card */
  .step-card {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .step-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    background: var(--color-brand-light);
    border-radius: 50%;
    margin: 0 auto;
    transition: background var(--transition-fast);
  }

  .step-icon-wrap.done { background: var(--color-success-light); }

  .step-big-icon { font-size: 2.5rem; color: var(--color-brand); }
  .step-icon-wrap.done .step-big-icon { color: var(--color-success); }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .step-title { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text); margin: 0; }
  .step-desc { font-size: var(--font-size-base); color: var(--color-text-muted); line-height: 1.6; margin: 0; max-width: 540px; align-self: center; }

  .step-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1.125rem;
    background: var(--color-brand-light);
    color: var(--color-brand);
    border: 1px solid var(--color-brand);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-decoration: none;
    align-self: center;
    transition: background var(--transition-fast);
  }

  .step-cta:hover { background: var(--color-brand); color: var(--color-text-inverse); }
  .step-cta .material-symbols-outlined { font-size: 1.125rem; }

  /* Actions */
  .step-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .skip-step-btn {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0.375rem 0.5rem;
    transition: color var(--transition-fast);
  }

  .skip-step-btn:hover:not(:disabled) { color: var(--color-text); }
  .skip-step-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Done state */
  .done-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .done-check { font-size: 1.5rem; color: var(--color-success); }
  .done-text { font-size: var(--font-size-sm); color: var(--color-text); margin: 0; }

  /* Quick links */
  .quick-links { display: flex; flex-direction: column; gap: 0.75rem; }
  .quick-links-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
  .quick-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .quick-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-decoration: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .quick-link:hover {
    border-color: var(--color-brand);
    box-shadow: var(--shadow-sm);
    color: var(--color-brand);
  }

  .quick-link .material-symbols-outlined { font-size: 1.25rem; color: var(--color-brand); flex-shrink: 0; }
</style>
