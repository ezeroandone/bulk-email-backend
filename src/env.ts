/**
 * SvelteKit 3 environment variable declarations.
 *
 * Variables are dynamic by default (read when the app starts, not inlined at
 * build time), so the app can be built once and deployed to different
 * environments. Each variable has a schema that falls back to an empty string
 * when unset, which makes every variable optional at build time while keeping
 * the exported types as `string`.
 *
 * `public: true` marks browser-safe variables (importable from
 * `$app/env/public`); the rest are server-only (importable from
 * `$app/env/private`). Runtime presence of the server-only secrets is enforced
 * by `validateEnv()` in `src/lib/server/env.ts`.
 */
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  // ── Public (browser-safe) ────────────────────────────────────────────────
  PUBLIC_SUPABASE_URL: { public: true, schema: (value: string | undefined) => value ?? '' },
  PUBLIC_SUPABASE_ANON_KEY: { public: true, schema: (value: string | undefined) => value ?? '' },
  PUBLIC_APP_URL: { public: true, schema: (value: string | undefined) => value ?? '' },
  PUBLIC_APP_NAME: { public: true, schema: (value: string | undefined) => value ?? '' },
  PUBLIC_PAYSTACK_PUBLIC_KEY: { public: true, schema: (value: string | undefined) => value ?? '' },

  // ── Private (server-only) ────────────────────────────────────────────────
  SUPABASE_SERVICE_ROLE_KEY: { schema: (value: string | undefined) => value ?? '' },
  SMTP_ENCRYPTION_KEY: { schema: (value: string | undefined) => value ?? '' },
  INTERNAL_WORKER_SECRET: { schema: (value: string | undefined) => value ?? '' },
  PAYSTACK_SECRET_KEY: { schema: (value: string | undefined) => value ?? '' },
  PAYSTACK_PUBLIC_KEY: { schema: (value: string | undefined) => value ?? '' }
});
