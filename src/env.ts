/**
 * SvelteKit 3 explicit environment variable definitions.
 * Variables defined here are available via:
 *   - `$app/env/public`  — public vars (safe to expose to the browser)
 *   - `$app/env/private` — private vars (server-only)
 *
 * After adding variables here, run `svelte-kit sync` to regenerate types.
 */
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  // ── Public (safe for browser) ────────────────────────────────────
  PUBLIC_SUPABASE_URL: {
    public: true,
    description: 'Supabase project URL'
  },
  PUBLIC_SUPABASE_ANON_KEY: {
    public: true,
    description: 'Supabase anonymous (public) key'
  },
  PUBLIC_APP_URL: {
    public: true,
    description: 'Canonical application URL (e.g. https://app.mergemail.io)'
  },
  PUBLIC_APP_NAME: {
    public: true,
    description: 'Display name of the application'
  },
  PUBLIC_PAYSTACK_PUBLIC_KEY: {
    public: true,
    description: 'Paystack publishable key'
  },

  // ── Private (server-only) ────────────────────────────────────────
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service-role key — bypasses RLS'
  },
  SMTP_ENCRYPTION_KEY: {
    description: '32-byte hex key for encrypting stored SMTP credentials'
  },
  INTERNAL_WORKER_SECRET: {
    description: 'Shared secret for authenticating internal cron/queue calls'
  },
  PAYSTACK_SECRET_KEY: {
    description: 'Paystack secret key'
  },
  PAYSTACK_PUBLIC_KEY: {
    description: 'Paystack public key (server-side reference)'
  }
});
