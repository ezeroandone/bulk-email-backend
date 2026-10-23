<svelte:head>
  <title>Email Campaigns — MergeMail Docs</title>
  <meta name="description" content="How to compose emails, configure subjects and bodies, run email-only campaigns, and interpret the campaign report." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Email Campaigns</h1>

<p>
  A campaign is the unit of work in MergeMail. It ties together a dataset, an optional document template,
  your SMTP configuration, and the email content, then dispatches a personalized email to each recipient.
</p>

<h2>Campaign Modes</h2>

<ul>
  <li><strong>Mode A — Email + Generated Document:</strong> MergeMail generates a DOCX or PDF from a template for each recipient and attaches it.</li>
  <li><strong>Mode B — Email + Existing Documents (ZIP):</strong> You upload pre-made files; MergeMail matches and attaches them.</li>
  <li><strong>Mode C — Email Only:</strong> No attachment. The personalized email body is the complete message.</li>
</ul>

<h2>Email Composition</h2>

<h3>Subject Line</h3>

<p>
  The subject line supports <code>{'{{placeholder}}'}</code> syntax and all formatters.
  Keep subject lines under 60 characters for best display in email clients.
</p>

<pre><code>Your certificate for {{course_title|title}} is ready, {{first_name|title}}!</code></pre>

<h3>Body — HTML Mode</h3>

<p>
  HTML mode enables rich formatting: bold, italic, links, tables, and images (via external URL).
  Write raw HTML in the editor or use the toolbar for common formatting.
</p>

<pre><code>&lt;p&gt;Dear &lt;strong&gt;{{full_name|title}}&lt;/strong&gt;,&lt;/p&gt;
&lt;p&gt;Congratulations on completing &lt;em&gt;{{course_title}}&lt;/em&gt;.&lt;/p&gt;
&lt;p&gt;Please find your certificate attached.&lt;/p&gt;</code></pre>

<h3>Body — Plain Text Mode</h3>

<p>
  Plain text is useful for notifications, transactional messages, and recipients whose mail clients block HTML.
  Line breaks are preserved.
</p>

<pre><code>Dear {{full_name|title}},

Congratulations on completing {{course_title}}.
Your certificate is attached.

Best regards,
The Training Team</code></pre>

<h2>Email Templates</h2>

<p>
  Save frequently used email subjects and bodies as <strong>Email Templates</strong> in the Email Templates library.
  Select a saved template when creating a campaign to pre-fill the subject and body.
  Changes made in the campaign editor do not affect the saved template.
</p>

<h2>From Name and Reply-To</h2>

<p>
  The sender name and reply-to address are configured in <strong>Settings → SMTP</strong>.
  All campaigns from your account use the same from name and reply-to address as configured in your SMTP settings.
</p>

<h2>Campaign Lifecycle</h2>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Status</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Description</th>
      </tr>
    </thead>
    <tbody>
      {#each [
        ['draft', 'Campaign is being configured. No emails have been sent.'],
        ['ready', 'Campaign is fully configured and ready to launch.'],
        ['queued', 'Campaign is waiting in the dispatch queue.'],
        ['processing', 'Emails are actively being sent.'],
        ['paused', 'Sending has been manually paused. Resume to continue.'],
        ['completed', 'All recipients processed. Delivery report is final.'],
        ['failed', 'A fatal error prevented the campaign from completing.'],
        ['cancelled', 'Campaign was manually cancelled. Pending credits released.'],
      ] as [status, desc]}
        <tr class="even:bg-neutral-50">
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs">{status}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs">{desc}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>Reading the Campaign Report</h2>

<p>
  After a campaign starts, the report page shows aggregate stats and per-recipient status.
</p>

<ul>
  <li><strong>Sent:</strong> Email accepted by the SMTP server. 1 credit deducted.</li>
  <li><strong>Failed:</strong> All retry attempts exhausted. 1 credit refunded.</li>
  <li><strong>Pending:</strong> Not yet processed. Credits still reserved.</li>
  <li><strong>Skipped:</strong> Row was intentionally excluded (e.g. missing email address).</li>
</ul>

<p>Click a row to expand the SMTP response or error message for that recipient.</p>

<h2>Retrying Failed Deliveries</h2>

<p>
  Automatic retries happen up to 3 times with exponential backoff (5 min → 20 min → 60 min).
  After all retries are exhausted, the recipient is marked <strong>Failed</strong> and the credit is refunded.
  You can re-run a campaign for only the failed recipients by duplicating it with a filtered dataset.
</p>

</div>
