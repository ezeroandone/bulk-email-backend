import {
  SUPABASE_SERVICE_ROLE_KEY,
  SMTP_ENCRYPTION_KEY,
  INTERNAL_WORKER_SECRET,
  PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY
} from '$app/env/private';

/**
 * Validate that all required private environment variables are present.
 * Call this once at server startup (e.g. in hooks.server.ts).
 * Throws if any variable is missing so the deployment fails fast.
 */
export function validateEnv(): void {
  const required: Record<string, string | undefined> = {
    SUPABASE_SERVICE_ROLE_KEY,
    SMTP_ENCRYPTION_KEY,
    INTERNAL_WORKER_SECRET,
    PAYSTACK_SECRET_KEY
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v || v.trim() === '')
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Check your .env file or deployment configuration.'
    );
  }
}

/**
 * Typed accessors for private environment variables.
 * Use these instead of individual imports so TypeScript enforces usage.
 */
export const privateEnv = {
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return SUPABASE_SERVICE_ROLE_KEY ?? '';
  },
  get SMTP_ENCRYPTION_KEY(): string {
    return SMTP_ENCRYPTION_KEY ?? '';
  },
  get INTERNAL_WORKER_SECRET(): string {
    return INTERNAL_WORKER_SECRET ?? '';
  },
  get PAYSTACK_SECRET_KEY(): string {
    return PAYSTACK_SECRET_KEY ?? '';
  },
  get PAYSTACK_PUBLIC_KEY(): string {
    return PAYSTACK_PUBLIC_KEY ?? '';
  }
} as const;
