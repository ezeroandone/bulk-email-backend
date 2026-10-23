<svelte:head>
  <title>Spreadsheets — MergeMail Docs</title>
  <meta name="description" content="Supported spreadsheet formats, column normalization rules, validation, and worked examples for MergeMail." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Spreadsheets</h1>

<p>MergeMail uses your spreadsheet as the recipient list for every campaign. Each row becomes one email, and each column becomes a variable you can use in email bodies, subject lines, and document templates.</p>

<h2>Supported Formats</h2>

<ul>
  <li><strong>XLSX</strong> — Microsoft Excel (Office 2007+). The most reliable format. Multi-sheet files are supported; MergeMail uses the first sheet by default.</li>
  <li><strong>CSV</strong> — Comma-separated values. UTF-8 encoding recommended. Files with BOM (byte-order mark) are handled correctly.</li>
</ul>

<p>Maximum file size: <strong>10 MB</strong>. For larger lists, split them into multiple datasets and run separate campaigns.</p>

<h2>Column Normalization</h2>

<p>
  MergeMail normalizes column headers into safe variable names. This means you can use natural-language headers in your spreadsheet
  without worrying about capitalization or spacing.
</p>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold text-neutral-700">Original column header</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold text-neutral-700">Normalized variable name</th>
      </tr>
    </thead>
    <tbody>
      {#each [
        ['First Name', 'first_name'],
        ['Last Name', 'last_name'],
        ['Email Address', 'email_address'],
        ['E-Mail', 'e_mail'],
        ['Phone Number', 'phone_number'],
        ['Date of Birth', 'date_of_birth'],
        ['Certificate ID', 'certificate_id'],
        ['Membership #', 'membership_'],
        ['Amount (₦)', 'amount_'],
      ] as [orig, norm]}
        <tr class="even:bg-neutral-50">
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs">{orig}</td>
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs text-brand-700">{norm}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="text-sm text-neutral-600 mt-2">
  Normalization rules: lowercase all characters → replace spaces with underscores → strip special characters except underscores.
</p>

<h2>Email Column Detection</h2>

<p>
  MergeMail automatically detects the email address column by looking for column names (after normalization) that match common patterns:
  <code>email</code>, <code>email_address</code>, <code>e_mail</code>, <code>recipient_email</code>, <code>email_id</code>, etc.
</p>
<p>
  If your email column has an unusual name, you will be prompted to select it manually during dataset setup.
</p>

<h2>Validation Rules</h2>

<p>MergeMail validates the spreadsheet during upload and reports issues before you proceed:</p>

<ul>
  <li><strong>Email validity:</strong> All values in the detected email column must be syntactically valid email addresses. Rows with invalid emails are flagged (but not silently skipped).</li>
  <li><strong>Duplicate emails:</strong> Duplicate email addresses generate a warning. You can choose to skip duplicates or keep all rows.</li>
  <li><strong>Empty rows:</strong> Completely empty rows between data rows are ignored.</li>
  <li><strong>Column count consistency:</strong> Rows with a different number of columns than the header row are flagged.</li>
  <li><strong>Character encoding:</strong> Non-UTF-8 characters in CSV files are re-encoded where possible. Characters that cannot be converted are replaced with a placeholder.</li>
</ul>

<h2>Worked Example</h2>

<p>Here is a minimal spreadsheet for a certificate delivery campaign:</p>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        {#each ['Full Name', 'Email', 'Course Title', 'Completion Date', 'Certificate ID'] as h}
          <th class="border border-neutral-200 px-3 py-2 text-left font-semibold text-neutral-700">{h}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each [
        ['Adaeze Okonkwo', 'adaeze@example.com', 'Data Analysis', '2024-11-15', 'CERT-0001'],
        ['Emeka Nwosu', 'emeka@example.com', 'Web Development', '2024-11-15', 'CERT-0002'],
        ['Fatima Bello', 'fatima@example.com', 'Project Management', '2024-11-22', 'CERT-0003'],
      ] as row}
        <tr class="even:bg-neutral-50">
          {#each row as cell}
            <td class="border border-neutral-200 px-3 py-2 text-xs">{cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p>
  After upload, these columns become available as variables:
  <code>full_name</code>, <code>email</code>, <code>course_title</code>, <code>completion_date</code>, <code>certificate_id</code>.
</p>

<h2>Tips for Clean Data</h2>

<ul>
  <li>Put headers in row 1 with no merged cells in the header row.</li>
  <li>Avoid blank rows between data rows.</li>
  <li>Use consistent date formats (ISO 8601 preferred: YYYY-MM-DD).</li>
  <li>For columns that contain numbers you want to display as text (e.g. "007"), format the cell as Text in Excel before exporting.</li>
  <li>Save as <code>.xlsx</code> rather than <code>.xls</code> (legacy format).</li>
</ul>

</div>
