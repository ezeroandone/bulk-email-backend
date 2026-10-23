<svelte:head>
  <title>SMTP Setup — MergeMail Docs</title>
  <meta name="description" content="Configure Gmail, Outlook, Zoho, Amazon SES, Mailgun, and custom SMTP servers in MergeMail. TLS settings, app passwords, and troubleshooting." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>SMTP Setup</h1>

<p>
  MergeMail sends email through your own SMTP server. This means emails arrive from your domain,
  your sender reputation is preserved, and no third-party has access to your message content beyond transit.
</p>

<h2>Adding Your SMTP Configuration</h2>

<ol>
  <li>In the dashboard, go to <strong>Settings → SMTP</strong>.</li>
  <li>Fill in: Host, Port, Security, Username, Password, From Name, From Email, and optionally Reply-To.</li>
  <li>Click <strong>Test Connection</strong>. MergeMail will attempt to authenticate and send a test message to your own from-address.</li>
  <li>If the test succeeds, click <strong>Save Configuration</strong>.</li>
</ol>

<div class="not-prose bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 flex items-start gap-3">
  <span class="material-symbols-outlined text-blue-600 flex-shrink-0" style="font-size:1.25rem">lock</span>
  <p class="text-blue-800 text-sm m-0">
    Your SMTP password is encrypted with AES-256-GCM before being stored. It is never logged or displayed in plaintext.
  </p>
</div>

<h2>Provider Guides</h2>

<h3>Gmail (Recommended: App Password)</h3>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-3">
  <table class="text-sm w-full">
    <tbody>
      {#each [['Host', 'smtp.gmail.com'], ['Port', '587'], ['Security', 'STARTTLS'], ['Username', 'your.email@gmail.com'], ['Password', '16-character App Password (not your Google login password)']] as [k, v]}
        <tr class="border-b border-neutral-100 last:border-0">
          <td class="py-1.5 pr-4 font-medium text-neutral-600 w-24">{k}</td>
          <td class="py-1.5 font-mono text-xs text-neutral-900">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p><strong>To generate a Gmail App Password:</strong></p>
<ol>
  <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener" class="text-brand-600 no-underline hover:underline">myaccount.google.com/security</a>.</li>
  <li>Under "How you sign in to Google", enable 2-Step Verification if not already on.</li>
  <li>Search for "App Passwords" or navigate to <strong>Security → App Passwords</strong>.</li>
  <li>Select app "Mail" and device "Other". Name it "MergeMail".</li>
  <li>Copy the 16-character password generated and paste it into MergeMail.</li>
</ol>

<h3>Outlook / Hotmail</h3>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-3">
  <table class="text-sm w-full">
    <tbody>
      {#each [['Host', 'smtp-mail.outlook.com'], ['Port', '587'], ['Security', 'STARTTLS'], ['Username', 'your.email@outlook.com'], ['Password', 'Your Outlook password (or App Password if MFA is enabled)']] as [k, v]}
        <tr class="border-b border-neutral-100 last:border-0">
          <td class="py-1.5 pr-4 font-medium text-neutral-600 w-24">{k}</td>
          <td class="py-1.5 font-mono text-xs text-neutral-900">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h3>Zoho Mail</h3>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-3">
  <table class="text-sm w-full">
    <tbody>
      {#each [['Host', 'smtp.zoho.com'], ['Port', '587 (STARTTLS) or 465 (SSL)'], ['Security', 'STARTTLS or SSL/TLS'], ['Username', 'your.email@yourdomain.com'], ['Password', 'Your Zoho Mail password']] as [k, v]}
        <tr class="border-b border-neutral-100 last:border-0">
          <td class="py-1.5 pr-4 font-medium text-neutral-600 w-24">{k}</td>
          <td class="py-1.5 font-mono text-xs text-neutral-900">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h3>Amazon SES</h3>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-3">
  <table class="text-sm w-full">
    <tbody>
      {#each [['Host', 'email-smtp.us-east-1.amazonaws.com (or your region)'], ['Port', '587'], ['Security', 'STARTTLS'], ['Username', 'SMTP Username from SES console (not your AWS Access Key ID)'], ['Password', 'SMTP Password from SES console (not your AWS Secret Key)']] as [k, v]}
        <tr class="border-b border-neutral-100 last:border-0">
          <td class="py-1.5 pr-4 font-medium text-neutral-600 w-24">{k}</td>
          <td class="py-1.5 font-mono text-xs text-neutral-900">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p>
  Note: Amazon SES requires you to verify your sender domain and, for new accounts, move out of the SES sandbox before sending to non-verified addresses.
</p>

<h3>Mailgun</h3>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-3">
  <table class="text-sm w-full">
    <tbody>
      {#each [['Host', 'smtp.mailgun.org'], ['Port', '587'], ['Security', 'STARTTLS'], ['Username', 'postmaster@yourdomain.mailgun.org'], ['Password', 'Mailgun SMTP password from domain settings']] as [k, v]}
        <tr class="border-b border-neutral-100 last:border-0">
          <td class="py-1.5 pr-4 font-medium text-neutral-600 w-24">{k}</td>
          <td class="py-1.5 font-mono text-xs text-neutral-900">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>TLS Settings</h2>

<p>MergeMail supports two TLS modes:</p>

<ul>
  <li><strong>STARTTLS (port 587):</strong> Connection starts unencrypted and upgrades to TLS. This is the modern recommended standard.</li>
  <li><strong>SSL/TLS (port 465):</strong> Connection is encrypted from the start. Some older providers require this.</li>
</ul>

<p>Do not use port 25 — it is blocked on most cloud platforms including Vercel, and is primarily used for server-to-server relay.</p>

<h2>Testing Your SMTP</h2>

<p>
  The Test Connection button on the SMTP settings page sends an authentication request to your SMTP server.
  A successful test means credentials are valid. It does not guarantee that every campaign email will be delivered
  (recipient-side filtering, rate limits, and spam scoring are outside MergeMail's control).
</p>

</div>
