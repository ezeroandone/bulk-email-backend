<svelte:head>
  <title>API Reference — MergeMail Docs</title>
  <meta name="description" content="MergeMail API reference. Full OpenAPI spec available at /openapi.yaml. Authentication, endpoints, and request/response formats." />
</svelte:head>

<div class="prose prose-neutral max-w-none">

<h1>API Reference</h1>

<p>
  MergeMail exposes a REST API for all core platform operations. The full API is documented in
  <a href="/openapi.yaml" target="_blank" class="text-brand-600 no-underline hover:underline">OpenAPI 3.1 format</a>.
</p>

<div class="not-prose flex gap-3 my-6">
  <a
    href="/openapi.yaml"
    target="_blank"
    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 no-underline transition-colors"
  >
    <span class="material-symbols-outlined" style="font-size:1rem">download</span>
    Download openapi.yaml
  </a>
</div>

<h2>Authentication</h2>

<p>
  All API endpoints (except <code>/api/webhooks/paystack</code>) require a Bearer token in the Authorization header.
  Obtain a token by authenticating via Supabase (the token is the Supabase JWT).
</p>

<pre><code>Authorization: Bearer &lt;your-supabase-jwt&gt;</code></pre>

<p>
  In SvelteKit, the JWT is available from the Supabase session:
</p>

<pre><code>const {'{ data: { session } }'} = await supabase.auth.getSession();
const token = session?.access_token;
</code></pre>

<h2>Base URL</h2>

<pre><code>https://your-domain.vercel.app/api</code></pre>

<h2>Endpoints Overview</h2>

<div class="not-prose overflow-x-auto">
  <table class="w-full text-sm border-collapse border border-neutral-200 rounded-lg overflow-hidden">
    <thead class="bg-neutral-100">
      <tr>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Method</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Path</th>
        <th class="border border-neutral-200 px-4 py-2 text-left font-semibold">Description</th>
      </tr>
    </thead>
    <tbody>
      {#each [
        ['GET', '/me', 'Get current user profile'],
        ['GET', '/credits/balance', 'Get credit wallet balance'],
        ['GET', '/credits/transactions', 'List credit ledger entries'],
        ['GET', '/credit-packages', 'List active credit packages'],
        ['POST', '/payments/initialize', 'Initialize a Paystack payment'],
        ['GET', '/payments/{reference}', 'Get payment order status'],
        ['GET', '/datasets', 'List datasets'],
        ['POST', '/datasets', 'Upload and create a dataset'],
        ['GET', '/datasets/{id}', 'Get dataset details'],
        ['DELETE', '/datasets/{id}', 'Delete a dataset'],
        ['GET', '/datasets/{id}/rows', 'Get paginated dataset rows'],
        ['GET', '/templates', 'List document templates'],
        ['POST', '/templates', 'Upload a document template'],
        ['GET', '/templates/{id}', 'Get template details'],
        ['PATCH', '/templates/{id}', 'Update template metadata'],
        ['DELETE', '/templates/{id}', 'Delete a template'],
        ['GET', '/campaigns', 'List campaigns'],
        ['POST', '/campaigns', 'Create a new campaign'],
        ['GET', '/campaigns/{id}', 'Get campaign details'],
        ['POST', '/campaigns/{id}/start', 'Start a campaign'],
        ['POST', '/campaigns/{id}/pause', 'Pause a running campaign'],
        ['POST', '/campaigns/{id}/resume', 'Resume a paused campaign'],
        ['POST', '/campaigns/{id}/cancel', 'Cancel a campaign'],
        ['GET', '/campaigns/{id}/report', 'Get delivery report'],
        ['POST', '/smtp/test', 'Test SMTP configuration'],
        ['POST', '/webhooks/paystack', 'Paystack webhook (no auth)'],
        ['POST', '/internal/dispatch', 'Internal: dispatch next email job'],
      ] as [method, path, desc]}
        <tr class="even:bg-neutral-50">
          <td class="border border-neutral-200 px-4 py-2">
            <span class="font-mono text-xs px-1.5 py-0.5 rounded {method === 'GET' ? 'bg-blue-100 text-blue-800' : method === 'POST' ? 'bg-green-100 text-green-800' : method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">{method}</span>
          </td>
          <td class="border border-neutral-200 px-4 py-2 font-mono text-xs">{path}</td>
          <td class="border border-neutral-200 px-4 py-2 text-xs text-neutral-600">{desc}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>Common Response Format</h2>

<p>All endpoints return JSON with a consistent envelope:</p>

<pre><code>{"{"}"success": true, "data": {"{"} ... {"}"}{"}"}</code></pre>

<p>Error responses:</p>

<pre><code>{"{"}"success": false, "error": "Human-readable message", "code": "ERROR_CODE"{"}"}</code></pre>

<h2>Rate Limiting</h2>

<p>
  There is currently no strict rate limit on individual API calls. Campaign dispatch throughput is limited by your SMTP server's sending rate.
  Abuse of the API may result in account suspension per the Acceptable Use Policy.
</p>

<h2>Notes on Internal Endpoints</h2>

<p>
  The <code>POST /internal/dispatch</code> endpoint is used by the campaign dispatch worker (Vercel cron or manual trigger).
  It requires the internal <code>CRON_SECRET</code> header rather than a user Bearer token.
  Do not call this endpoint directly unless you are building custom dispatch automation.
</p>

</div>
