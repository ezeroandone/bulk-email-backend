<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const steps = [
    { icon: 'table_chart', title: 'Upload Spreadsheet', desc: 'Upload your XLSX or CSV file. MergeMail parses it instantly and normalizes column names.' },
    { icon: 'auto_fix_high', title: 'Map & Generate', desc: 'Map spreadsheet columns to your template placeholders. Generate personalized documents in one click.' },
    { icon: 'send', title: 'Send & Track', desc: 'Connect your SMTP provider and launch the campaign. Track delivery status for every recipient in real time.' }
  ];

  const features = [
    { icon: 'campaign', title: 'Bulk Email Campaigns', desc: 'Send thousands of personalized emails through your own SMTP server. Full control over sending rate and content.' },
    { icon: 'description', title: 'Document Generation', desc: 'Generate DOCX and PDF documents from templates with per-recipient variable substitution — attach them automatically.' },
    { icon: 'merge', title: 'Mail Merge', desc: 'Merge spreadsheet data into email subject lines and bodies. Every message feels written by hand.' },
    { icon: 'mail', title: 'SMTP Integration', desc: 'Use Gmail, Outlook, Zoho, Amazon SES, Mailgun, or any SMTP server you control.' },
    { icon: 'monetization_on', title: 'Credit System', desc: '1 credit = 1 email sent. Buy only what you need. Credits never expire and have no monthly renewal.' },
    { icon: 'analytics', title: 'Real-time Tracking', desc: 'Watch campaign progress live. See sent, failed, and pending counts update as each email is dispatched.' }
  ];

  const useCases = [
    { title: 'Certificate Delivery', desc: 'Schools and NGOs sending personalized certificates to graduates or participants.' },
    { title: 'Membership Notifications', desc: 'Associations and clubs reminding members when subscriptions are due for renewal.' },
    { title: 'Event Invitations', desc: 'Conferences and webinars sending tailored invitations with unique links or access codes.' },
    { title: 'Application Updates', desc: 'HR teams and admissions offices delivering personalized acceptance or rejection decisions.' }
  ];

  const faqs = [
    { q: 'What is MergeMail?', a: 'MergeMail is a SaaS platform that lets you upload a spreadsheet, design an email or document template, and send personalized bulk emails with per-recipient attachments — all without writing code.' },
    { q: 'How do credits work?', a: 'Each email you successfully send costs 1 credit. Credits are purchased in packages (see pricing below) and never expire. You can check your balance at any time from the dashboard.' },
    { q: 'Do credits renew monthly?', a: 'No. Credits do not renew monthly. You purchase a pack once and the credits remain until you use them, regardless of when that is.' },
    { q: 'Do I need to use my own email server?', a: 'Yes. MergeMail routes mail through your own SMTP credentials (Gmail app password, Amazon SES, Mailgun, etc.). This keeps your sender reputation under your control.' },
    { q: 'What file formats are supported?', a: 'Spreadsheets: XLSX and CSV. Document templates: DOCX (Word) and PDF (form-field-based). Existing document uploads: ZIP archives of PDFs or DOCX files.' },
    { q: 'How do I create a template?', a: 'In DOCX templates, wrap variable names in double curly braces: {{first_name}}. In PDF templates, create form fields with the same names as your spreadsheet columns.' },
    { q: 'Is my data safe?', a: 'All data is stored in Supabase with Row Level Security enabled, meaning your data is isolated from other users. Uploaded files are stored in private buckets accessible only to you.' },
    { q: 'What happens if an email fails?', a: 'Failed deliveries are logged with the SMTP error message. You can review the campaign report to see which recipients did not receive their email and why.' }
  ];

  let openFaq = $state<number | null>(null);

  function toggleFaq(i: number) {
    openFaq = openFaq === i ? null : i;
  }

  function formatPrice(kobo: number) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }
</script>

<svelte:head>
  <title>MergeMail — Personalized Bulk Email & Document Generation</title>
  <meta name="description" content="Turn spreadsheets and document templates into personalized emails and attachments in minutes. No repetitive editing, no manual sending." />
  <meta property="og:title" content="MergeMail — Personalized Bulk Email & Document Generation" />
  <meta property="og:description" content="Upload a spreadsheet, design a template, send personalized emails to every recipient — with per-person attachments." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://mergemail.app" />
</svelte:head>

