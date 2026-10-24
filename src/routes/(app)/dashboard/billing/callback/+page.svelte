<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui';

  type PollStatus = 'loading' | 'success' | 'failed' | 'abandoned' | 'timeout';

  let status = $state<PollStatus>('loading');
  let credits = $state<number | null>(null);
  let reference = $state<string | null>(null);

  onMount(() => {
    reference = page.url.searchParams.get('reference');

    if (!reference) {
      status = 'failed';
      return;
    }

    const MAX_POLLS = 15; // 15 × 2s = 30s
    let polls = 0;

    const interval = setInterval(async () => {
      polls++;
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(reference!)}`);
        if (res.status === 404) {
          // Order doesn't exist yet — keep polling briefly
          if (polls >= MAX_POLLS) {
            clearInterval(interval);
            status = 'timeout';
          }
          return;
        }
        if (!res.ok) {
          clearInterval(interval);
          status = 'failed';
          return;
        }
        const data = await res.json() as {
          status?: string;
          credits?: number | null;
          reference?: string;
        };

        if (data.status === 'successful') {
          clearInterval(interval);
          credits = data.credits ?? null;
          status = 'success';
        } else if (data.status === 'failed') {
          clearInterval(interval);
          status = 'failed';
        } else if (data.status === 'abandoned') {
          clearInterval(interval);
          status = 'abandoned';
        } else if (polls >= MAX_POLLS) {
          clearInterval(interval);
          status = 'timeout';
        }
      } catch {
        if (polls >= MAX_POLLS) {
          clearInterval(interval);
          status = 'timeout';
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Payment — MergeMail</title>
</svelte:head>

<div class="callback-page">
  <div class="callback-card">

    {#if status === 'loading'}
      <span class="material-symbols-outlined spin icon icon--loading">progress_activity</span>
      <h1 class="callback-title">Confirming your payment…</h1>
      <p class="callback-body">Please wait while we verify your transaction with Paystack.</p>

    {:else if status === 'success'}
      <span class="material-symbols-outlined icon icon--success">check_circle</span>
      <h1 class="callback-title">Payment Successful!</h1>
      {#if credits != null}
        <p class="callback-body">
          <strong>{credits.toLocaleString()} credits</strong> have been added to your wallet.
        </p>
      {:else}
        <p class="callback-body">Your credits have been added to your wallet.</p>
      {/if}
      <div class="callback-actions">
        <Button href="/dashboard/billing">Back to Billing</Button>
        {#if reference}
          <Button variant="secondary" href="/dashboard/billing/receipt/{reference}">
            View Receipt
          </Button>
        {/if}
      </div>

    {:else if status === 'failed'}
      <span class="material-symbols-outlined icon icon--error">cancel</span>
      <h1 class="callback-title">Payment Failed</h1>
      <p class="callback-body">Your transaction could not be completed. No charges were made.</p>
      <div class="callback-actions">
        <Button href="/dashboard/billing">Back to Billing</Button>
      </div>

    {:else if status === 'abandoned'}
      <span class="material-symbols-outlined icon icon--warn">do_not_disturb_on</span>
      <h1 class="callback-title">Payment Cancelled</h1>
      <p class="callback-body">You cancelled the payment. No charges were made.</p>
      <div class="callback-actions">
        <Button href="/dashboard/billing">Back to Billing</Button>
      </div>

    {:else}
      <!-- timeout -->
      <span class="material-symbols-outlined icon icon--warn">hourglass_disabled</span>
      <h1 class="callback-title">Still Checking…</h1>
      <p class="callback-body">
        We couldn't confirm your payment in time. If you completed the payment, your credits will
        appear shortly. Check your wallet in a few minutes.
      </p>
      <div class="callback-actions">
        <Button href="/dashboard/billing">Back to Billing</Button>
        {#if reference}
          <Button variant="secondary" href="/dashboard/billing/receipt/{reference}">
            View Receipt
          </Button>
        {/if}
      </div>
    {/if}

  </div>
</div>

<style>
  .callback-page {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .callback-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 3rem 2.5rem;
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }

  .icon {
    font-size: 4rem;
  }

  .icon--loading { color: var(--color-brand); }
  .icon--success { color: var(--color-success); }
  .icon--error   { color: var(--color-error); }
  .icon--warn    { color: var(--color-warning); }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spin { display: inline-block; animation: spin 1s linear infinite; }

  .callback-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .callback-body {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.6;
  }

  .callback-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.5rem;
  }
</style>
