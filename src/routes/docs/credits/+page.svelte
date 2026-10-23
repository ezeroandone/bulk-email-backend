<svelte:head>
  <title>Credits — MergeMail Docs</title>
  <meta name="description" content="How the MergeMail credit system works: 1 credit = 1 email, no monthly renewal, reserved vs available, checking your balance." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Credits</h1>

<p>
  MergeMail uses a prepaid credit system. You buy credits in packages and spend them as you send campaigns.
  There are no monthly subscriptions and credits never expire.
</p>

<h2>What Is 1 Credit?</h2>

<p>
  <strong>1 credit = 1 email successfully dispatched to an SMTP server.</strong>
  Attaching a generated document does not cost extra — the attachment is included in the single credit for that email.
</p>

<p>
  Credits are deducted <em>after</em> the SMTP server accepts the message, not when the campaign starts or when the job is queued.
  This means you are only charged for emails that have actually been handed off to your mail server.
</p>

<h2>Free Credits on Signup</h2>

<p>
  Every new account receives <strong>100 free credits</strong> automatically on signup. No credit card or payment is required.
  These credits appear in your wallet immediately and are subject to the same rules as purchased credits.
</p>

<h2>Reserved vs Available Credits</h2>

<p>When you launch a campaign, credits are not immediately deducted. Instead, they move through two states:</p>

<ol>
  <li>
    <strong>Reserved:</strong> When the campaign starts, the estimated credit cost (= number of pending recipients) is "reserved" from your available balance.
    This prevents you from spending the same credits on two campaigns simultaneously.
  </li>
  <li>
    <strong>Consumed:</strong> As each email is successfully sent, 1 reserved credit converts to consumed.
  </li>
  <li>
    <strong>Released:</strong> If the campaign is cancelled, paused, or a recipient is skipped, reserved credits for those recipients are released back to available.
  </li>
</ol>

<div class="not-prose bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-4">
  <p class="text-sm text-neutral-700 font-medium mb-2">Example:</p>
  <p class="text-sm text-neutral-600 mb-1">You have 500 available credits. You launch a campaign with 300 recipients.</p>
  <ul class="text-sm text-neutral-600 space-y-1 list-disc list-inside">
    <li>Available: 500 → 200 (300 reserved)</li>
    <li>After 150 sent: Reserved: 150, Consumed: 150</li>
    <li>You cancel the campaign: 150 reserved released back → Available: 350</li>
  </ul>
</div>

<h2>Credits Never Expire</h2>

<p>
  Unlike many SaaS platforms, MergeMail credits do not expire on a monthly or annual schedule.
  Credits purchased in January 2024 are still valid in December 2026. There is no "use it or lose it" policy.
</p>

<h2>Checking Your Balance</h2>

<p>Your credit balance is visible in the top-right corner of every dashboard page (the credit badge).</p>

<p>For a detailed breakdown, go to <strong>Billing</strong> in the sidebar:</p>

<ul>
  <li>The <strong>Credit Ledger</strong> tab shows every credit event: signups, purchases, campaign debits, refunds, and admin adjustments.</li>
  <li>Each entry shows the type, amount (positive = credit added, negative = credit deducted), and balance after the transaction.</li>
</ul>

<h2>Credit Refunds</h2>

<p>Credits are automatically refunded in the following situations:</p>

<ul>
  <li>An email fails after all 3 retry attempts (the single credit for that recipient is refunded).</li>
  <li>A campaign is cancelled after starting — all reserved credits for pending (unsent) recipients are released.</li>
  <li>A campaign is cancelled before starting — all reserved credits are released.</li>
</ul>

<p>
  Cash refunds for unused credits are not available. If you believe credits were incorrectly deducted, contact support via the
  <a href="/contact" class="text-brand-600 no-underline hover:underline">contact form</a>.
</p>

<h2>Insufficient Credits</h2>

<p>
  If your available credit balance is lower than the number of recipients in a campaign, MergeMail will not let you launch.
  You will see a warning showing how many additional credits are needed.
  Visit the <strong>Billing</strong> page to purchase more credits.
</p>

</div>
