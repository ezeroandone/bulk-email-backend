-- ============================================================
-- seed.sql
-- Initial data for MergeMail
--
-- Run this AFTER all migrations have been applied.
--
-- BOOTSTRAPPING AN ADMIN ACCOUNT
-- ---------------------------------------------------------------
-- After a user registers, run the following in the Supabase
-- SQL editor (replace with the actual admin email address):
--
--   UPDATE profiles
--   SET role = 'admin'
--   WHERE email = 'your@email.com';
--
-- ============================================================

-- ------------------------------------------------------------
-- Credit packages
-- Prices are stored in kobo (smallest NGN unit: 1 NGN = 100 kobo)
-- ------------------------------------------------------------

INSERT INTO credit_packages (name, credits, price_kobo, currency, enabled, sort_order, metadata)
VALUES
    (
        'Starter',
        500,
        100000,   -- ₦1,000
        'NGN',
        true,
        1,
        '{"highlighted": false, "description": "Perfect for small batches and one-off sends."}'::jsonb
    ),
    (
        'Growth',
        2000,
        350000,   -- ₦3,500
        'NGN',
        true,
        2,
        '{"highlighted": true, "description": "Most popular — ideal for growing teams and regular campaigns."}'::jsonb
    ),
    (
        'Professional',
        5000,
        800000,   -- ₦8,000
        'NGN',
        true,
        3,
        '{"highlighted": false, "description": "High-volume sending for professional and enterprise use."}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Platform settings
-- Values are stored as JSONB scalars so the application can
-- cast them to the appropriate type at runtime.
-- ------------------------------------------------------------

INSERT INTO platform_settings (key, value, description)
VALUES
    (
        'max_recipients_per_campaign',
        '10000'::jsonb,
        'Maximum number of recipients allowed in a single campaign.'
    ),
    (
        'max_file_size_mb',
        '50'::jsonb,
        'Maximum allowed upload size in megabytes for any file type.'
    ),
    (
        'sending_rate_per_minute',
        '100'::jsonb,
        'Maximum number of emails the system will dispatch per minute per campaign.'
    ),
    (
        'signup_credits',
        '100'::jsonb,
        'Number of free credits awarded automatically when a new account is created.'
    ),
    (
        'maintenance_mode',
        'false'::jsonb,
        'When true, the application returns a maintenance page to all non-admin users.'
    ),
    (
        'feature_document_generation',
        'true'::jsonb,
        'Feature flag — enables the document generation workflow (template mode).'
    ),
    (
        'INTERNAL_WORKER_SECRET',
        '{"secret": "change-me-before-production"}'::jsonb,
        'Shared secret used by the delivery worker to authenticate claim_delivery_jobs() calls. Replace with a strong random value in production.'
    )
ON CONFLICT (key) DO NOTHING;
