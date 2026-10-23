<script lang="ts">
  let openFaq = $state<number | null>(null);

  const faqs = [
    { q: 'What is MergeMail?', a: 'MergeMail is a web-based SaaS platform that lets you send personalized bulk emails with per-recipient document attachments. You upload a spreadsheet of recipients, design email and document templates, connect your SMTP server, and launch a campaign — MergeMail handles generation, attachment, and delivery for every recipient.' },
    { q: 'Is MergeMail free to use?', a: 'You get 100 credits free when you sign up — no credit card required. Each credit sends one email. Once your free credits are used up, you can purchase a credit package from the billing page.' },
    { q: 'What does 1 credit cost?', a: 'It depends on the package you choose. Larger packages have a lower per-credit cost. Visit the pricing page to see current packages. All pricing is in Nigerian Naira (NGN).' },
    { q: 'Do my credits expire?', a: 'No. Credits never expire. There is no monthly renewal window and no deadline to use them. You purchase once and the credits remain in your wallet until spent.' },
    { q: 'What SMTP providers work with MergeMail?', a: 'Any provider that supports standard SMTP with STARTTLS or SSL/TLS. This includes Gmail (using an App Password), Outlook/Hotmail, Zoho Mail, Amazon SES, Mailgun, SendGrid, and any custom mail server.' },
    { q: 'Is my data secure?', a: 'Yes. All data is stored in Supabase with Row Level Security (RLS), which means your data is logically isolated from other users at the database level. SMTP credentials are encrypted at rest using AES-256-GCM. Uploaded files are stored in private storage buckets accessible only to your account.' },
    { q: 'What file formats are supported for spreadsheets?', a: 'MergeMail supports XLSX (Microsoft Excel) and CSV files. The parser normalizes column headers automatically, so "First Name" and "first_name" both become the variable first_name.' },
    { q: 'What document formats can I generate?', a: 'DOCX (Microsoft Word) templates using {{placeholder}} syntax, and PDF templates with named form fields. You can also upload a ZIP of pre-made PDFs or DOCX files and MergeMail will match each file to the corresponding recipient.' },
    { q: 'How do I create a DOCX template?', a: 'Open Microsoft Word, write your document, and place {{variable_name}} wherever you want recipient-specific data to appear. Save as .docx and upload to MergeMail. The template editor will detect all placeholders and guide you through mapping them to spreadsheet columns.' },
    { q: 'Can I pause a campaign that is already running?', a: 'Yes. From the campaign detail page, click the Pause button. The current batch finishes (emails already queued for sending are completed) and new dispatches stop. You can resume at any time from the same position.' },
    { q: 'What happens if an email fails to send?', a: 'MergeMail retries failed sends automatically up to 3 times with a backoff delay. If all retries fail, the recipient is marked as failed and the credit is refunded to your wallet. You can see the exact SMTP error in the campaign report.' },
    { q: 'Can I use MergeMail for bulk spam?', a: 'No. MergeMail is explicitly prohibited from being used to send unsolicited bulk email (spam), phishing, or any messages that violate our Acceptable Use Policy. Accounts found sending spam are suspended immediately. See the Acceptable Use Policy for details.' },
    { q: 'How do I pay for credits?', a: 'Payments are processed via Paystack in Nigerian Naira. After checkout, credits appear in your wallet immediately. You can view receipts and payment history on the billing page.' },
    { q: 'Can I cancel a campaign and get my credits back?', a: 'If you cancel a campaign before it starts, reserved credits are immediately returned to your available balance. If you cancel a running campaign, credits for emails already sent are not refunded, but credits for pending (not-yet-sent) recipients are released.' },
    { q: 'How do I contact support?', a: 'Use the contact form at /contact. Select "Support" as the subject category and describe your issue. We aim to respond within one business day.' }
  ];

  function toggleFaq(i: number) {
    openFaq = openFaq === i ? null : i;
  }
</script>

<svelte:head>
  <title>FAQ — MergeMail</title>
  <meta name="description" content="Frequently asked questions about MergeMail: credits, pricing, SMTP, document formats, security, and more." />
  <meta property="og:title" content="FAQ — MergeMail" />
  <meta property="og:description" content="Everything you need to know before getting started with MergeMail." />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-16">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-4">Frequently Asked Questions</h1>
    <p class="text-neutral-600 text-lg">
      Can't find your answer here? <a href="/contact" class="text-brand-600 no-underline hover:underline">Contact us</a>.
    </p>
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

  <div class="mt-12 text-center p-8 rounded-xl bg-brand-50 border border-brand-200">
    <p class="text-neutral-700 mb-4">Still have questions?</p>
    <a href="/contact" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors no-underline">
      <span class="material-symbols-outlined" style="font-size:1rem">mail</span>
      Contact Support
    </a>
  </div>
</div>