<!-- Hero -->
<section class="bg-gradient-to-br from-brand-50 via-white to-indigo-50 py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-tight mb-6">
      Personalize. Generate. Send.<br class="hidden sm:block" />
      <span class="text-brand-600">All in One Place.</span>
    </h1>
    <p class="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
      Turn spreadsheets and document templates into personalized emails and attachments in minutes.
      No repetitive editing, no manual sending.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href="/login"
        class="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition-colors no-underline shadow-md"
      >
        <span class="material-symbols-outlined">rocket_launch</span>
        Get Started Free
      </a>
      <a
        href="#how-it-works"
        class="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-semibold text-lg hover:bg-neutral-50 transition-colors no-underline"
      >
        <span class="material-symbols-outlined">play_circle</span>
        See How It Works
      </a>
    </div>
    <p class="mt-4 text-sm text-neutral-500">100 free credits on signup · No credit card required</p>
  </div>
</section>

<!-- How It Works -->
<section id="how-it-works" class="py-20 px-4 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-3">How It Works</h2>
      <p class="text-neutral-600 max-w-xl mx-auto">Three steps from spreadsheet to inbox.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each steps as step, i}
        <div class="relative flex flex-col items-center text-center p-6 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-brand-300 hover:bg-brand-50 transition-colors">
          <div class="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">{step.icon}</span>
          </div>
          <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shadow">
            {i + 1}
          </div>
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">{step.title}</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">{step.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Dashboard Preview -->
<section class="py-16 px-4 bg-neutral-50">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">Built for clarity</h2>
      <p class="text-neutral-600">Every campaign, every recipient, every credit — visible at a glance.</p>
    </div>
    <!-- SVG wireframe of dashboard -->
    <div class="rounded-xl border border-neutral-300 shadow-lg overflow-hidden bg-white">
      <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto" aria-label="Dashboard preview wireframe">
        <!-- Sidebar -->
        <rect x="0" y="0" width="180" height="520" fill="#f4f4f5"/>
        <rect x="20" y="20" width="140" height="28" rx="6" fill="#6366f1" opacity="0.15"/>
        <rect x="20" y="64" width="140" height="20" rx="4" fill="#e4e4e7"/>
        <rect x="20" y="92" width="140" height="20" rx="4" fill="#e4e4e7"/>
        <rect x="20" y="120" width="140" height="20" rx="4" fill="#6366f1" opacity="0.2"/>
        <rect x="20" y="148" width="140" height="20" rx="4" fill="#e4e4e7"/>
        <rect x="20" y="176" width="140" height="20" rx="4" fill="#e4e4e7"/>
        <rect x="20" y="204" width="140" height="20" rx="4" fill="#e4e4e7"/>
        <!-- Top bar -->
        <rect x="180" y="0" width="720" height="48" fill="#ffffff" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="200" y="14" width="200" height="20" rx="4" fill="#f4f4f5"/>
        <rect x="780" y="12" width="100" height="24" rx="12" fill="#6366f1" opacity="0.15"/>
        <!-- Stats cards -->
        <rect x="200" y="68" width="155" height="80" rx="8" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="375" y="68" width="155" height="80" rx="8" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="550" y="68" width="155" height="80" rx="8" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="725" y="68" width="155" height="80" rx="8" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="215" y="85" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="215" y="108" width="50" height="22" rx="4" fill="#6366f1" opacity="0.3"/>
        <rect x="390" y="85" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="390" y="108" width="60" height="22" rx="4" fill="#6366f1" opacity="0.3"/>
        <rect x="565" y="85" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="565" y="108" width="40" height="22" rx="4" fill="#6366f1" opacity="0.3"/>
        <rect x="740" y="85" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="740" y="108" width="70" height="22" rx="4" fill="#22c55e" opacity="0.3"/>
        <!-- Table -->
        <rect x="200" y="170" width="680" height="300" rx="8" fill="#ffffff" stroke="#e4e4e7" stroke-width="1"/>
        <rect x="200" y="170" width="680" height="40" rx="8" fill="#f4f4f5"/>
        {#each [0, 1, 2, 3, 4] as row}
          <rect x="220" y={222 + row * 44} width="100" height="14" rx="3" fill="#e4e4e7"/>
          <rect x="360" y={222 + row * 44} width="180" height="14" rx="3" fill="#e4e4e7"/>
          <rect x="580" y={222 + row * 44} width="80" height="14" rx="3" fill="#e4e4e7"/>
          <rect x="700" y={218 + row * 44} width="60" height="20" rx="10" fill={row === 0 ? '#dcfce7' : row === 1 ? '#fef9c3' : '#f4f4f5'}/>
        {/each}
        <rect x="215" y="183" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="355" y="183" width="100" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="555" y="183" width="80" height="14" rx="3" fill="#d4d4d8"/>
        <rect x="695" y="183" width="80" height="14" rx="3" fill="#d4d4d8"/>
      </svg>
    </div>
  </div>
</section>

<!-- Features Grid -->
<section class="py-20 px-4 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-3">Everything you need</h2>
      <p class="text-neutral-600 max-w-xl mx-auto">From data upload to delivered attachment, MergeMail handles the whole pipeline.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each features as feat}
        <div class="p-6 rounded-xl border border-neutral-200 hover:border-brand-300 hover:shadow-md transition-all">
          <div class="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-brand-600" style="font-size:1.5rem">{feat.icon}</span>
          </div>
          <h3 class="text-base font-semibold text-neutral-900 mb-2">{feat.title}</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">{feat.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Use Cases -->
<section class="py-20 px-4 bg-brand-50">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-3">Real-world use cases</h2>
      <p class="text-neutral-600">Teams across industries save hours every week with MergeMail.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each useCases as uc}
        <div class="p-6 rounded-xl bg-white border border-neutral-200 hover:shadow-md transition-all">
          <h3 class="text-base font-semibold text-neutral-900 mb-2">{uc.title}</h3>
          <p class="text-sm text-neutral-600 leading-relaxed">{uc.desc}</p>
          <a href="/use-cases" class="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 no-underline font-medium">
            Learn more <span class="material-symbols-outlined" style="font-size:1rem">arrow_forward</span>
          </a>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Pricing -->
