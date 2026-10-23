<svelte:head>
  <title>Payments — MergeMail Docs</title>
  <meta name="description" content="Paystack integration, NGN currency, credit packages, viewing receipts, and payment history in MergeMail." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>Payments</h1>

<p>
  MergeMail uses <strong>Paystack</strong> for payment processing. All transactions are in <strong>Nigerian Naira (NGN)</strong>.
  Card details are handled entirely by Paystack and never pass through MergeMail's servers.
</p>

<h2>Buying Credits</h2>

<ol>
  <li>Go to <strong>Billing</strong> in the sidebar (or visit <code>/dashboard/billing</code>).</li>
  <li>You will see the available credit packages with their prices and credit amounts.</li>
  <li>Click <strong>Buy Now</strong> next to the package you want.</li>
  <li>You will be redirected to the Paystack checkout page.</li>
  <li>Complete the payment using a card, bank transfer, or any Paystack-supported method.</li>
  <li>After successful payment, you are redirected back to MergeMail. Credits appear in your wallet within seconds.</li>
</ol>

<div class="not-prose bg-green-50 border border-green-200 rounded-xl p-4 my-4 flex items-start gap-3">
  <span class="material-symbols-outlined text-green-600 flex-shrink-0" style="font-size:1.25rem">verified</span>
  <div>
    <strong class="text-green-900 text-sm">Webhook verification</strong>
    <p class="text-green-800 text-sm mt-1 mb-0">
      MergeMail verifies every Paystack webhook signature using your Paystack secret key before crediting the wallet.
      This prevents fraudulent credit top-ups.
    </p>
  </div>
</div>

<h2>Credit Packages</h2>

<p>
  Packages are set by the MergeMail admin. Each package has a name, a price in NGN, and a credit count.
  Larger packages offer a better per-credit rate.
  Visit the <a href="/pricing" class="text-brand-600 no-underline hover:underline">pricing page</a> to see current packages.
</p>

<h2>Viewing Receipts</h2>

<p>
  After a successful payment, a receipt is available at <strong>Billing → Payment History → View Receipt</strong>.
  Each receipt shows the package name, credits purchased, amount paid, Paystack reference, and timestamp.
</p>

<h2>Payment History</h2>

<p>
  The <strong>Payment History</strong> section on the Billing page lists all your past transactions, including:
</p>

<ul>
  <li>Date and time of the transaction.</li>
  <li>Package purchased.</li>
  <li>Amount paid (NGN).</li>
  <li>Credits received.</li>
  <li>Payment status (Success, Pending, Failed).</li>
  <li>Paystack reference number.</li>
</ul>

<h2>Failed Payments</h2>

<p>
  If a payment fails at the Paystack checkout, no credits are added. You can retry by initiating a new purchase from the Billing page.
  Failed payments do not appear in the credit ledger.
</p>

<h2>Disputed Payments</h2>

<p>
  If you were charged but did not receive credits, contact Paystack support first with the transaction reference.
  If Paystack confirms the charge was successful but credits were not added, contact MergeMail support via the
  <a href="/contact" class="text-brand-600 no-underline hover:underline">contact form</a> with the Paystack reference number.
</p>

<h2>Tax & Invoicing</h2>

<p>
  MergeMail currently provides transaction receipts. Formal VAT invoices are not yet available.
  If your organization requires a formal invoice for accounting, contact us at
  <a href="/contact" class="text-brand-600 no-underline hover:underline">contact</a>.
</p>

</div>
