# MergeMail Deployment Configuration

## GitHub Repositories

| Remote | URL | Purpose |
|--------|-----|---------|
| `frontend` | https://github.com/ezeroandone/bulk-email-frontend.git | Vercel deployment (UI + API routes) |
| `backend` | https://github.com/ezeroandone/bulk-email-backend.git | Reference / future dedicated API server |

Both remotes hold the **same SvelteKit monorepo**. MergeMail is a unified SvelteKit application — there is no separate frontend/backend codebase. The split is a deployment concern only.

## Domains

| Domain | Deployment | What it serves |
|--------|-----------|----------------|
| `bulkemail.ezeroandone.io` | Vercel (connected to `bulk-email-frontend` repo) | Full SvelteKit app — public site, dashboard, auth |
| `api.bulkemail.ezeroandone.io` | Future: dedicated Vercel project or Node server (from `bulk-email-backend` repo) | API routes only (`/api/*`) |

## Current production setup

Deploy `bulk-email-frontend` to Vercel as a SvelteKit project:
- Framework: SvelteKit
- Build command: `npm run build`
- Output: `.vercel/output` (handled by `@sveltejs/adapter-vercel`)
- Domain: `bulkemail.ezeroandone.io`

The `api.bulkemail.ezeroandone.io` subdomain is reserved for a future dedicated deployment. At launch, all API routes are served by the same Vercel project at `bulkemail.ezeroandone.io/api/*`.

## Pushing updates

```bash
# Push to both repos
git push frontend master
git push backend master
```

## Vercel environment variables required

See `.env.example` for the full list. Key variables:
- `PUBLIC_APP_URL` = `https://bulkemail.ezeroandone.io`
- `PUBLIC_SUPABASE_URL` = your Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon key
- `SUPABASE_SECRET_KEY` = your Supabase service role key (server only)
- `PAYSTACK_SECRET_KEY` = server only
- `SMTP_ENCRYPTION_KEY` = 64-char hex (32 bytes AES-256 key)
- `INTERNAL_WORKER_SECRET` = random secret for cron→dispatch auth