<section class="py-20 px-4 bg-white" id="pricing">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-4">
      <h2 class="text-3xl font-bold text-neutral-900 mb-3">Simple, credit-based pricing</h2>
      <p class="text-neutral-600 max-w-xl mx-auto">Buy credits once. Use them whenever. No monthly bills, no surprises.</p>
    </div>
    <div class="mb-8 text-center">
      <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
        <span class="material-symbols-outlined" style="font-size:1rem">redeem</span>
        100 free credits on signup — no card required, credits don't renew monthly
      </span>
    </div>

    {#if data.packages.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.packages as pkg}
          <div class="p-6 rounded-xl border-2 border-neutral-200 hover:border-brand-400 transition-colors text-center">
            <h3 class="text-lg font-bold text-neutral-900 mb-1">{pkg.name}</h3>
            <div class="text-3xl font-extrabold text-brand-600 my-3">{formatPrice(pkg.price_kobo)}</div>
            <div class="text-neutral-600 text-sm mb-4">
              <span class="font-semibold text-neutral-900">{pkg.credits.toLocaleString()}</span> credits
            </div>
            <p class="text-xs text-neutral-500 mb-5">
              {formatPrice(Math.round(pkg.price_kobo / pkg.credits))} per email sent
            </p>
            <a
              href="/login"
              class="block w-full py-2 px-4 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors no-underline"
            >
              Buy Now
            </a>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-10 text-neutral-500">
        <span class="material-symbols-outlined text-4xl block mb-3">price_check</span>
        Pricing packages will be displayed here. Sign up to see current packages.
      </div>
    {/if}
  </div>
</section>

<!-- FAQ -->
<section class="py-20 px-4 bg-neutral-50">
  <div class="max-w-3xl mx-auto">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-neutral-900 mb-3">Frequently asked questions</h2>
    </div>
    <div class="space-y-3">
      {#each faqs as faq, i}
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
    <div class="text-center mt-8">
      <a href="/faq" class="text-brand-600 hover:text-brand-700 text-sm font-medium no-underline">
        See all FAQs →
      </a>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="py-20 px-4 bg-brand-600">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-white mb-4">Ready to send smarter?</h2>
    <p class="text-brand-100 text-lg mb-8">Start free today. 100 credits included, no card required.</p>
    <a
      href="/login"
      class="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-white text-brand-600 font-bold text-lg hover:bg-brand-50 transition-colors no-underline shadow-lg"
    >
      <span class="material-symbols-outlined">rocket_launch</span>
      Get Started Free
    </a>
  </div>
</section>
