-- ============================================================
-- 003_tables.sql
-- All application tables in dependency order
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- One row per authenticated user; mirrors auth.users
-- ------------------------------------------------------------
CREATE TABLE profiles (
    id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email          TEXT        NOT NULL,
    display_name   TEXT,
    avatar_url     TEXT,
    role           user_role   NOT NULL DEFAULT 'user',
    is_suspended   BOOLEAN     NOT NULL DEFAULT false,
    metadata       JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- workspaces
-- Isolated project containers owned by a single user
-- ------------------------------------------------------------
CREATE TABLE workspaces (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    owner_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    settings   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- workspace_members
-- Collaborative access to workspaces
-- ------------------------------------------------------------
CREATE TABLE workspace_members (
    workspace_id UUID   NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role         TEXT   NOT NULL DEFAULT 'viewer',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

-- ------------------------------------------------------------
-- credit_wallets
-- Running credit balance per user
-- ------------------------------------------------------------
CREATE TABLE credit_wallets (
    id               UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID   NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    available_credits BIGINT NOT NULL DEFAULT 0 CHECK (available_credits >= 0),
    reserved_credits  BIGINT NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
    total_purchased  BIGINT NOT NULL DEFAULT 0,
    total_consumed   BIGINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- credit_ledger
-- Immutable audit trail of every credit movement
-- ------------------------------------------------------------
CREATE TABLE credit_ledger (
    id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type             credit_ledger_type NOT NULL,
    delta            BIGINT            NOT NULL,
    balance_after    BIGINT            NOT NULL,
    reference_id     UUID,
    campaign_id      UUID,
    note             TEXT,
    idempotency_key  TEXT              UNIQUE,
    created_at       TIMESTAMPTZ       NOT NULL DEFAULT now()
    -- intentionally no updated_at — ledger rows are immutable
);

-- ------------------------------------------------------------
-- credit_packages
-- Purchasable credit bundles shown on the pricing page
-- ------------------------------------------------------------
CREATE TABLE credit_packages (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    credits     BIGINT  NOT NULL CHECK (credits > 0),
    price_kobo  BIGINT  NOT NULL CHECK (price_kobo > 0),
    currency    TEXT    NOT NULL DEFAULT 'NGN',
    enabled     BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT     NOT NULL DEFAULT 0,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- payment_orders
-- Tracks a Paystack payment intent from creation to fulfilment
-- ------------------------------------------------------------
CREATE TABLE payment_orders (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    package_id      UUID           NOT NULL REFERENCES credit_packages(id),
    reference       TEXT           NOT NULL UNIQUE,
    amount_kobo     BIGINT         NOT NULL CHECK (amount_kobo > 0),
    currency        TEXT           NOT NULL DEFAULT 'NGN',
    status          payment_status NOT NULL DEFAULT 'pending',
    paystack_data   JSONB,
    idempotency_key TEXT           UNIQUE,
    fulfilled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- payment_events
-- Raw Paystack webhook payloads; processed asynchronously
-- ------------------------------------------------------------
CREATE TABLE payment_events (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        TEXT        NOT NULL,
    event_type       TEXT        NOT NULL,
    raw_payload      JSONB       NOT NULL,
    processed        BOOLEAN     NOT NULL DEFAULT false,
    processed_at     TIMESTAMPTZ,
    idempotency_key  TEXT        NOT NULL UNIQUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- smtp_configurations
-- Per-user SMTP credentials (credentials stored encrypted)
-- ------------------------------------------------------------
CREATE TABLE smtp_configurations (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name                 TEXT        NOT NULL,
    encrypted_credentials TEXT       NOT NULL,
    host_hint            TEXT,
    port_hint            INT,
    provider             TEXT,
    is_default           BOOLEAN     NOT NULL DEFAULT false,
    last_tested_at       TIMESTAMPTZ,
    test_result          JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- datasets
-- Uploaded spreadsheets / CSV files
-- ------------------------------------------------------------
CREATE TABLE datasets (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id      UUID        REFERENCES workspaces(id) ON DELETE SET NULL,
    name              TEXT        NOT NULL,
    original_filename TEXT,
    row_count         INT         NOT NULL DEFAULT 0,
    column_count      INT         NOT NULL DEFAULT 0,
    email_column      TEXT,
    status            TEXT        NOT NULL DEFAULT 'ready',
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- dataset_columns
-- Column metadata extracted from a dataset
-- ------------------------------------------------------------
CREATE TABLE dataset_columns (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id       UUID    NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name             TEXT    NOT NULL,
    normalized_name  TEXT    NOT NULL,
    position         INT     NOT NULL,
    sample_values    TEXT[],
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- dataset_rows
-- Individual data rows from a dataset
-- ------------------------------------------------------------
CREATE TABLE dataset_rows (
    id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id        UUID    NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    row_index         INT     NOT NULL,
    data              JSONB   NOT NULL,
    email             TEXT,
    is_valid          BOOLEAN NOT NULL DEFAULT true,
    validation_errors JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- document_templates
-- Uploaded DOCX / PDF / image templates
-- ------------------------------------------------------------
CREATE TABLE document_templates (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id UUID          REFERENCES workspaces(id) ON DELETE SET NULL,
    name         TEXT,
    type         template_type,
    storage_path TEXT          NOT NULL,
    placeholders TEXT[],
    metadata     JSONB,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- document_assets
-- Pre-generated or uploaded individual documents
-- ------------------------------------------------------------
CREATE TABLE document_assets (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id UUID        REFERENCES workspaces(id) ON DELETE SET NULL,
    name         TEXT,
    storage_path TEXT        NOT NULL,
    file_size    BIGINT,
    mime_type    TEXT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- document_mappings
-- Field-to-column mappings for a document template
-- ------------------------------------------------------------
CREATE TABLE document_mappings (
    id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id  UUID  NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
    field_name   TEXT  NOT NULL,
    column_name  TEXT  NOT NULL,
    x            FLOAT,
    y            FLOAT,
    page         INT,
    font_size    FLOAT,
    font_family  TEXT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- email_templates
-- Reusable email subject/body templates with variable support
-- ------------------------------------------------------------
CREATE TABLE email_templates (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id UUID        REFERENCES workspaces(id) ON DELETE SET NULL,
    name         TEXT        NOT NULL,
    subject      TEXT        NOT NULL,
    body_html    TEXT,
    body_text    TEXT,
    variables    TEXT[],
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- campaigns
-- A bulk-send operation linking dataset, template, and SMTP
-- ------------------------------------------------------------
CREATE TABLE campaigns (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id         UUID            REFERENCES workspaces(id) ON DELETE SET NULL,
    name                 TEXT            NOT NULL,
    status               campaign_status NOT NULL DEFAULT 'draft',
    mode                 document_mode   NOT NULL,
    dataset_id           UUID            REFERENCES datasets(id) ON DELETE SET NULL,
    smtp_config_id       UUID            REFERENCES smtp_configurations(id) ON DELETE SET NULL,
    email_template_id    UUID            REFERENCES email_templates(id) ON DELETE SET NULL,
    document_template_id UUID            REFERENCES document_templates(id) ON DELETE SET NULL,
    config_snapshot      JSONB,
    recipient_count      INT             NOT NULL DEFAULT 0,
    credits_reserved     BIGINT          NOT NULL DEFAULT 0,
    started_at           TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    metadata             JSONB,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- delivery_jobs
-- Declared before campaign_recipients because campaign_recipients
-- holds a nullable FK to delivery_jobs; the circular dependency is
-- broken by deferring the FK addition below.
-- ------------------------------------------------------------
CREATE TABLE delivery_jobs (
    id                   UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id          UUID                NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    -- campaign_recipient_id FK added after campaign_recipients is created
    campaign_recipient_id UUID,
    user_id              UUID                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    smtp_config_id       UUID                REFERENCES smtp_configurations(id) ON DELETE SET NULL,
    status               delivery_job_status NOT NULL DEFAULT 'draft',
    attempt_count        INT                 NOT NULL DEFAULT 0,
    max_attempts         INT                 NOT NULL DEFAULT 3,
    next_attempt_at      TIMESTAMPTZ,
    leased_until         TIMESTAMPTZ,
    leased_by            TEXT,
    accepted_at          TIMESTAMPTZ,
    failed_at            TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    last_error           TEXT,
    metadata             JSONB,
    created_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- campaign_recipients
-- One row per (campaign × recipient) pair
-- ------------------------------------------------------------
CREATE TABLE campaign_recipients (
    id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id       UUID                NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    dataset_row_id    UUID                REFERENCES dataset_rows(id) ON DELETE SET NULL,
    email             TEXT                NOT NULL,
    row_data          JSONB               NOT NULL,
    document_asset_id UUID                REFERENCES document_assets(id) ON DELETE SET NULL,
    delivery_job_id   UUID                REFERENCES delivery_jobs(id) ON DELETE SET NULL,
    status            delivery_job_status NOT NULL DEFAULT 'draft',
    created_at        TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- Now that campaign_recipients exists we can add the FK from delivery_jobs
ALTER TABLE delivery_jobs
    ADD CONSTRAINT delivery_jobs_campaign_recipient_id_fkey
    FOREIGN KEY (campaign_recipient_id)
    REFERENCES campaign_recipients(id)
    ON DELETE SET NULL;

-- ------------------------------------------------------------
-- delivery_attempts
-- Per-attempt send log for a delivery job
-- ------------------------------------------------------------
CREATE TABLE delivery_attempts (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_job_id  UUID        NOT NULL REFERENCES delivery_jobs(id) ON DELETE CASCADE,
    attempt_number   INT         NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL,
    completed_at     TIMESTAMPTZ,
    status           TEXT        NOT NULL,
    smtp_response    TEXT,
    error_message    TEXT,
    error_code       TEXT,
    is_transient     BOOLEAN,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- file_matches
-- Matches pre-existing document assets to recipients
-- ------------------------------------------------------------
CREATE TABLE file_matches (
    id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id           UUID    NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_recipient_id UUID    REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    document_asset_id     UUID    REFERENCES document_assets(id) ON DELETE SET NULL,
    match_method          TEXT,
    confidence            FLOAT,
    is_confirmed          BOOLEAN NOT NULL DEFAULT false,
    is_excluded           BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- audit_logs
-- Immutable action trail (no updated_at)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    action      TEXT        NOT NULL,
    target_type TEXT,
    target_id   UUID,
    metadata    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    -- intentionally no updated_at — audit rows are immutable
);

-- ------------------------------------------------------------
-- platform_settings
-- Key/value store for application-wide configuration
-- ------------------------------------------------------------
CREATE TABLE platform_settings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT        NOT NULL UNIQUE,
    value       JSONB       NOT NULL,
    description TEXT,
    updated_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    -- no created_at managed by trigger; updated_at managed manually
);
