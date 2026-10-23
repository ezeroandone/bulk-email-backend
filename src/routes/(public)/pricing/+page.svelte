<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const creditFaqs = [
    { q: 'What is a credit?', a: '1 credit = 1 email successfully accepted by your SMTP server. Credits are deducted after each individual email is dispatched, not when the campaign starts.' },
    { q: 'Do credits expire?', a: 'No. Credits never expire. You can purchase a pack today and use it three years from now. There are no monthly renewals or use-it-or-lose-it windows.' },
    { q: 'What counts as 1 credit?', a: 'Sending one email to one recipient costs exactly 1 credit, regardless of whether a document is attached. If an email fails after retries and is marked as failed, the credit is refunded.' },
    { q: 'Can I check my credit balance?', a: 'Yes. Your current balance is displayed in the top-right corner of every dashboard page. The billing page shows a full ledger of every credit earned, spent, and purchased.' },
    { q: 'What is the difference between available and reserved credits?', a: 'When a campaign is launched, the required credits are "reserved" (locked) to ensure there are enough to complete it. As each email is sent, reserved credits convert to "consumed". If the campaign is cancelled, reserved credits are released back to your available balance.' },
    { q: 'Can I get a refund for unused credits?', a: 'We do not offer cash refunds for unused credits. However, failed delivery credits are automatically refunded to your wallet so you can retry. Contact support if you believe credits were incorrectly deducted.' }
  ];

  let openFaq = $state<number | null>(null);

  function toggleFaq(i: number) {
    openFaq = openFaq === i ? null : i;
  }

  function formatPrice(kobo: number) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }

  function pricePerCredit(kobo: number, credits: number) {
    return '₦' + (kobo / 100 / credits).toFixed(2);
  }
</script>

<svelte:head>
  <title>Pricing — MergeMail</title>
  <meta name="description" content="MergeMail credit packages: buy once, never expire. 1 credit = 1 email sent. 100 free credits on signup — no card required." />
  <meta property="og:title" content="Pricing — MergeMail" />
  <meta property="og:description" content="Simple, transparent pricing. Buy the credits you need. No monthly subscriptions, no expiry." />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-16">
  <div class="text-center mb-6">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-4">Simple pricing</h1>
    <p class="text-xl text-neutral-600 max-w-2xl mx-auto">
      Buy credits once. Use them whenever. No subscriptions, no surprises.
    </p>
  </div>

  <div class="flex justify-center mb-10">
    <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100 text-green-800 font-medium text-sm shadow-sm">
      <span class="material-symbols-outlined" style="font-size:1rem">redeem</span>
      100 free credits on signup — no card required · credits don't renew monthly
    </span>
  </div>

  {#if data.packages.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {#each data.packages as pkg, i}
        <div class="relative p-7 rounded-2xl border-2 {i === 1 ? 'border-brand-500 shadow-lg' : 'border-neutral-200'} bg-white flex flex-col">
          {#if i === 1}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
              Most Popular
            </div>
          {/if}
          <h2 class="text-xl font-bold text-neutral-900 mb-1">{pkg.name}</h2>
          <div class="text-4xl font-extrabold text-brand-600 my-4">{formatPrice(pkg.price_kobo)}</div>
          <div class="flex items-center gap-2 text-neutral-700 mb-2">
            <span class="material-symbols-outlined text-brand-500" style="font-size:1.1rem">bolt</span>
            <span class="text-lg font-semibold">{pkg.credits.toLocaleString()}</span>
            <span class="text-sm text-neutral-500">credits</span>
          </div>
          <p class="text-sm text-neutral-500 mb-6">{pricePerCredit(pkg.price_kobo, pkg.credits)} per email sent</p>
          <div class="mt-auto">
            <a
              href="/login"
              class="block w-full py-3 px-4 rounded-xl {i === 1 ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'} font-semibold text-sm text-center transition-colors no-underline"
            >
              Buy Now
            </a>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-16 text-neutral-400 mb-16">
      <span class="material-symbols-outlined text-5xl block mb-4">price_check</span>
      <p>Credit packages are loading. <a href="/login" class="text-brand-600 no-underline hover:underline">Sign up</a> to see current pricing.</p>
    </div>
  {/if}

  <!-- How credits work -->
  <div class="mb-16">
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 text-center">How credits work</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
        <span class="material-symbols-outlined text-brand-600 text-4xl mb-3 block">bolt</span>
        <h3 class="font-semibold text-neutral-900 mb-2">1 credit = 1 email</h3>
        <p class="text-sm text-neutral-600">One email delivered to one recipient. Attachments are included — no extra charge.</p>
      </div>
      <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
        <span class="material-symbols-outlined text-brand-600 text-4xl mb-3 block">all_inclusive</span>
        <h3 class="font-semibold text-neutral-900 mb-2">Credits never expire</h3>
        <p class="text-sm text-neutral-600">Buy when you need them. There is no monthly renewal and no use-it-or-lose-it cutoff.</p>
      </div>
      <div class="p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
        <span class="material-symbols-outlined text-brand-600 text-4xl mb-3 block">undo</span>
        <h3 class="font-semibold text-neutral-900 mb-2">Failed sends are refunded</h3>
        <p class="text-sm text-neutral-600">If an email can't be delivered after retries, the credit is returned to your wallet automatically.</p>
      </div>
    </div>
  </div>

  <!-- Credit FAQ -->
  <div>
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 text-center">Credit FAQ</h2>
    <div class="space-y-3 max-w-3xl mx-auto">
      {#each creditFaqs as faq, i}
        <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-50 transition-colors"
            onclick={() => toggleFaq(i)}
            aria-expanded={openFaq === i}
          >
            <span class="font-medium text-neutral-900 pr-4">{faq.q}</span>
            <span class="material-symbols-outlined text-neutral-400 flex-shrink-0 transition-transform {openFaq === i ? 'rotate-180' : ''}">
              expand_more
            </span>
          </button>
          {#if openFaq === i}
            <div class="px-5 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">
              {faq.a}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
