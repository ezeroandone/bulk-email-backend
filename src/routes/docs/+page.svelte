<svelte:head>
  <title>Documentation — MergeMail</title>
  <meta name="description" content="MergeMail documentation: get started, learn about spreadsheets, templates, SMTP, credits, and the API." />
</svelte:head>

<h1 class="text-3xl font-extrabold text-neutral-900 mb-3">MergeMail Documentation</h1>
<p class="text-neutral-600 mb-10 text-lg">
  Everything you need to build, launch, and manage bulk email campaigns with personalized attachments.
</p>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {#each [
    { href: '/docs/getting-started', icon: 'rocket_launch', title: 'Getting Started', desc: 'Create your account, claim 100 free credits, and send your first campaign in minutes.' },
    { href: '/docs/spreadsheets', icon: 'table_chart', title: 'Spreadsheets', desc: 'Supported formats, column normalization rules, validation, and worked examples.' },
    { href: '/docs/document-templates', icon: 'description', title: 'Document Templates', desc: 'DOCX and PDF templates, placeholder syntax, and how generated files are attached.' },
    { href: '/docs/variable-mapping', icon: 'data_object', title: 'Variable Mapping', desc: 'Map spreadsheet columns to placeholders, apply formatters like |upper and |title.' },
    { href: '/docs/existing-documents', icon: 'folder_zip', title: 'Existing Documents', desc: 'Upload a ZIP of pre-made PDFs or DOCX files and match them to recipients automatically.' },
    { href: '/docs/email-campaigns', icon: 'campaign', title: 'Email Campaigns', desc: 'Compose emails, use HTML or plain text, run the campaign, and read the report.' },
    { href: '/docs/smtp', icon: 'mail', title: 'SMTP Setup', desc: 'Configure Gmail, Outlook, Zoho, Amazon SES, Mailgun, or any custom SMTP server.' },
    { href: '/docs/credits', icon: 'monetization_on', title: 'Credits', desc: 'How credits work, what counts as 1 credit, reserved vs available, and how to top up.' },
    { href: '/docs/payments', icon: 'payments', title: 'Payments', desc: 'Paystack integration, NGN pricing, credit packages, receipts, and payment history.' },
    { href: '/docs/troubleshooting', icon: 'build', title: 'Troubleshooting', desc: 'Common issues: SMTP auth failures, document mismatches, ZIP errors, credit questions.' },
    { href: '/docs/api', icon: 'api', title: 'API Reference', desc: 'Full OpenAPI spec for all MergeMail endpoints. Useful for automation and integrations.' },
    { href: '/docs/faq', icon: 'help', title: 'Developer FAQ', desc: '15 technical questions covering authentication, rate limits, formats, and edge cases.' }
  ] as s}
    <a
      href={s.href}
      class="flex items-start gap-4 p-5 rounded-xl border border-neutral-200 hover:border-brand-300 hover:shadow-sm transition-all no-underline group"
    >
      <div class="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-brand-600" style="font-size:1.25rem">{s.icon}</span>
      </div>
      <div>
        <div class="font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors mb-1">{s.title}</div>
        <div class="text-sm text-neutral-500 leading-relaxed">{s.desc}</div>
      </div>
    </a>
  {/each}
</div>
