<svelte:head>
  <title>Privacy Policy — MergeMail</title>
  <meta name="description" content="MergeMail privacy policy — how we collect, use, and protect your data under the Nigeria Data Protection Regulation (NDPR)." />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-16">
  <h1 class="text-4xl font-extrabold text-neutral-900 mb-2">Privacy Policy</h1>
  <p class="text-sm text-neutral-500 mb-10">Last updated: December 2024</p>

  <div class="prose prose-neutral max-w-none">

    <p>
      MergeMail ("we", "our", or "us") is committed to protecting your personal data in accordance with the
      <strong>Nigeria Data Protection Regulation (NDPR) 2019</strong> and the Nigeria Data Protection Act 2023.
      This policy explains what data we collect, why we collect it, how we store it, and your rights over it.
    </p>

    <h2>1. Data We Collect</h2>
    <p>We collect the following categories of personal data:</p>
    <ul>
      <li><strong>Account data:</strong> Your name, email address, profile photo URL (from Google OAuth).</li>
      <li><strong>Usage data:</strong> Campaign statistics, login timestamps, IP address at login.</li>
      <li><strong>Payment data:</strong> Transaction reference numbers and payment status. We do not store card details — all card processing is handled by Paystack.</li>
      <li><strong>Uploaded data:</strong> Spreadsheets and document templates you upload. These contain the personal data of your recipients. You are the data controller for that data; we process it only on your behalf.</li>
      <li><strong>Communications:</strong> Messages you send us via the contact form.</li>
      <li><strong>Technical data:</strong> Browser type, device type, referring URLs, and pages visited (via analytics).</li>
    </ul>

    <h2>2. How We Use Your Data</h2>
    <p>We use your personal data to:</p>
    <ul>
      <li>Provide and operate the MergeMail service.</li>
      <li>Process payments and issue receipts.</li>
      <li>Send you transactional emails (campaign completion notices, password resets).</li>
      <li>Respond to support enquiries.</li>
      <li>Detect and prevent fraud, abuse, and policy violations.</li>
      <li>Improve the platform through aggregate, anonymized analytics.</li>
    </ul>
    <p>
      We do not sell your personal data to third parties. We do not use your data for targeted advertising.
    </p>

    <h2>3. Lawful Basis for Processing</h2>
    <p>We process your data under the following lawful bases (NDPR Article 2.2):</p>
    <ul>
      <li><strong>Contract performance:</strong> To deliver the services you signed up for.</li>
      <li><strong>Legitimate interests:</strong> To detect abuse, improve the service, and ensure platform security.</li>
      <li><strong>Consent:</strong> Where we ask for your explicit consent (e.g. marketing emails).</li>
      <li><strong>Legal obligation:</strong> To comply with applicable Nigerian law.</li>
    </ul>

    <h2>4. Data Storage and Security</h2>
    <ul>
      <li>All data is stored in <strong>Supabase</strong> infrastructure hosted in the EU (Frankfurt region).</li>
      <li>Data at rest is encrypted using AES-256. Data in transit uses TLS 1.2+.</li>
      <li>SMTP credentials you provide are encrypted with AES-256-GCM before being stored.</li>
      <li>Uploaded files are stored in private Supabase storage buckets with Row Level Security. Only your account can access your files.</li>
      <li>We perform regular security audits and dependency updates.</li>
    </ul>

    <h2>5. Data Sharing</h2>
    <p>We share your data only with:</p>
    <ul>
      <li><strong>Supabase:</strong> Our database and storage provider (EU-based). They process data strictly as a data processor under a Data Processing Agreement.</li>
      <li><strong>Paystack:</strong> Our payment processor (Nigeria). Card data never passes through our servers.</li>
      <li><strong>Vercel:</strong> Our hosting provider. Request logs may be retained briefly for debugging.</li>
      <li><strong>Law enforcement:</strong> Where required by a valid court order or regulatory authority under Nigerian law.</li>
    </ul>
    <p>We do not share your recipient data (the personal data in your uploaded spreadsheets) with any third party for any purpose other than delivering your campaign.</p>

    <h2>6. Data Retention</h2>
    <ul>
      <li>Account data is retained for the lifetime of your account plus 90 days after deletion.</li>
      <li>Uploaded spreadsheets and generated documents are retained until you delete them from your dashboard, or for 12 months of account inactivity, whichever comes first.</li>
      <li>Payment records are retained for 7 years as required by Nigerian financial regulations.</li>
      <li>Contact form submissions are retained for 2 years for support continuity.</li>
    </ul>

    <h2>7. Your Rights Under NDPR</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
      <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
      <li><strong>Erasure:</strong> Request deletion of your account and associated data (subject to legal retention obligations).</li>
      <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
      <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
      <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
    </ul>
    <p>
      To exercise these rights, use the <a href="/contact" class="text-brand-600 hover:underline no-underline">contact form</a> with subject "General Enquiry" or email <strong>privacy@mergemail.app</strong>.
      We will respond within 30 days as required by NDPR.
    </p>

    <h2>8. Cookies</h2>
    <p>
      We use only essential session cookies required for authentication. We do not use third-party advertising cookies.
      Analytics (if enabled) use anonymized, cookie-free tracking.
    </p>

    <h2>9. Children's Data</h2>
    <p>
      MergeMail is not directed at children under 18. We do not knowingly collect personal data from minors.
      If you believe a minor has created an account, contact us and we will delete it promptly.
    </p>

    <h2>10. Changes to This Policy</h2>
    <p>
      We may update this policy to reflect changes in the law or our practices. Material changes will be announced
      via the dashboard notification system at least 14 days before taking effect.
    </p>

    <h2>11. Contact</h2>
    <p>
      For privacy questions or to exercise your rights, contact our Data Protection Officer at
      <strong>privacy@mergemail.app</strong> or use the <a href="/contact" class="text-brand-600 hover:underline no-underline">contact form</a>.
    </p>
  </div>
</div>
