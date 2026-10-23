<script lang="ts">
  import { Button } from '$lib/components/ui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatNGN(kobo: number): string {
    const naira = kobo / 100;
    return '₦' + naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const statusLabel: Record<string, string> = {
    pending:    'Pending',
    successful: 'Paid',
    failed:     'Failed',
    abandoned:  'Abandoned',
    cancelled:  'Cancelled',
    reversed:   'Reversed'
  };
</script>

<svelte:head>
  <title>Receipt {data.reference} — MergeMail</title>
</svelte:head>

<div class="receipt-page">
  <!-- Back + Print (hidden when printing) -->
  <div class="receipt-actions no-print">
    <Button variant="secondary" href="/dashboard/billing">
      <span class="material-symbols-outlined">arrow_back</span>
      Back to Billing
    </Button>
    <Button onclick={() => window.print()}>
      <span class="material-symbols-outlined">print</span>
      Print Receipt
    </Button>
  </div>

  <!-- Printable receipt -->
  <div class="receipt" id="receipt">
    <div class="receipt-header">
      <div class="receipt-brand">
        <span class="material-symbols-outlined brand-icon">mail</span>
        <span class="brand-name">MergeMail</span>
      </div>
      <h1 class="receipt-title">Payment Receipt</h1>
    </div>

    <div class="receipt-status" class:status--paid={data.status === 'successful'} class:status--fail={data.status === 'failed'}>
      <span class="material-symbols-outlined status-icon">
        {data.status === 'successful' ? 'check_circle' : 'cancel'}
      </span>
      <span class="status-label">{statusLabel[data.status] ?? data.status}</span>
    </div>

    <dl class="receipt-fields">
      <div class="receipt-row">
        <dt>Reference</dt>
        <dd><code class="ref">{data.reference}</code></dd>
      </div>
      <div class="receipt-row">
        <dt>Package</dt>
        <dd>{data.packageName}</dd>
      </div>
      <div class="receipt-row">
        <dt>Credits</dt>
        <dd>{data.credits.toLocaleString()} credits</dd>
      </div>
      <div class="receipt-row receipt-row--amount">
        <dt>Amount</dt>
        <dd class="amount">{formatNGN(data.amountKobo)}</dd>
      </div>
      <div class="receipt-row">
        <dt>Date</dt>
        <dd>{fmtDate(data.createdAt)}</dd>
      </div>
      {#if data.fulfilledAt}
        <div class="receipt-row">
          <dt>Fulfilled</dt>
          <dd>{fmtDate(data.fulfilledAt)}</dd>
        </div>
      {/if}
      <div class="receipt-row">
        <dt>Status</dt>
        <dd>{statusLabel[data.status] ?? data.status}</dd>
      </div>
    </dl>

    <div class="receipt-footer">
      <p>Thank you for using MergeMail.</p>
      <p class="receipt-footer-sub">For support, visit mergemail.app/support</p>
    </div>
  </div>
</div>

<style>
  .receipt-page {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .receipt-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .receipt-actions :global(.material-symbols-outlined) {
    font-size: 1.1rem;
    margin-right: 0.25rem;
    vertical-align: text-bottom;
  }

  .receipt {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  /* Header */
  .receipt-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .receipt-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-icon {
    font-size: 1.75rem;
    color: var(--color-brand);
  }

  .brand-name {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text);
  }

  .receipt-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  /* Status badge */
  .receipt-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full, 9999px);
    font-size: var(--font-size-sm);
    font-weight: 600;
    background: var(--color-bg-subtle);
    color: var(--color-text-muted);
    width: fit-content;
  }

  .receipt-status.status--paid {
    background: var(--color-success-light, #f0fdf4);
    color: var(--color-success);
  }

  .receipt-status.status--fail {
    background: var(--color-error-light, #fef2f2);
    color: var(--color-error);
  }

  .status-icon { font-size: 1.25rem; }

  /* Fields */
  .receipt-fields {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
    gap: 1rem;
  }

  .receipt-row:last-child { border-bottom: none; }

  .receipt-row--amount {
    background: var(--color-bg-subtle);
    font-weight: 600;
  }

  .receipt-row dt {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: 500;
    white-space: nowrap;
  }

  .receipt-row dd {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    margin: 0;
    text-align: right;
  }

  .amount {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
  }

  .ref {
    font-family: monospace;
    font-size: var(--font-size-xs);
    background: var(--color-bg-muted);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
  }

  /* Footer */
  .receipt-footer {
    border-top: 1px solid var(--color-border);
    padding-top: 1.25rem;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .receipt-footer p { margin: 0; }
  .receipt-footer-sub { font-size: var(--font-size-xs); }

  /* Print styles */
  @media print {
    .no-print { display: none !important; }

    .receipt-page {
      max-width: 100%;
      margin: 0;
    }

    .receipt {
      border: none;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
    }

    .receipt-status.status--paid {
      background: #f0fdf4;
      color: #166534;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-status.status--fail {
      background: #fef2f2;
      color: #991b1b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
