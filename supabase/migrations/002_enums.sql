-- ============================================================
-- 002_enums.sql
-- Application-wide enumerated types
-- ============================================================

-- Account roles
CREATE TYPE user_role AS ENUM (
    'user',
    'admin'
);

-- Campaign lifecycle states
CREATE TYPE campaign_status AS ENUM (
    'draft',
    'queued',
    'processing',
    'paused',
    'completed',
    'cancelled',
    'failed'
);

-- Individual delivery job states
CREATE TYPE delivery_job_status AS ENUM (
    'draft',
    'queued',
    'processing',
    'accepted',
    'failed',
    'retrying',
    'cancelled',
    'uncertain',
    'completed'
);

-- Paystack payment states
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'successful',
    'failed',
    'abandoned',
    'reversed',
    'refunded',
    'disputed'
);

-- Credit ledger movement types
CREATE TYPE credit_ledger_type AS ENUM (
    'signup_grant',
    'purchase',
    'reservation',
    'settlement',
    'release',
    'admin_adjustment',
    'refund'
);

-- Campaign document mode
CREATE TYPE document_mode AS ENUM (
    'existing',
    'template',
    'email_only'
);

-- Document template formats
CREATE TYPE template_type AS ENUM (
    'docx',
    'pdf',
    'image'
);
