# MergeMail

MergeMail is a SaaS platform for bulk document generation, mail merge, and email automation. Upload a spreadsheet of recipients, map its columns to a template, generate personalized documents (DOCX/PDF or a ZIP of existing files), and send customized emails at scale through your own SMTP server — with per-recipient attachments, real-time delivery tracking, and a credit-based billing system.

## Tech Stack

- **Frontend:** SvelteKit 5 (Svelte 5 runes), TypeScript, Tailwind CSS, Material Symbols icons
- **Backend:** SvelteKit server routes, Supabase (PostgreSQL, Row Level Security, SECURITY DEFINER functions)
- **Database:** Supabase PostgreSQL — 23 tables, RLS policies, 9 atomic functions
- **Auth:** Supabase Auth with Google OAuth (PKCE flow)
- **Payments:** Paystack (NGN, HMAC-SHA512 webhook verification)
- **Email:** Nodemailer (user-supplied SMTP credentials, AES-256-GCM encrypted at rest)
- **Document generation:** docxtemplater (DOCX), pdf-lib (PDF form-field fill), JSZip (existing-doc archives)
- **Spreadsheet parsing:** ExcelJS (XLSX), PapaParse (CSV)
- **Queue / scheduling:** pgmq (PostgreSQL Message Queue) driven by Supabase Cron
- **Realtime:** Supabase Realtime on the `delivery_jobs` table
- **Deployment:** Vercel (adapter-vercel, Node.js 22 runtime)

## Prerequisites

- Node.js 20+ (Node 22 recommended for the Vercel runtime)
- npm
- Supabase CLI — `npm install -g supabase`
- Vercel CLI — `npm install -g vercel` (only needed for deployment)

## Quick Start (Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template and fill in the values (see below)
cp .env.example .env.local

# 3. Start a local Supabase instance (Docker required)
supabase start

# 4. Apply the database schema / migrations
supabase db push

# 5. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

Every variable listed in `.env.example` must be present. Variables prefixed with `PUBLIC_` are safe to expose to the browser (they are inlined into client bundles); the rest are server-only and must never be exposed to the client.

| Variable | Scope | Description |
|----------|-------|-------------|
| `PUBLIC_SUPABASE_URL` | Browser-safe | Your Supabase project URL, e.g. `https://yourproject.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Supabase anon/public key (used by the client to talk to Supabase) |
| `PUBLIC_APP_URL` | Browser-safe | The public URL of your app, e.g. `http://localhost:5173` (dev) or `https://your-app.vercel.app` (prod) |
| `PUBLIC_APP_NAME` | Browser-safe | Display name shown in the UI, e.g. `MergeMail` |
| `PUBLIC_PAYSTACK_PUBLIC_KEY` | Browser-safe | Paystack public key (safe to embed in checkout flows) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase service role key — bypasses RLS. Never expose to the browser |
| `SMTP_ENCRYPTION_KEY` | Server-only | 32-byte / 64-char hex key for AES-256-GCM SMTP credential encryption |
| `INTERNAL_WORKER_SECRET` | Server-only | Bearer token authenticating the cron/queue dispatch endpoint |
| `PAYSTACK_SECRET_KEY` | Server-only | Paystack secret key used for transaction init/verify and webhook signing |
| `PAYSTACK_PUBLIC_KEY` | Server-only | Paystack public key read by server code (do not confuse with the `PUBLIC_` variant) |

> Google OAuth credentials (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) are **not** environment variables here — they are configured directly in the Supabase Auth dashboard (see Google OAuth Setup).

Generate an `SMTP_ENCRYPTION_KEY` with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Apply the schema and migrations against your project database:
   ```bash
   supabase db push --db-url "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```
3. Enable the **Google** OAuth provider in Authentication → Providers (see Google OAuth Setup below).
4. In Authentication → URL Configuration, set **Site URL** to your app URL and add your redirect URLs (`http://localhost:5173` for dev, your Vercel URL for prod). Supabase's own OAuth callback (`https://yourproject.supabase.co/auth/v1/callback`) is the authorized redirect URI you register in Google Cloud.
5. Enable **Realtime** on the `delivery_jobs` table so the dashboard can stream delivery status live: Database → Replication → Tables → enable `delivery_jobs`.
6. Create the email delivery queue:
   ```sql
   SELECT pgmq.create('email_delivery');
   ```
7. Set up the Supabase Cron job that drives the dispatcher. In Database → Extensions, enable `pg_cron` and `pg_net`, then schedule a job (every minute) that POSTs to the internal dispatch endpoint:
   ```sql
   SELECT cron.schedule(
     'mergemail-dispatch',
     '* * * * *',
     $$
     SELECT net.http_post(
       url := 'https://your-app.vercel.app/api/internal/dispatch',
       headers := '{"Authorization": "Bearer YOUR_INTERNAL_WORKER_SECRET", "Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     );
     $$
   );
   ```

## Google OAuth Setup

Google OAuth is configured in the **Supabase Auth dashboard**, not in SvelteKit environment variables. Steps:

