<svelte:head>
  <title>Features — MergeMail</title>
  <meta name="description" content="Explore all MergeMail features: bulk email campaigns, document generation, mail merge, SMTP integration, credit system, and real-time tracking." />
  <meta property="og:title" content="Features — MergeMail" />
  <meta property="og:description" content="Everything you need to send personalized bulk emails with per-recipient attachments." />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-16">
  <div class="text-center mb-14">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-4">MergeMail Features</h1>
    <p class="text-xl text-neutral-600 max-w-2xl mx-auto">
      A complete pipeline from spreadsheet data to personalized inbox delivery — with full audit logs along the way.
    </p>
  </div>

  <!-- Email Sending -->
  <section class="mb-16">
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">mail</span>
      Email Sending
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Bulk Campaign Engine</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Send from dozens to tens of thousands of emails in a single campaign. MergeMail queues each delivery job individually,
          retries transient failures automatically (up to 3 attempts), and tracks every outcome.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Personalized Subject & Body</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Use <code class="bg-white border rounded px-1 text-xs">{'{{variable}}'}</code> syntax in both the subject line and HTML or plain-text body.
          Every recipient gets a message that reads like it was written just for them.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">HTML & Plain Text</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Write rich HTML email templates or clean plain-text messages. The campaign editor shows a live preview before you launch.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Pause, Resume & Cancel</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Need to stop mid-send? Pause a running campaign instantly, edit any pending recipients,
          then resume from where it left off. Or cancel entirely — unused credits are not deducted.
        </p>
      </div>
    </div>
  </section>

  <!-- Document Generation -->
  <section class="mb-16">
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">description</span>
      Document Generation
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">DOCX Templates</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Design your template in Microsoft Word. Place <code class="bg-white border rounded px-1 text-xs">{'{{placeholders}}'}</code> anywhere in the document —
          in headings, tables, footers, and even image alt text. MergeMail fills them per recipient at send time.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">PDF Templates</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Upload a PDF with named form fields. MergeMail fills each field using the corresponding spreadsheet column,
          flattens the result, and attaches the PDF to the outgoing email.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Existing Document ZIP Upload</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Already have individual PDFs or DOCX files for each recipient? Upload them as a ZIP.
          MergeMail matches files to rows by filename, with manual override if needed.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Automatic Attachment</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Generated documents are automatically attached to the recipient's email. No manual file management,
          no bulk downloads — each person gets exactly their document.
        </p>
      </div>
    </div>
  </section>

  <!-- Data & Templates -->
  <section class="mb-16">
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">table_chart</span>
      Data & Templates
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Spreadsheet Upload (XLSX & CSV)</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Upload any XLSX or CSV file. MergeMail normalizes column headers automatically
          (e.g. "First Name" becomes <code class="bg-white border rounded px-1 text-xs">first_name</code>),
          validates data types, and shows a preview before you proceed.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Column Mapping Interface</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          The visual mapping editor lets you drag spreadsheet columns onto template placeholders.
          Mismatched types or missing required fields are flagged before you commit.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Variable Formatters</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Apply inline formatters such as <code class="bg-white border rounded px-1 text-xs">|upper</code>,
          <code class="bg-white border rounded px-1 text-xs">|lower</code>,
          <code class="bg-white border rounded px-1 text-xs">|title</code>, and
          <code class="bg-white border rounded px-1 text-xs">|default:N/A</code> directly inside placeholders.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Reusable Email Templates</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Save email subject and body templates in your library and reuse them across campaigns.
          Edit once, update everywhere.
        </p>
      </div>
    </div>
  </section>

  <!-- SMTP & Credits -->
  <section class="mb-16">
    <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
      <span class="material-symbols-outlined text-brand-600" style="font-size:1.75rem">settings</span>
      SMTP & Credits
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Bring Your Own SMTP</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Connect Gmail (app password), Outlook, Zoho, Amazon SES, Mailgun, SendGrid, or any SMTP server.
          Credentials are encrypted at rest using AES-256-GCM. Run a test send from the dashboard to verify your setup.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">No-Expiry Credits</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          1 credit = 1 email sent. Credits are deducted only when an email is accepted by the SMTP server.
          They never expire, never renew, and can be topped up any time.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Real-time Delivery Tracking</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          The campaign report page updates live as emails go out. Counters for Sent, Failed, Pending,
          and Skipped refresh automatically. Drill into individual recipient status to see SMTP error messages.
        </p>
      </div>
      <div class="p-6 rounded-xl border border-neutral-200 bg-neutral-50">
        <h3 class="text-base font-semibold text-neutral-900 mb-2">Secure Paystack Payments</h3>
        <p class="text-sm text-neutral-600 leading-relaxed">
          Purchase credit packages via Paystack. Payments are processed in NGN.
          Receipts and a full transaction history are available on the billing page.
        </p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <div class="text-center mt-10">
    <a href="/login" class="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors no-underline shadow">
      <span class="material-symbols-outlined">rocket_launch</span>
      Start for free
    </a>
  </div>
</div>
