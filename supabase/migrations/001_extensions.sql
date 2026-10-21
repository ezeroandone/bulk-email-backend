-- ============================================================
-- 001_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions (gen_random_uuid, pgp_sym_encrypt, etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HTTP client for webhooks / outbound HTTP from Supabase functions
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Supabase Queues (pgmq — installed by Supabase automatically on hosted instances;
-- keep this here so local dev / self-hosted instances enable it explicitly)
CREATE EXTENSION IF NOT EXISTS "pgmq";
