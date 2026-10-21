-- ============================================================
-- 006_rls.sql
-- Row Level Security policies for all user-data tables.
--
-- Conventions used throughout:
--   auth.uid()   — current authenticated user's UUID
--   auth.role()  — 'authenticated' | 'anon' | 'service_role'
--   is_admin()   — inline helper defined at the top
--
-- service_role bypasses RLS automatically; no explicit policies
-- needed for server-side operations running as service_role.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: is_admin()
-- Returns TRUE when the calling user has role = 'admin'.
-- Defined as a stable SQL function so it can be inlined by the
-- query planner and used cheaply inside policy expressions.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id   = auth.uid()
          AND role = 'admin'
    );
$$;

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own row select"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles: own row update"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin can update any profile (e.g. suspend user, change role)
CREATE POLICY "profiles: admin update"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- workspaces
-- ============================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces: owner or member select"
    ON workspaces FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
              AND user_id      = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY "workspaces: owner insert"
    ON workspaces FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces: owner update"
    ON workspaces FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces: owner delete"
    ON workspaces FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid() OR is_admin());

-- ============================================================
-- workspace_members
-- ============================================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members: same workspace select"
    ON workspace_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM workspaces
            WHERE id       = workspace_members.workspace_id
              AND owner_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY "workspace_members: workspace owner insert"
    ON workspace_members FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE id       = workspace_members.workspace_id
              AND owner_id = auth.uid()
        )
    );

CREATE POLICY "workspace_members: workspace owner delete"
    ON workspace_members FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE id       = workspace_members.workspace_id
              AND owner_id = auth.uid()
        )
        OR is_admin()
    );

-- ============================================================
-- credit_wallets
-- ============================================================
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_wallets: own wallet"
    ON credit_wallets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- Updates go through SECURITY DEFINER functions only; no direct
-- client UPDATE is permitted.

-- ============================================================
-- credit_ledger
-- ============================================================
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Read-only from the client; writes come from SECURITY DEFINER functions.
CREATE POLICY "credit_ledger: own entries select"
    ON credit_ledger FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- credit_packages
-- ============================================================
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_packages: public select"
    ON credit_packages FOR SELECT
    TO authenticated
    USING (enabled = true OR is_admin());

CREATE POLICY "credit_packages: admin insert"
    ON credit_packages FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "credit_packages: admin update"
    ON credit_packages FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "credit_packages: admin delete"
    ON credit_packages FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- payment_orders
-- ============================================================
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_orders: own orders select"
    ON payment_orders FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "payment_orders: own orders insert"
    ON payment_orders FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Status updates are done via SECURITY DEFINER functions; restrict
-- direct UPDATE to admins only for manual intervention.
CREATE POLICY "payment_orders: admin update"
    ON payment_orders FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- payment_events
-- ============================================================
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_events: admin only"
    ON payment_events FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- smtp_configurations
-- ============================================================
ALTER TABLE smtp_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smtp_configurations: own configs"
    ON smtp_configurations FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- datasets
-- ============================================================
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datasets: own or workspace member select"
    ON datasets FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            workspace_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM workspace_members
                WHERE workspace_id = datasets.workspace_id
                  AND user_id      = auth.uid()
            )
        )
        OR is_admin()
    );

CREATE POLICY "datasets: own insert"
    ON datasets FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "datasets: own update"
    ON datasets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "datasets: own delete"
    ON datasets FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- dataset_columns
-- ============================================================
ALTER TABLE dataset_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dataset_columns: via dataset ownership"
    ON dataset_columns FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE id      = dataset_columns.dataset_id
              AND (
                  user_id = auth.uid()
                  OR (workspace_id IS NOT NULL AND EXISTS (
                      SELECT 1 FROM workspace_members
                      WHERE workspace_id = datasets.workspace_id
                        AND user_id      = auth.uid()
                  ))
              )
        )
        OR is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE id      = dataset_columns.dataset_id
              AND user_id = auth.uid()
        )
    );

-- ============================================================
-- dataset_rows
-- ============================================================
ALTER TABLE dataset_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dataset_rows: via dataset ownership"
    ON dataset_rows FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE id      = dataset_rows.dataset_id
              AND (
                  user_id = auth.uid()
                  OR (workspace_id IS NOT NULL AND EXISTS (
                      SELECT 1 FROM workspace_members
                      WHERE workspace_id = datasets.workspace_id
                        AND user_id      = auth.uid()
                  ))
              )
        )
        OR is_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE id      = dataset_rows.dataset_id
              AND user_id = auth.uid()
        )
    );

-- ============================================================
-- document_templates
-- ============================================================
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_templates: own"
    ON document_templates FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- document_assets
-- ============================================================
ALTER TABLE document_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_assets: own"
    ON document_assets FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- document_mappings
-- ============================================================
ALTER TABLE document_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_mappings: via template ownership"
    ON document_mappings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM document_templates
            WHERE id      = document_mappings.template_id
              AND (user_id = auth.uid() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_templates
            WHERE id      = document_mappings.template_id
              AND user_id = auth.uid()
        )
    );

-- ============================================================
-- email_templates
-- ============================================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates: own"
    ON email_templates FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- campaigns
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: own"
    ON campaigns FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- campaign_recipients
-- ============================================================
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_recipients: via campaign ownership"
    ON campaign_recipients FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE id      = campaign_recipients.campaign_id
              AND (user_id = auth.uid() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE id      = campaign_recipients.campaign_id
              AND user_id = auth.uid()
        )
    );

-- ============================================================
-- delivery_jobs
-- ============================================================
ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_jobs: own"
    ON delivery_jobs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_admin());

-- Inserts and updates come from server-side SECURITY DEFINER functions.

-- ============================================================
-- delivery_attempts
-- ============================================================
ALTER TABLE delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_attempts: via delivery job ownership"
    ON delivery_attempts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM delivery_jobs
            WHERE id      = delivery_attempts.delivery_job_id
              AND (user_id = auth.uid() OR is_admin())
        )
    );

-- ============================================================
-- file_matches
-- ============================================================
ALTER TABLE file_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_matches: via campaign ownership"
    ON file_matches FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE id      = file_matches.campaign_id
              AND (user_id = auth.uid() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE id      = file_matches.campaign_id
              AND user_id = auth.uid()
        )
    );

-- ============================================================
-- audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own audit trail; admins see everything
CREATE POLICY "audit_logs: own select"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (actor_id = auth.uid() OR is_admin());

-- No client INSERT — audit_logs are written by SECURITY DEFINER functions only.

-- ============================================================
-- platform_settings
-- ============================================================
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings (needed for feature flags etc.)
CREATE POLICY "platform_settings: authenticated read"
    ON platform_settings FOR SELECT
    TO authenticated
    USING (true);

-- Only admins may write
CREATE POLICY "platform_settings: admin write"
    ON platform_settings FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "platform_settings: admin update"
    ON platform_settings FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "platform_settings: admin delete"
    ON platform_settings FOR DELETE
    TO authenticated
    USING (is_admin());
