-- ============================================================
-- 007_indexes.sql
-- Performance indexes on foreign keys and common query columns
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
CREATE INDEX idx_profiles_email    ON profiles (email);
CREATE INDEX idx_profiles_role     ON profiles (role);

-- ------------------------------------------------------------
-- workspaces
-- ------------------------------------------------------------
CREATE INDEX idx_workspaces_owner_id ON workspaces (owner_id);

-- ------------------------------------------------------------
-- workspace_members
-- ------------------------------------------------------------
-- PK is (workspace_id, user_id) — covers workspace_id look-ups.
-- Add the reverse for "which workspaces does user X belong to?"
CREATE INDEX idx_workspace_members_user_id ON workspace_members (user_id);

-- ------------------------------------------------------------
-- credit_wallets
-- ------------------------------------------------------------
-- user_id already has a UNIQUE constraint (= unique index); no extra needed.

-- ------------------------------------------------------------
-- credit_ledger
-- ------------------------------------------------------------
CREATE INDEX idx_credit_ledger_user_created
    ON credit_ledger (user_id, created_at DESC);

-- Idempotency look-up (already UNIQUE, which creates an index automatically).
-- Explicit index on campaign_id for campaign-level ledger queries
CREATE INDEX idx_credit_ledger_campaign_id  ON credit_ledger (campaign_id);
CREATE INDEX idx_credit_ledger_reference_id ON credit_ledger (reference_id);

-- ------------------------------------------------------------
-- payment_orders
-- ------------------------------------------------------------
-- reference is UNIQUE → index already exists
CREATE INDEX idx_payment_orders_user_id ON payment_orders (user_id);
CREATE INDEX idx_payment_orders_status  ON payment_orders (status);

-- ------------------------------------------------------------
-- payment_events
-- ------------------------------------------------------------
CREATE INDEX idx_payment_events_reference  ON payment_events (reference);
CREATE INDEX idx_payment_events_processed  ON payment_events (processed) WHERE processed = false;

-- ------------------------------------------------------------
-- smtp_configurations
-- ------------------------------------------------------------
CREATE INDEX idx_smtp_configurations_user_id ON smtp_configurations (user_id);

-- ------------------------------------------------------------
-- datasets
-- ------------------------------------------------------------
CREATE INDEX idx_datasets_user_id      ON datasets (user_id);
CREATE INDEX idx_datasets_workspace_id ON datasets (workspace_id);

-- ------------------------------------------------------------
-- dataset_columns
-- ------------------------------------------------------------
CREATE INDEX idx_dataset_columns_dataset_id ON dataset_columns (dataset_id);

-- ------------------------------------------------------------
-- dataset_rows
-- ------------------------------------------------------------
CREATE INDEX idx_dataset_rows_dataset_row_index
    ON dataset_rows (dataset_id, row_index);

CREATE INDEX idx_dataset_rows_dataset_email
    ON dataset_rows (dataset_id, email);

-- ------------------------------------------------------------
-- document_templates
-- ------------------------------------------------------------
CREATE INDEX idx_document_templates_user_id      ON document_templates (user_id);
CREATE INDEX idx_document_templates_workspace_id ON document_templates (workspace_id);

-- ------------------------------------------------------------
-- document_assets
-- ------------------------------------------------------------
CREATE INDEX idx_document_assets_user_id      ON document_assets (user_id);
CREATE INDEX idx_document_assets_workspace_id ON document_assets (workspace_id);

-- ------------------------------------------------------------
-- document_mappings
-- ------------------------------------------------------------
CREATE INDEX idx_document_mappings_template_id ON document_mappings (template_id);

-- ------------------------------------------------------------
-- email_templates
-- ------------------------------------------------------------
CREATE INDEX idx_email_templates_user_id ON email_templates (user_id);

-- ------------------------------------------------------------
-- campaigns
-- ------------------------------------------------------------
CREATE INDEX idx_campaigns_user_status
    ON campaigns (user_id, status);

CREATE INDEX idx_campaigns_workspace_id ON campaigns (workspace_id);
CREATE INDEX idx_campaigns_dataset_id   ON campaigns (dataset_id);

-- ------------------------------------------------------------
-- campaign_recipients
-- ------------------------------------------------------------
CREATE INDEX idx_campaign_recipients_campaign_id     ON campaign_recipients (campaign_id);
CREATE INDEX idx_campaign_recipients_delivery_job_id ON campaign_recipients (delivery_job_id);
CREATE INDEX idx_campaign_recipients_status          ON campaign_recipients (campaign_id, status);

-- ------------------------------------------------------------
-- delivery_jobs
-- ------------------------------------------------------------
-- Primary worker-claim query: status + next_attempt_at
CREATE INDEX idx_delivery_jobs_status_next_attempt
    ON delivery_jobs (status, next_attempt_at)
    WHERE status IN ('queued', 'retrying');

CREATE INDEX idx_delivery_jobs_campaign_id ON delivery_jobs (campaign_id);
CREATE INDEX idx_delivery_jobs_user_id     ON delivery_jobs (user_id);
CREATE INDEX idx_delivery_jobs_leased_until ON delivery_jobs (leased_until)
    WHERE leased_until IS NOT NULL;

-- ------------------------------------------------------------
-- delivery_attempts
-- ------------------------------------------------------------
CREATE INDEX idx_delivery_attempts_job_id ON delivery_attempts (delivery_job_id);

-- ------------------------------------------------------------
-- file_matches
-- ------------------------------------------------------------
CREATE INDEX idx_file_matches_campaign_id           ON file_matches (campaign_id);
CREATE INDEX idx_file_matches_campaign_recipient_id ON file_matches (campaign_recipient_id);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
CREATE INDEX idx_audit_logs_actor_created
    ON audit_logs (actor_id, created_at DESC);

CREATE INDEX idx_audit_logs_target ON audit_logs (target_type, target_id);
