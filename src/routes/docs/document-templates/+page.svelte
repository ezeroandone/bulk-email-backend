<svelte:head>
  <title>Document Templates — MergeMail Docs</title>
  <meta name="description" content="How to create DOCX and PDF templates for MergeMail, placeholder syntax, and supported variable formats." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Document Templates</h1>

<p>
  MergeMail supports two kinds of document templates: <strong>DOCX</strong> (Microsoft Word) and <strong>PDF</strong> (form-field-based).
  Both produce a personalized per-recipient document that is automatically attached to the outgoing email.
</p>

<h2>DOCX Templates</h2>

<h3>Creating a DOCX Template</h3>

<ol>
  <li>Open Microsoft Word (or LibreOffice Writer).</li>
  <li>Design your document: layout, fonts, logo, tables, etc.</li>
  <li>Place <code>{'{{variable_name}}'}</code> wherever a recipient-specific value should appear.</li>
  <li>Save as <code>.docx</code> format (not <code>.doc</code>).</li>
  <li>Upload to MergeMail at <strong>Templates → New Template</strong>.</li>
</ol>

<h3>Placeholder Syntax</h3>

<p>
  Placeholders use double curly braces: <code>{'{{variable_name}}'}</code>.
  The variable name must match the normalized column name from your spreadsheet.
</p>

<pre><code>{`Dear {{full_name}},

Congratulations on completing {{course_title}} on {{completion_date}}.
Your certificate ID is {{certificate_id}}.

This certificate is issued by the {{institution_name}} Training Department.`}</code></pre>

<h3>Where Placeholders Work</h3>

<ul>
  <li>Main body text (paragraphs, headings, lists)</li>
  <li>Table cells</li>
  <li>Headers and footers</li>
  <li>Text boxes</li>
  <li>Inline fields (e.g. date fields)</li>
</ul>

<p>
  Placeholders inside images are not supported. For image substitution, use separate templates per recipient.
</p>

<h3>Formatters</h3>

<p>
  Apply inline formatters to control how values appear:
</p>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Syntax</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Effect</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Example output</th>
      </tr>
    </thead>
    <tbody>
      {#each [
        ['{{name|upper}}', 'UPPERCASE', 'ADAEZE OKONKWO'],
        ['{{name|lower}}', 'lowercase', 'adaeze okonkwo'],
        ['{{name|title}}', 'Title Case', 'Adaeze Okonkwo'],
        ['{{amount|default:0}}', 'Fallback if empty', '0'],
      ] as [syntax, effect, output]}
        <tr class="even:bg-neutral-50">
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs">{syntax}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs">{effect}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs text-brand-700">{output}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>PDF Templates</h2>

<h3>Creating a PDF Template</h3>

<ol>
  <li>Open your PDF in Adobe Acrobat, LibreOffice, or any PDF editor that supports form fields.</li>
  <li>Add <strong>text form fields</strong> at each position where a variable should appear.</li>
  <li>Name each field exactly the same as the normalized column name in your spreadsheet (e.g. <code>full_name</code>, <code>course_title</code>).</li>
  <li>Save as a standard PDF (<code>.pdf</code>).</li>
  <li>Upload to MergeMail at <strong>Templates → New Template</strong>.</li>
</ol>

<h3>Supported PDF Field Types</h3>

<ul>
  <li><strong>Text fields</strong> — Filled with the string value from the spreadsheet.</li>
  <li><strong>Checkbox fields</strong> — Checked if the spreadsheet value is <code>true</code>, <code>yes</code>, or <code>1</code>; unchecked otherwise.</li>
</ul>

<p>
  After all fields are filled, the PDF is "flattened" (form fields converted to static text) so recipients cannot edit values.
</p>

<h2>Template Preview</h2>

<p>
  After uploading a template, the <strong>Template Detail</strong> page shows all detected placeholders (for DOCX) or form fields (for PDF).
  Click <strong>Preview</strong> to generate a sample document using the first row of any of your datasets.
</p>

<h2>Template Limits</h2>

<ul>
  <li>Maximum template file size: <strong>50 MB</strong>.</li>
  <li>DOCX templates: standard OOXML format only. Macro-enabled <code>.docm</code> files are not accepted.</li>
  <li>PDF templates: PDF version 1.4 through 1.7 supported. PDF/A and encrypted PDFs are not supported.</li>
</ul>

</div>