1. In the [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application).
2. Add the Supabase callback as an authorized redirect URI:
   `https://yourproject.supabase.co/auth/v1/callback`
3. In your Supabase Dashboard → Authentication → Providers → **Google**, enable the provider and paste the Google **Client ID** and **Client Secret**.
4. Confirm the Site URL / Redirect URLs in Authentication → URL Configuration point back at your app.

You do **not** set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.local` — Supabase manages them.

## Vercel Deployment

1. Deploy with the CLI or by connecting the repo in the Vercel dashboard:
   ```bash
   vercel --prod
   ```
2. In Vercel → Project → Settings → Environment Variables, add **every** variable from `.env.example`. Server-only variables must **not** have the `PUBLIC_` prefix (they must not be inlined into the client bundle).
3. `vercel.json` configures the framework, build command, and a 30-second `maxDuration` for the internal dispatch endpoint (`src/routes/api/internal/dispatch/+server.ts`), which is the function the Supabase Cron calls every minute.
4. After the first deploy, add your Vercel URL to Supabase Auth → URL Configuration → Site URL and Redirect URLs.

## Paystack Setup

1. Create an account at [paystack.com](https://paystack.com) and grab your test (and later live) keys.
2. Set the environment variables:
   - `PAYSTACK_SECRET_KEY` (server-only) — used to initialize/verify transactions and sign webhooks.
   - `PUBLIC_PAYSTACK_PUBLIC_KEY` (browser-safe) — used in client-side checkout flows.
3. Configure the webhook in the Paystack Dashboard → Settings → Webhooks:
   - **Webhook URL:** `https://your-app.vercel.app/api/webhooks/paystack`
   - Enable the `charge.success` event.
4. The webhook handler verifies the HMAC-SHA512 signature of the raw request body against `PAYSTACK_SECRET_KEY`, re-verifies the transaction with Paystack, then credits the wallet via an idempotent `apply_payment` RPC.

## Admin Bootstrap

After your first sign-in, promote your own account to admin so you can reach the admin dashboard at `/admin`. Run this in the Supabase SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Running Tests

Unit tests (Vitest):
```bash
npm run test -- --run
```

E2E tests (Playwright). The Playwright config auto-starts the dev server on port 5173 via the `webServer` block:
```bash
npm run test:e2e
```

Type checking:
```bash
npx tsc --noEmit
```

## Architecture Overview

```
Browser (SvelteKit UI)
        │
        ▼
SvelteKit server routes ──► Supabase (PostgreSQL, Auth, Storage)
        │                         ▲
        ▼                         │ scheduled every minute
Vercel Node function            Supabase Cron + pg_net
/api/internal/dispatch ─────────┘
        │
        ▼
pgmq 'email_delivery' queue  ──►  claim_delivery_jobs()  ──►  Nodemailer (your SMTP)
```

- The SvelteKit frontend talks to Supabase for data, auth, and file storage (RLS-protected with the anon key; server routes use the service role key for privileged operations).
- When a campaign is launched, delivery jobs are enqueued into the `email_delivery` pgmq queue and credits are reserved.
- A Supabase Cron job POSTs to the Vercel dispatch endpoint every minute (authenticated with `Bearer ${INTERNAL_WORKER_SECRET}`). The dispatcher atomically claims a batch of jobs, substitutes variables, generates/attaches documents, decrypts SMTP credentials, sends via Nodemailer, and updates job status — with exponential-backoff retries for transient failures and credit refunds for permanent failures.
- Supabase Realtime streams `delivery_jobs` changes to the dashboard so progress updates live.

## Troubleshooting

- **OAuth redirect mismatch / "redirect_uri_mismatch"**: The authorized redirect URI in Google Cloud Console must exactly be `https://yourproject.supabase.co/auth/v1/callback`, and the Supabase Auth Site URL / Redirect URLs must include your app URL. A trailing slash or wrong host will break the round-trip.
- **SMTP connection failures**: Use a Google App Password (not your account password) for Gmail. Verify the host/port/TLS settings and that your network allows outbound SMTP. The SSRF guard blocks private/loopback/metadata hosts — don't point SMTP at internal addresses.
- **Missing env vars / build fails**: All `PUBLIC_*` variables must be set at build time (they are inlined into the client bundle). Server-only vars only need to be set at runtime, but `validateEnv()` runs at startup and will fail fast if `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_ENCRYPTION_KEY`, `INTERNAL_WORKER_SECRET`, or `PAYSTACK_SECRET_KEY` are missing.
- **pgmq not created**: If the dispatcher reports it cannot claim jobs, run `SELECT pgmq.create('email_delivery');` in the Supabase SQL Editor. The queue must exist before campaigns are launched.
- **Credits not added after payment**: Confirm the Paystack webhook is reachable, the `charge.success` event is enabled, and `PAYSTACK_SECRET_KEY` matches the key on the Paystack webhook page. The webhook always returns 200 to Paystack; check the `payment_events` table and server logs for the verification/fulfillment outcome.
- **TypeScript errors after pulling updates**: Run `npm run prepare` to regenerate SvelteKit type declarations.
