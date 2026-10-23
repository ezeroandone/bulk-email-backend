<svelte:head>
  <title>Variable Mapping — MergeMail Docs</title>
  <meta name="description" content="The MergeMail mapping interface, available formatters (|upper, |lower, |title, |default), and worked examples." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Variable Mapping</h1>

<p>
  Variable mapping connects spreadsheet column values to placeholders in your email body, subject line, and document template.
  The mapping interface appears when you create or configure a campaign.
</p>

<h2>The Mapping Interface</h2>

<p>
  The left panel lists all placeholders detected in your template (e.g. <code>{'{{full_name}}'}</code>, <code>{'{{course_title}}'}</code>).
  The right panel lists all normalized columns from the selected dataset.
  Drag a column onto a placeholder (or use the dropdown) to create a mapping.
</p>

<p>
  MergeMail auto-maps placeholders where the placeholder name exactly matches a column name.
  For example, if your spreadsheet has a column <code>full_name</code> and your template has <code>{'{{full_name}}'}</code>,
  the mapping is applied automatically. You only need to manually map the mismatches.
</p>

<h2>Mapping Scope</h2>

<ul>
  <li><strong>Email subject:</strong> Placeholders in the subject line are resolved from the same mapping.</li>
  <li><strong>Email body:</strong> Both HTML and plain-text bodies support <code>{'{{placeholders}}'}</code>.</li>
  <li><strong>Document template:</strong> Mapped separately in the template editor. Mappings made in the campaign wizard apply to the email body; document mappings are saved with the template.</li>
</ul>

<h2>Formatters</h2>

<p>
  Formatters are appended to a placeholder name with a pipe character (<code>|</code>) and modify the output value at substitution time.
  Formatters do not change the data in your spreadsheet.
</p>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Formatter</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Description</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Input → Output</th>
      </tr>
    </thead>
    <tbody>
      {#each [
        ['|upper', 'Convert the value to uppercase', 'adaeze → ADAEZE'],
        ['|lower', 'Convert the value to lowercase', 'ADAEZE → adaeze'],
        ['|title', 'Convert to Title Case (capitalize first letter of each word)', 'adaeze okonkwo → Adaeze Okonkwo'],
        ['|default:fallback', 'Use fallback string if the cell is empty or null', '(empty) → N/A'],
        ['|trim', 'Remove leading and trailing whitespace', '  hello   → hello'],
      ] as [fmt, desc, example]}
        <tr class="even:bg-neutral-50">
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs">{fmt}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs">{desc}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs text-brand-700">{example}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h3>Formatter Examples</h3>

<pre><code>{`Subject: Certificate for {{full_name|title}}

Dear {{full_name|title}},

Your course "{{course_title|upper}}" has been completed.
Thank you, {{first_name|default:Participant}}!`}</code></pre>

<p>
  For a spreadsheet row where <code>full_name</code> = "adaeze okonkwo" and <code>course_title</code> = "data analysis":
</p>

<pre><code>Subject: Certificate for Adaeze Okonkwo

Dear Adaeze Okonkwo,

Your course "DATA ANALYSIS" has been completed.
Thank you, Adaeze!</code></pre>

<h2>Chaining Formatters</h2>

<p>Formatters cannot currently be chained. Only one formatter per placeholder is supported.</p>

<h2>Missing Mappings</h2>

<p>
  If a placeholder in the template has no mapping (no spreadsheet column assigned), the placeholder text is left as-is in the output.
  For example, an unmapped <code>{'{{certificate_id}}'}</code> will appear literally as <code>{'{{certificate_id}}'}</code> in every generated document.
  MergeMail warns you about unmapped placeholders before you launch the campaign.
</p>

<h2>Empty Cell Handling</h2>

<p>
  If a mapped column has an empty value for a particular row, the placeholder resolves to an empty string unless a <code>|default</code> formatter is applied.
  Use <code>{'{{field|default:N/A}}'}</code> to display a fallback value instead of a blank.
</p>

</div>
