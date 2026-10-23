<svelte:head>
  <title>How It Works — MergeMail</title>
  <meta name="description" content="A step-by-step walkthrough of the MergeMail workflow: upload data, design templates, configure SMTP, launch and track." />
  <meta property="og:title" content="How It Works — MergeMail" />
  <meta property="og:description" content="Four simple steps from raw spreadsheet data to personalized emails in every inbox." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-16">
  <div class="text-center mb-14">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-4">How MergeMail Works</h1>
    <p class="text-xl text-neutral-600 max-w-2xl mx-auto">
      Four steps from a blank spreadsheet to a completed campaign.
    </p>
  </div>

  <!-- Step 1 -->
  <div class="mb-16">
    <div class="flex items-start gap-6">
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span class="material-symbols-outlined text-brand-600" style="font-size:2rem">table_chart</span>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Step 1</span>
          <h2 class="text-2xl font-bold text-neutral-900">Upload Your Data</h2>
        </div>
        <p class="text-neutral-600 leading-relaxed mb-4">
          Prepare your recipient list in Microsoft Excel (.xlsx) or any CSV file.
          Your spreadsheet should have one row per recipient, with columns for email address, name,
          and any other fields you want to include in the message or document.
        </p>
        <div class="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-neutral-900 mb-3">Tips for a clean spreadsheet</h3>
          <ul class="space-y-2 text-sm text-neutral-600">
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-green-600" style="font-size:1rem;margin-top:2px">check_circle</span>Put column headers in row 1 (e.g. "Email", "First Name", "Certificate ID").</li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-green-600" style="font-size:1rem;margin-top:2px">check_circle</span>Include one email address column — MergeMail auto-detects columns named "email", "e-mail", "Email Address", etc.</li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-green-600" style="font-size:1rem;margin-top:2px">check_circle</span>Keep column names simple; MergeMail normalizes spaces and case (e.g. "First Name" → <code class="bg-white border rounded px-1 text-xs">first_name</code>).</li>
            <li class="flex items-start gap-2"><span class="material-symbols-outlined text-green-600" style="font-size:1rem;margin-top:2px">check_circle</span>Remove blank rows between data rows — they become recipients with empty fields.</li>
          </ul>
        </div>
        <div class="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-800">
          <strong>Maximum file size:</strong> 10 MB. For larger lists, split into multiple datasets and run separate campaigns.
        </div>
      </div>
    </div>
    <div class="mt-8 border-l-2 border-neutral-200 ml-8 pl-8">
      <!-- connector line visual -->
    </div>
  </div>

  <!-- Step 2 -->
  <div class="mb-16">
    <div class="flex items-start gap-6">
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span class="material-symbols-outlined text-brand-600" style="font-size:2rem">draw</span>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Step 2</span>
          <h2 class="text-2xl font-bold text-neutral-900">Design Your Template</h2>
        </div>
        <p class="text-neutral-600 leading-relaxed mb-4">
          Create the email body and, optionally, a document template. Place
          <code class="bg-neutral-100 border rounded px-1 text-xs">{'{{variable_name}}'}</code> anywhere
          you want a recipient-specific value to appear.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-brand-500" style="font-size:1rem">email</span>
              Email Template
            </h3>
            <p class="text-sm text-neutral-600">
              Write the subject line and body in the campaign editor. HTML is supported with a live preview pane.
              Add formatters like <code class="bg-white border rounded px-1 text-xs">{'{{name|title}}'}</code> to normalize casing.
            </p>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-brand-500" style="font-size:1rem">description</span>
              Document Template
            </h3>
            <p class="text-sm text-neutral-600">
              Upload a DOCX or PDF template. The template editor shows detected placeholders
              and lets you map each one to a spreadsheet column before saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 3 -->
  <div class="mb-16">
    <div class="flex items-start gap-6">
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span class="material-symbols-outlined text-brand-600" style="font-size:2rem">dns</span>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Step 3</span>
          <h2 class="text-2xl font-bold text-neutral-900">Configure Your SMTP</h2>
        </div>
        <p class="text-neutral-600 leading-relaxed mb-4">
          MergeMail sends through your own email account — so the email arrives from your address,
          not a shared sending domain. Enter your SMTP credentials once and they are reused for all campaigns.
        </p>
        <div class="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-neutral-900 mb-3">Supported providers</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-neutral-600">
            {#each ['Gmail (App Password)', 'Outlook / Hotmail', 'Zoho Mail', 'Amazon SES', 'Mailgun', 'SendGrid', 'Custom SMTP'] as provider}
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-green-600" style="font-size:1rem">check</span>
                {provider}
              </div>
            {/each}
          </div>
        </div>
        <div class="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-xl text-sm text-blue-800">
          <strong>Security:</strong> SMTP credentials are encrypted with AES-256-GCM before storage.
          Use the <em>Test Connection</em> button on the SMTP settings page to verify your setup before launching a campaign.
        </div>
      </div>
    </div>
  </div>

  <!-- Step 4 -->
  <div class="mb-16">
    <div class="flex items-start gap-6">
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
          <span class="material-symbols-outlined text-brand-600" style="font-size:2rem">rocket_launch</span>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Step 4</span>
          <h2 class="text-2xl font-bold text-neutral-900">Launch & Track</h2>
        </div>
        <p class="text-neutral-600 leading-relaxed mb-4">
          Review the campaign summary — recipient count, credit cost, template preview —
          then click <strong>Launch</strong>. The campaign report page updates in real time as each email is processed.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-1">Live counters</h3>
            <p class="text-sm text-neutral-600">Sent, Failed, Pending, and Skipped counts update without page refresh.</p>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-1">Per-recipient detail</h3>
            <p class="text-sm text-neutral-600">Click any row to see the exact SMTP response or error for that recipient.</p>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-1">Pause & resume</h3>
            <p class="text-sm text-neutral-600">Pause a running campaign at any time and resume from the next pending recipient.</p>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
            <h3 class="text-sm font-semibold text-neutral-900 mb-1">Credit deduction</h3>
            <p class="text-sm text-neutral-600">Credits are reserved when a campaign starts and deducted as each email is accepted.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="text-center">
    <a href="/login" class="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors no-underline shadow">
      <span class="material-symbols-outlined">rocket_launch</span>
      Try it free — 100 credits included
    </a>
  </div>
</div>
