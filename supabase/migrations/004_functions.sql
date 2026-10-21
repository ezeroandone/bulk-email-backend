-- ============================================================
-- 004_functions.sql
-- Application PL/pgSQL functions (all SECURITY DEFINER)
-- ============================================================

-- ------------------------------------------------------------
-- 1. update_updated_at()
-- Generic trigger function to keep updated_at current
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 2. award_initial_credits(p_user_id, p_amount, p_idempotency_key)
-- Idempotent signup grant.  Safe to call multiple times.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_initial_credits(
    p_user_id         UUID,
    p_amount          BIGINT,
    p_idempotency_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance_after BIGINT;
BEGIN
    -- Idempotency guard: if the key already exists, nothing to do
    IF EXISTS (
        SELECT 1 FROM credit_ledger
        WHERE idempotency_key = p_idempotency_key
    ) THEN
        RETURN;
    END IF;

    -- Upsert the wallet (created by trigger but may not exist yet in edge cases)
    INSERT INTO credit_wallets (user_id, available_credits)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Increment the wallet and capture new balance
    UPDATE credit_wallets
    SET available_credits = available_credits + p_amount,
        updated_at        = now()
    WHERE user_id = p_user_id
    RETURNING available_credits INTO v_balance_after;

    -- Record the ledger entry
    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        note,
        idempotency_key
    ) VALUES (
        p_user_id,
        'signup_grant',
        p_amount,
        v_balance_after,
        'Initial signup credit grant',
        p_idempotency_key
    );
END;
$$;

-- ------------------------------------------------------------
-- 3. reserve_credits(p_user_id, p_amount, p_campaign_id)
-- Atomically moves credits from available → reserved.
-- Raises an exception if insufficient balance.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_credits(
    p_user_id    UUID,
    p_amount     BIGINT,
    p_campaign_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available     BIGINT;
    v_balance_after BIGINT;
BEGIN
    -- Lock the wallet row for the duration of this transaction
    SELECT available_credits
    INTO   v_available
    FROM   credit_wallets
    WHERE  user_id = p_user_id
    FOR UPDATE;

    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Credit wallet not found for user %', p_user_id;
    END IF;

    IF v_available < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits: available=%, requested=%', v_available, p_amount;
    END IF;

    UPDATE credit_wallets
    SET available_credits = available_credits - p_amount,
        reserved_credits  = reserved_credits  + p_amount,
        updated_at        = now()
    WHERE user_id = p_user_id
    RETURNING available_credits INTO v_balance_after;

    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        campaign_id,
        note
    ) VALUES (
        p_user_id,
        'reservation',
        -p_amount,
        v_balance_after,
        p_campaign_id,
        'Credits reserved for campaign'
    );
END;
$$;

-- ------------------------------------------------------------
-- 4. settle_delivery_credit(p_delivery_job_id)
-- Deducts exactly 1 credit from reserved upon successful delivery.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION settle_delivery_credit(
    p_delivery_job_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id       UUID;
    v_campaign_id   UUID;
    v_balance_after BIGINT;
BEGIN
    SELECT user_id, campaign_id
    INTO   v_user_id, v_campaign_id
    FROM   delivery_jobs
    WHERE  id = p_delivery_job_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Delivery job % not found', p_delivery_job_id;
    END IF;

    UPDATE credit_wallets
    SET reserved_credits = reserved_credits  - 1,
        total_consumed   = total_consumed    + 1,
        updated_at       = now()
    WHERE user_id = v_user_id
    RETURNING available_credits INTO v_balance_after;

    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        reference_id,
        campaign_id,
        note
    ) VALUES (
        v_user_id,
        'settlement',
        -1,
        v_balance_after,
        p_delivery_job_id,
        v_campaign_id,
        'Credit settled for delivered email'
    );
END;
$$;

-- ------------------------------------------------------------
-- 5. release_reservation(p_delivery_job_id)
-- Returns reserved credits to available when a job is cancelled
-- or the campaign is abandoned.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_reservation(
    p_delivery_job_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id       UUID;
    v_campaign_id   UUID;
    v_reserved      BIGINT;
    v_balance_after BIGINT;
BEGIN
    SELECT dj.user_id, dj.campaign_id, c.credits_reserved
    INTO   v_user_id, v_campaign_id, v_reserved
    FROM   delivery_jobs dj
    JOIN   campaigns c ON c.id = dj.campaign_id
    WHERE  dj.id = p_delivery_job_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Delivery job % not found', p_delivery_job_id;
    END IF;

    -- Release 1 credit per job (each job = 1 send = 1 credit)
    UPDATE credit_wallets
    SET reserved_credits  = reserved_credits  - 1,
        available_credits = available_credits + 1,
        updated_at        = now()
    WHERE user_id = v_user_id
    RETURNING available_credits INTO v_balance_after;

    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        reference_id,
        campaign_id,
        note
    ) VALUES (
        v_user_id,
        'release',
        1,
        v_balance_after,
        p_delivery_job_id,
        v_campaign_id,
        'Reserved credit released — job not consumed'
    );
END;
$$;

