<svelte:head>
  <title>Getting Started — MergeMail Docs</title>
  <meta name="description" content="Create your MergeMail account, claim 100 free credits, and send your first bulk email campaign." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Getting Started</h1>

<p>This guide walks you through creating an account, setting up your first campaign, and sending personalized emails in under 15 minutes.</p>

<h2>1. Create Your Account</h2>

<p>MergeMail uses Google OAuth for authentication. No separate password is required.</p>

<ol>
  <li>Go to <a href="/login" class="text-brand-600 no-underline hover:underline">/login</a>.</li>
  <li>Click <strong>Continue with Google</strong>.</li>
  <li>Authorize MergeMail to read your Google account name and email address.</li>
  <li>You will be redirected to the onboarding page.</li>
</ol>

<div class="not-prose bg-green-50 border border-green-200 rounded-xl p-4 my-4 flex items-start gap-3">
  <span class="material-symbols-outlined text-green-600 flex-shrink-0" style="font-size:1.25rem">redeem</span>
  <div>
    <strong class="text-green-900 text-sm">100 free credits on signup</strong>
    <p class="text-green-800 text-sm mt-1 mb-0">
      When your account is created, 100 credits are automatically added to your wallet. No credit card required.
      These credits do not expire and are immediately available to use.
    </p>
  </div>
</div>

<h2>2. Onboarding Checklist</h2>

<p>After signup, the onboarding page walks you through four tasks. Complete them in order:</p>

<ol>
  <li><strong>Configure SMTP</strong> — Connect your email account (Gmail, Outlook, etc.) so MergeMail can send on your behalf.</li>
  <li><strong>Upload a spreadsheet</strong> — Add your first recipient dataset (XLSX or CSV).</li>
  <li><strong>Create a template</strong> — Upload a DOCX or PDF document template, or write an email template.</li>
  <li><strong>Launch a campaign</strong> — Combine the dataset and template into a campaign and send.</li>
</ol>

<h2>3. Configure SMTP</h2>

<p>
  Navigate to <strong>Settings → SMTP</strong> in the sidebar.
  Enter your SMTP credentials and click <strong>Test Connection</strong> to verify before saving.
</p>

<p>Quick setup for Gmail:</p>

<pre><code>Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your.email@gmail.com
Password: [16-character App Password from Google Account → Security → App Passwords]
</code></pre>

<p>
  See the full <a href="/docs/smtp" class="text-brand-600 no-underline hover:underline">SMTP Setup Guide</a> for other providers.
</p>

<h2>4. Upload a Spreadsheet</h2>

<ol>
  <li>Go to <strong>Datasets</strong> → <strong>New Dataset</strong>.</li>
  <li>Drag and drop (or browse for) your XLSX or CSV file.</li>
  <li>MergeMail parses the file, normalizes column headers, and shows a preview.</li>
  <li>Review the detected columns, confirm the email column, and click <strong>Save Dataset</strong>.</li>
</ol>

<p>
  For full details on supported formats and column rules, see the <a href="/docs/spreadsheets" class="text-brand-600 no-underline hover:underline">Spreadsheets guide</a>.
</p>

<h2>5. Create Your First Campaign</h2>

<ol>
  <li>Go to <strong>Campaigns</strong> → <strong>New Campaign</strong>.</li>
  <li>Enter a campaign name.</li>
  <li>Select a dataset from the dropdown.</li>
  <li>Choose the campaign mode:
    <ul>
      <li><strong>Email only</strong> — No document attachment. The email body is the whole message.</li>
      <li><strong>Email + Document</strong> — Generate a personalized document and attach it to each email.</li>
      <li><strong>Existing documents (ZIP)</strong> — Match pre-made files to recipients from a ZIP upload.</li>
    </ul>
  </li>
  <li>Write the email subject and body. Use <code>{'{{column_name}}'}</code> for personalization.</li>
  <li>Map columns to placeholders using the mapping interface.</li>
  <li>Review the summary: recipient count, estimated credit cost, SMTP to be used.</li>
  <li>Click <strong>Launch Campaign</strong>.</li>
</ol>

<h2>6. Monitor Progress</h2>

<p>
  The campaign report page updates in real time. You will see counters for Sent, Failed, Pending, and Skipped.
  Click any recipient row to inspect the SMTP response or error message for that delivery.
</p>

<p>
  If a campaign is paused or has failed deliveries, use the <strong>Resume</strong> or <strong>Retry Failed</strong> options on the campaign detail page.
</p>

<h2>Next Steps</h2>

<ul>
  <li><a href="/docs/document-templates" class="text-brand-600 no-underline hover:underline">Learn to create DOCX and PDF templates</a></li>
  <li><a href="/docs/variable-mapping" class="text-brand-600 no-underline hover:underline">Advanced variable mapping and formatters</a></li>
  <li><a href="/docs/smtp" class="text-brand-600 no-underline hover:underline">SMTP provider setup guides</a></li>
  <li><a href="/docs/credits" class="text-brand-600 no-underline hover:underline">Understanding the credit system</a></li>
</ul>

</div>
