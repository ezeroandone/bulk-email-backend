-- ============================================================
-- 005_triggers.sql
-- updated_at triggers and auth.users → profile bootstrap trigger
-- ============================================================

-- Helper macro: creates a BEFORE UPDATE trigger on a table that
-- calls update_updated_at().  We define it inline rather than as
-- a DO loop so each trigger name is explicit and easy to debug.

-- profiles
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- workspaces
CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- workspace_members
CREATE TRIGGER trg_workspace_members_updated_at
    BEFORE UPDATE ON workspace_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- credit_wallets
CREATE TRIGGER trg_credit_wallets_updated_at
    BEFORE UPDATE ON credit_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- credit_packages
CREATE TRIGGER trg_credit_packages_updated_at
    BEFORE UPDATE ON credit_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- payment_orders
CREATE TRIGGER trg_payment_orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- payment_events
CREATE TRIGGER trg_payment_events_updated_at
    BEFORE UPDATE ON payment_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- smtp_configurations
CREATE TRIGGER trg_smtp_configurations_updated_at
    BEFORE UPDATE ON smtp_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- datasets
CREATE TRIGGER trg_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- dataset_columns
CREATE TRIGGER trg_dataset_columns_updated_at
    BEFORE UPDATE ON dataset_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- dataset_rows
CREATE TRIGGER trg_dataset_rows_updated_at
    BEFORE UPDATE ON dataset_rows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- document_templates
CREATE TRIGGER trg_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- document_assets
CREATE TRIGGER trg_document_assets_updated_at
    BEFORE UPDATE ON document_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- document_mappings
CREATE TRIGGER trg_document_mappings_updated_at
    BEFORE UPDATE ON document_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- email_templates
CREATE TRIGGER trg_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- campaigns
CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- campaign_recipients
CREATE TRIGGER trg_campaign_recipients_updated_at
    BEFORE UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- delivery_jobs
CREATE TRIGGER trg_delivery_jobs_updated_at
    BEFORE UPDATE ON delivery_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- delivery_attempts
CREATE TRIGGER trg_delivery_attempts_updated_at
    BEFORE UPDATE ON delivery_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- file_matches
CREATE TRIGGER trg_file_matches_updated_at
    BEFORE UPDATE ON file_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- NOTE: audit_logs and credit_ledger are intentionally excluded —
-- those tables are immutable append-only logs with no updated_at column.

-- NOTE: platform_settings.updated_at is managed manually by application
-- code so that the timestamp reflects when the setting was intentionally
-- changed, not when any column was touched.

-- ------------------------------------------------------------
-- auth.users → application bootstrap trigger
-- Fires AFTER INSERT on auth.users to create the profile, workspace,
-- credit wallet, and 100 signup credits for every new account.
-- ------------------------------------------------------------
CREATE TRIGGER trg_auth_users_on_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
