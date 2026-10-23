// Default mock values for $app/env/private used in unit tests.
// Individual test files can override with vi.mock() if they need different values.
export const SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
export const SMTP_ENCRYPTION_KEY = '0'.repeat(64); // 32-byte AES-256 key as 64-char hex
export const INTERNAL_WORKER_SECRET = 'mock-worker-secret';
export const DISPATCH_SECRET = 'mock-dispatch-secret';
export const PAYSTACK_SECRET_KEY = 'test_webhook_secret';
export const PAYSTACK_PUBLIC_KEY = 'mock-paystack-public';
