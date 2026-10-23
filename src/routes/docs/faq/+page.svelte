<script lang="ts">
  let openFaq = $state<number | null>(null);

  const faqs = [
    { q: 'How do I authenticate API requests?', a: 'All API endpoints require a Supabase JWT Bearer token in the Authorization header. The token is available from supabase.auth.getSession() as session.access_token. JWTs expire after 1 hour; use supabase.auth.onAuthStateChange to refresh them.' },
    { q: 'What is the campaign dispatch mechanism?', a: 'Campaign dispatch is handled by the POST /api/internal/dispatch endpoint, which processes one delivery job at a time in a queue. It is triggered by a Vercel cron job defined in vercel.json. For local development, call it manually or run the cron handler directly.' },
    { q: 'How do I get a list of recipients for a campaign?', a: 'GET /api/campaigns/{id}/report returns the full delivery report including per-recipient status, error messages, and SMTP responses. Use the page and page_size query params for pagination.' },
    { q: 'What does the POST /api/datasets endpoint expect?', a: 'A multipart/form-data request with a "file" field containing the XLSX or CSV. The server parses the file, normalizes headers, and stores the dataset. Columns and preview rows are returned in the response.' },
    { q: 'How do I upload a document template?', a: 'POST /api/templates expects a multipart/form-data body with "file" (DOCX or PDF) and optional "name" and "description" text fields. The server extracts placeholders (for DOCX) or form field names (for PDF) and returns them in the response.' },
    { q: 'What triggers the Paystack webhook?', a: 'Paystack sends a POST to /api/webhooks/paystack on events like charge.success, charge.failure, and transfer.success. MergeMail verifies the HMAC-SHA512 signature using the PAYSTACK_SECRET_KEY environment variable before processing.' },
    { q: 'Are there any row limits on datasets?', a: 'There is no hard row limit in the API. Practical limits are set by memory during parsing (around 50,000 rows for an XLSX file under 10 MB). For very large lists, split them across multiple datasets.' },
    { q: 'Can I update a campaign\'s email body after it has started?', a: 'No. Once a campaign is in the processing state, the email content is locked. Pause the campaign, cancel it, and create a new one with the corrected content.' },
    { q: 'What is the CRON_SECRET and how is it used?', a: 'CRON_SECRET is an environment variable (set in Vercel settings) used to authenticate internal cron-triggered requests to /api/internal/dispatch. The cron job sends the secret in the x-cron-secret header. Requests without a valid secret are rejected with 401.' },
    { q: 'How do I handle pagination in list endpoints?', a: 'List endpoints (GET /datasets, GET /templates, GET /campaigns) accept page (1-based) and page_size (default 20, max 100) query parameters. The response envelope includes total, page, page_size, and total_pages fields.' },
    { q: 'Can I delete a campaign that is currently processing?', a: 'No. A running campaign must be paused or cancelled before it can be deleted. Use POST /campaigns/{id}/pause then POST /campaigns/{id}/cancel. After cancellation, the campaign can be deleted from the dashboard.' },
    { q: 'What does the /api/smtp/test endpoint do?', a: 'It accepts SMTP credentials in the request body, attempts to authenticate with the SMTP server, and returns success or a detailed error. It does NOT save the credentials — use the Settings → SMTP page for that.' },
    { q: 'How are SMTP credentials stored?', a: 'Username and password are each encrypted with AES-256-GCM using a server-side encryption key (SMTP_ENCRYPTION_KEY env var). The IV and auth tag are stored alongside the ciphertext. Decryption happens only in memory during campaign dispatch.' },
    { q: 'What HTTP status codes does the API use?', a: '200 for success, 201 for resource created, 400 for validation errors, 401 for unauthenticated, 403 for unauthorized (authenticated but wrong resource), 404 for not found, 429 for rate limit, 500 for server error. Error responses always include a JSON body with "success": false and "error".' },
    { q: 'Is there an SDK or client library?', a: 'There is no official SDK. The API is a standard REST API over HTTPS. Any HTTP client (fetch, axios, node-fetch, etc.) works. The OpenAPI spec at /openapi.yaml can be used to generate a typed client with tools like openapi-typescript or swagger-codegen.' }
  ];

  function toggleFaq(i: number) {
    openFaq = openFaq === i ? null : i;
  }
</script>

<svelte:head>
  <title>Developer FAQ — MergeMail Docs</title>
  <meta name="description" content="Technical FAQ for MergeMail developers: authentication, API formats, dispatch, webhooks, SMTP encryption, and pagination." />
</svelte:head>

<h1 class="text-3xl font-extrabold text-neutral-900 mb-3">Developer FAQ</h1>
<p class="text-neutral-600 mb-8">Technical questions about the MergeMail API, campaign engine, and internals.</p>

<div class="space-y-3">
  {#each faqs as faq, i}
    <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <button
        class="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-50 transition-colors"
        onclick={() => toggleFaq(i)}
        aria-expanded={openFaq === i}
      >
        <span class="font-medium text-neutral-900 pr-4 text-sm">{faq.q}</span>
        <span class="material-symbols-outlined text-neutral-400 flex-shrink-0 transition-transform {openFaq === i ? 'rotate-180' : ''}">
          expand_more
        </span>
      </button>
      {#if openFaq === i}
        <div class="px-5 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">
          {faq.a}
        </div>
      {/if}
    </div>
  {/each}
</div>
