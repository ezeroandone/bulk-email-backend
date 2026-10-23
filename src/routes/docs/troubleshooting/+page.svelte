<svelte:head>
  <title>Troubleshooting — MergeMail Docs</title>
  <meta name="description" content="Common MergeMail issues: SMTP auth failures, document mismatches, ZIP upload errors, character encoding, and credit questions." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Troubleshooting</h1>

<h2>SMTP Authentication Failures</h2>

<h3>"535 Username and Password not accepted"</h3>
<p>
  This is the most common Gmail error. It means you are using your regular Google account password instead of an App Password.
  Gmail blocks plain password auth for accounts with 2-Step Verification.
</p>
<p><strong>Fix:</strong> Generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" class="text-brand-600 no-underline hover:underline">myaccount.google.com/apppasswords</a> and use that 16-character password in MergeMail.</p>

<h3>"Connection timeout" or "ECONNREFUSED"</h3>
<p>
  The SMTP host or port is unreachable. This often happens when using port 25, which is blocked by most cloud providers.
</p>
<p><strong>Fix:</strong> Use port 587 with STARTTLS (recommended) or port 465 with SSL/TLS. Never use port 25.</p>

<h3>"EAUTH Invalid credentials"</h3>
<p>
  Credentials are syntactically accepted but authentication failed. Double-check the username (full email address, not just the local part) and password.
</p>

<h3>"TLS required but not available"</h3>
<p>
  Your SMTP server requires TLS but you selected the wrong security mode.
</p>
<p><strong>Fix:</strong> Switch the security setting to STARTTLS or SSL/TLS depending on your provider.</p>

<h2>Document Generation Issues</h2>

<h3>"Placeholder not found in template"</h3>
<p>
  A placeholder in your template does not match any mapped column. Common causes: typo in the placeholder name,
  extra space inside the braces (e.g. <code>{'{{ name }}'}</code> instead of <code>{'{{name}}'}</code>),
  or the column was renamed after mapping was saved.
</p>
<p><strong>Fix:</strong> Open the template editor, verify all placeholder names match your spreadsheet columns exactly (after normalization).</p>

<h3>Generated DOCX looks wrong / formatting is broken</h3>
<p>
  This can happen when a placeholder spans multiple formatting runs in Word. For example, typing <code>{'{{first'}</code> then bolding it then typing <code>{'_name}}'}</code> creates two separate XML runs.
</p>
<p><strong>Fix:</strong> Delete the entire placeholder and retype it as a single operation. Do not mix formatting styles mid-placeholder.</p>

<h3>PDF form fields not filling</h3>
<p>
  If a PDF field is named differently from the spreadsheet column, it will not be filled.
</p>
<p><strong>Fix:</strong> In your PDF editor, rename the form field to match the normalized column name exactly (lowercase, underscores, no special characters).</p>

<h2>Spreadsheet / Dataset Issues</h2>

<h3>"Invalid email address in row N"</h3>
<p>
  A cell in the email column contains a value that is not a valid email address (e.g. a name, phone number, or malformed address).
</p>
<p><strong>Fix:</strong> Open the spreadsheet, correct or remove the invalid email address in row N, and re-upload.</p>

<h3>Column headers not detected</h3>
<p>
  If MergeMail shows no columns or incorrect columns, the spreadsheet may have data in row 1 without a header row,
  or the file may have merged cells.
</p>
<p><strong>Fix:</strong> Ensure row 1 contains column headers. Remove all merged cells. Save as a plain XLSX or CSV.</p>

<h3>Special characters appearing as "?" or garbled text</h3>
<p>
  CSV files saved with a non-UTF-8 encoding (e.g. Windows-1252) may have characters like "é", "ñ", or "ₙ" garbled.
</p>
<p><strong>Fix:</strong> Save the CSV with UTF-8 encoding. In Excel: File → Save As → select CSV UTF-8 (with BOM). In LibreOffice: check the UTF-8 option in the CSV export dialog.</p>

<h2>ZIP Upload Issues</h2>

<h3>"ZIP bomb detected"</h3>
<p>
  The ZIP file's decompressed size exceeds the 500 MB safety limit. This is a security measure, not an error on your part if the file is legitimate.
</p>
<p><strong>Fix:</strong> Split the archive into multiple smaller ZIPs and create a separate matching import for each.</p>

<h3>"File path traversal detected"</h3>
<p>
  A file inside the ZIP has a path that starts with <code>../</code>. This is a security block.
</p>
<p><strong>Fix:</strong> Re-create the ZIP with files at the root level only. Most GUI zip tools do this by default when you select files and zip them.</p>

<h2>Credit Deduction Questions</h2>

<h3>"My balance was deducted but the email shows as failed"</h3>
<p>
  MergeMail deducts a credit when the SMTP server accepts the message (returns a 250 response).
  If the SMTP server accepted it but the email was later bounced by the recipient's mail server,
  that is an external event MergeMail cannot detect. The credit is not automatically refunded in this case.
</p>
<p>
  However, if the SMTP server rejected the message during the delivery attempt (a non-250 response),
  the credit is automatically refunded.
</p>

<h3>"Credits are reserved but the campaign is stuck"</h3>
<p>
  This can happen if a campaign enters an unexpected error state. Contact support with the campaign ID and we will investigate and release the reserved credits if appropriate.
</p>

</div>