-- ------------------------------------------------------------
-- 6. apply_payment(p_payment_order_id, p_paystack_ref)
-- Idempotent: safely marks an order fulfilled and awards credits.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_payment(
    p_payment_order_id UUID,
    p_paystack_ref     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order         payment_orders%ROWTYPE;
    v_credits       BIGINT;
    v_idempotency   TEXT;
    v_balance_after BIGINT;
BEGIN
    -- Lock the order row
    SELECT * INTO v_order
    FROM   payment_orders
    WHERE  id = p_payment_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Payment order % not found', p_payment_order_id;
    END IF;

    -- Verify the reference matches
    IF v_order.reference <> p_paystack_ref THEN
        RAISE EXCEPTION 'Reference mismatch: expected %, got %', v_order.reference, p_paystack_ref;
    END IF;

    -- Idempotency: already fulfilled
    IF v_order.status = 'successful' THEN
        RETURN;
    END IF;

    -- Fetch the credit amount from the package
    SELECT credits INTO v_credits
    FROM   credit_packages
    WHERE  id = v_order.package_id;

    IF v_credits IS NULL THEN
        RAISE EXCEPTION 'Credit package % not found', v_order.package_id;
    END IF;

    -- Mark order fulfilled
    UPDATE payment_orders
    SET status       = 'successful',
        fulfilled_at = now(),
        updated_at   = now()
    WHERE id = p_payment_order_id;

    -- Use order id as idempotency key for the ledger entry
    v_idempotency := 'payment:' || p_payment_order_id::TEXT;

    -- Update the wallet
    UPDATE credit_wallets
    SET available_credits = available_credits + v_credits,
        total_purchased   = total_purchased   + v_credits,
        updated_at        = now()
    WHERE user_id = v_order.user_id
    RETURNING available_credits INTO v_balance_after;

    -- Record the ledger entry (idempotency_key prevents duplicates)
    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        reference_id,
        note,
        idempotency_key
    ) VALUES (
        v_order.user_id,
        'purchase',
        v_credits,
        v_balance_after,
        p_payment_order_id,
        'Credits purchased via Paystack ref ' || p_paystack_ref,
        v_idempotency
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
END;
$$;

-- ------------------------------------------------------------
-- 7. admin_adjust_credits(p_admin_id, p_target_user_id, p_delta, p_reason)
-- Manual credit adjustment by an administrator.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_adjust_credits(
    p_admin_id      UUID,
    p_target_user_id UUID,
    p_delta          BIGINT,
    p_reason         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role    user_role;
    v_balance_after BIGINT;
BEGIN
    -- Verify the caller is an admin
    SELECT role INTO v_admin_role
    FROM   profiles
    WHERE  id = p_admin_id;

    IF v_admin_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Access denied: caller % is not an administrator', p_admin_id;
    END IF;

    -- Apply the adjustment (CHECK constraint on credit_wallets prevents negative available)
    UPDATE credit_wallets
    SET available_credits = available_credits + p_delta,
        updated_at        = now()
    WHERE user_id = p_target_user_id
    RETURNING available_credits INTO v_balance_after;

    IF v_balance_after IS NULL THEN
        RAISE EXCEPTION 'Credit wallet not found for user %', p_target_user_id;
    END IF;

    -- Ledger entry
    INSERT INTO credit_ledger (
        user_id,
        type,
        delta,
        balance_after,
        note
    ) VALUES (
        p_target_user_id,
        'admin_adjustment',
        p_delta,
        v_balance_after,
        p_reason
    );

    -- Audit log
    INSERT INTO audit_logs (
        actor_id,
        action,
        target_type,
        target_id,
        metadata
    ) VALUES (
        p_admin_id,
        'admin_adjust_credits',
        'profiles',
        p_target_user_id,
        jsonb_build_object(
            'delta',  p_delta,
            'reason', p_reason,
            'balance_after', v_balance_after
        )
    );
END;
$$;

-- ------------------------------------------------------------
-- 8. claim_delivery_jobs(p_worker_secret, p_batch_size)
-- Atomically leases a batch of eligible delivery jobs.
-- The worker secret is verified against the platform_settings table.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_delivery_jobs(
    p_worker_secret TEXT,
    p_batch_size    INT DEFAULT 10
)
RETURNS SETOF delivery_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stored_secret TEXT;
    v_lease_id      TEXT;
BEGIN
    -- Validate worker secret against stored platform setting
    SELECT value ->> 'secret'
    INTO   v_stored_secret
    FROM   platform_settings
    WHERE  key = 'INTERNAL_WORKER_SECRET';

    IF v_stored_secret IS NULL OR v_stored_secret <> p_worker_secret THEN
        RAISE EXCEPTION 'Invalid worker secret';
    END IF;

    v_lease_id := gen_random_uuid()::TEXT;

    RETURN QUERY
    UPDATE delivery_jobs
    SET status       = 'processing',
        leased_until = now() + INTERVAL '5 minutes',
        leased_by    = v_lease_id,
        updated_at   = now()
    WHERE id IN (
        SELECT id
        FROM   delivery_jobs
        WHERE  status IN ('queued', 'retrying')
          AND  (next_attempt_at IS NULL OR next_attempt_at <= now())
        ORDER BY created_at
        LIMIT  p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

-- ------------------------------------------------------------
-- 9. handle_new_user()
-- Called by trigger on auth.users INSERT.
-- Creates profile, default workspace, credit wallet, and awards
-- 100 signup credits atomically.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_display_name TEXT;
    v_workspace_id UUID;
    v_signup_credits BIGINT := 100;
    v_idempotency  TEXT;
BEGIN
    -- Derive a display name from metadata or email
    v_display_name := COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        split_part(NEW.email, '@', 1)
    );

    -- Create profile
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        v_display_name,
        NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (v_display_name || '''s Workspace', NEW.id)
    RETURNING id INTO v_workspace_id;

    -- Add owner as workspace member
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, NEW.id, 'owner')
    ON CONFLICT DO NOTHING;

    -- Create credit wallet
    INSERT INTO public.credit_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Award initial signup credits (idempotent)
    v_idempotency := 'signup:' || NEW.id::TEXT;
    PERFORM award_initial_credits(NEW.id, v_signup_credits, v_idempotency);

    RETURN NEW;
END;
$$;
