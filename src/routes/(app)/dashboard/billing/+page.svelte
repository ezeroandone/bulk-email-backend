<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Badge, Pagination } from '$lib/components/ui';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let wallet = $derived(data.wallet);

  function formatNGN(kobo: number): string {
    const naira = kobo / 100;
    return '₦' + naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatCredits(n: number): string {
    return n.toLocaleString();
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed' | 'cancelled';
  const statusVariant: Record<PaymentStatus, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending:   'warning',
    success:   'success',
    failed:    'error',
    abandoned: 'neutral',
    reversed:  'warning',
    cancelled: 'neutral'
  };

  type LedgerType = string;
  const ledgerLabel: Record<string, string> = {
    signup_bonus:     'Signup Bonus',
    purchase:         'Purchase',
    campaign_debit:   'Campaign',
    refund:           'Refund',
    admin_adjustment: 'Adjustment',
    expiry:           'Expiry'
  };

  let buyingId = $state<string | null>(null);
</script>

<svelte:head>
  <title>Billing — MergeMail</title>
</svelte:head>

<div class="billing-page">
  <div class="page-header">
    <h1 class="page-title">Billing & Credits</h1>
    <p class="page-subtitle">Manage your credit balance and purchase history.</p>
  </div>

  {#if form?.message}
    <div class="alert alert--error" role="alert">
      <span class="material-symbols-outlined">error</span>
      {form.message}
    </div>
  {/if}

  <!-- Wallet Card -->
  <Card class="wallet-card">
    <h2 class="wallet-title">
      <span class="material-symbols-outlined">account_balance_wallet</span>
      Your Wallet
    </h2>
    <div class="wallet-stats">
      <div class="wallet-stat">
        <p class="wallet-stat-label">Available</p>
        <p class="wallet-stat-value wallet-stat-value--main">
          {formatCredits(wallet?.available_credits ?? 0)}
        </p>
      </div>
      <div class="wallet-stat-divider"></div>
      <div class="wallet-stat">
        <p class="wallet-stat-label">Reserved</p>
        <p class="wallet-stat-value">{formatCredits(wallet?.reserved_credits ?? 0)}</p>
      </div>
      <div class="wallet-stat-divider"></div>
      <div class="wallet-stat">
        <p class="wallet-stat-label">Total Purchased</p>
        <p class="wallet-stat-value">{formatCredits(wallet?.total_purchased ?? 0)}</p>
      </div>
      <div class="wallet-stat-divider"></div>
      <div class="wallet-stat">
        <p class="wallet-stat-label">Total Consumed</p>
        <p class="wallet-stat-value">{formatCredits(wallet?.total_consumed ?? 0)}</p>
      </div>
    </div>
  </Card>

  <!-- Credit Packages -->
  <div class="section">
    <h2 class="section-title">
      <span class="material-symbols-outlined">redeem</span>
      Buy Credits
    </h2>

    {#if data.packages.length === 0}
      <Card>
        <p class="no-packages">No credit packages available at this time. Check back soon.</p>
      </Card>
    {:else}
      <div class="packages-grid">
        {#each data.packages as pkg (pkg.id)}
          <Card class="package-card" hover>
            <div class="package-inner">
              <div class="package-credits">
                <span class="material-symbols-outlined package-icon">toll</span>
                <p class="package-credits-value">{formatCredits(pkg.credits)}</p>
                <p class="package-credits-label">credits</p>
              </div>
              <h3 class="package-name">{pkg.name}</h3>
              <p class="package-price">{formatNGN(pkg.price_kobo)}</p>
              <p class="package-rate">
                {formatNGN(Math.round(pkg.price_kobo / pkg.credits * 100))} / 100 credits
              </p>

              <form
                method="POST"
                action="?/buyCredits"
                use:enhance={() => {
                  buyingId = pkg.id;
                  return async ({ update }) => {
                    buyingId = null;
                    await update();
                  };
                }}
              >
                <input type="hidden" name="package_id" value={pkg.id} />
                <Button type="submit" class="buy-btn" loading={buyingId === pkg.id}>
                  Buy Now
                </Button>
              </form>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Purchase History -->
  <div class="section">
    <h2 class="section-title">
      <span class="material-symbols-outlined">receipt_long</span>
      Purchase History
    </h2>

    {#if data.purchases.length === 0}
      <Card>
        <div class="empty-state">
          <span class="material-symbols-outlined empty-icon">receipt_long</span>
          <p>No purchases yet.</p>
        </div>
      </Card>
    {:else}
      <Card>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Package</th>
                <th scope="col">Credits</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Reference</th>
              </tr>
            </thead>
            <tbody>
              {#each data.purchases as p}
                <tr>
                  <td class="date-col">{fmtDate(p.created_at)}</td>
                  <td>{p.package_name ?? '—'}</td>
                  <td class="num-col">{formatCredits(p.credits ?? 0)}</td>
                  <td class="num-col">{formatNGN(p.amount_kobo ?? 0)}</td>
                  <td>
                    <Badge variant={statusVariant[p.status as PaymentStatus] ?? 'neutral'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td class="ref-col">
                    {#if p.paystack_reference}
                      <code class="ref">{p.paystack_reference}</code>
                    {:else}—{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if data.totalPurchases > 20}
          <div class="pagination-row">
            <Pagination
              page={data.historyPage}
              pageSize={20}
              total={data.totalPurchases}
              onPageChange={(p) => {
                const url = new URL(window.location.href);
                url.searchParams.set('history_page', String(p));
                window.location.href = url.toString();
              }}
            />
          </div>
        {/if}
      </Card>
    {/if}
  </div>

  <!-- Ledger -->
  <div class="section">
    <h2 class="section-title">
      <span class="material-symbols-outlined">account_balance</span>
      Credit Ledger
    </h2>

    {#if data.ledger.length === 0}
      <Card>
        <div class="empty-state">
          <span class="material-symbols-outlined empty-icon">account_balance</span>
          <p>No ledger entries yet.</p>
        </div>
      </Card>
    {:else}
      <Card>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col">Amount</th>
                <th scope="col">Balance After</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {#each data.ledger as entry}
                <tr>
                  <td class="date-col">{fmtDate(entry.created_at)}</td>
                  <td>{ledgerLabel[entry.type as LedgerType] ?? entry.type}</td>
                  <td class="num-col" class:credit-pos={entry.amount > 0} class:credit-neg={entry.amount < 0}>
                    {entry.amount > 0 ? '+' : ''}{formatCredits(entry.amount)}
                  </td>
                  <td class="num-col">{formatCredits(entry.balance_after)}</td>
                  <td class="desc-col">{entry.description ?? '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if data.totalLedger > 20}
          <div class="pagination-row">
            <Pagination
              page={data.ledgerPage}
              pageSize={20}
              total={data.totalLedger}
              onPageChange={(p) => {
                const url = new URL(window.location.href);
                url.searchParams.set('ledger_page', String(p));
                window.location.href = url.toString();
              }}
            />
          </div>
        {/if}
      </Card>
    {/if}
  </div>
</div>

<style>
  .billing-page {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .page-header { margin-bottom: -0.5rem; }

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

  .alert--error { background: var(--color-error-light); color: var(--color-error); }

  /* Wallet card */
  :global(.wallet-card) { padding: 1.5rem !important; }

  .wallet-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 1.25rem;
  }

  .wallet-title .material-symbols-outlined {
    color: var(--color-brand);
  }

  .wallet-stats {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .wallet-stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .wallet-stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .wallet-stat-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text-muted);
    margin: 0;
  }

  .wallet-stat-value--main {
    color: var(--color-text);
  }

  .wallet-stat-divider {
    width: 1px;
    height: 2.5rem;
    background: var(--color-border);
    flex-shrink: 0;
  }

  /* Sections */
  .section { display: flex; flex-direction: column; gap: 1rem; }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .section-title .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-text-muted);
  }

  /* Packages */
  .packages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  :global(.package-card) { height: 100%; }

  .package-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .package-credits {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .package-icon {
    font-size: 2.5rem;
    color: var(--color-brand);
  }

  .package-credits-value {
    font-size: var(--font-size-3xl, 1.875rem);
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
    line-height: 1;
  }

  .package-credits-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .package-name {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0.25rem 0 0;
  }

  .package-price {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .package-rate {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  :global(.buy-btn) {
    width: 100%;
    margin-top: 0.5rem;
  }

  .no-packages {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  /* Tables */
  .table-scroll { overflow-x: auto; }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .data-table th {
    padding: 0.625rem 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .data-table td {
    padding: 0.75rem;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover td { background: var(--color-bg-subtle); }

  .date-col { white-space: nowrap; color: var(--color-text-muted); }
  .num-col  { text-align: right; font-variant-numeric: tabular-nums; }
  .desc-col { color: var(--color-text-muted); max-width: 20rem; }
  .ref-col  { font-size: var(--font-size-xs); }

  .ref {
    font-family: monospace;
    background: var(--color-bg-muted);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
  }

  .credit-pos { color: var(--color-success); font-weight: 500; }
  .credit-neg { color: var(--color-error);   font-weight: 500; }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem;
    gap: 0.5rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    color: var(--color-text-subtle);
  }

  .pagination-row {
    display: flex;
    justify-content: center;
    padding: 1rem 0 0.25rem;
  }
</style>
