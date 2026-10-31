-- ============================================================
-- 20261021000001_setup_dispatch_cron.sql
-- Set up a Supabase (pg_cron + pg_net) job that auto-dispatches
-- MergeMail delivery jobs every 2 minutes by POSTing to the
-- internal dispatch endpoint with the INTERNAL_WORKER_SECRET.
--
-- Before today the user had to click "Send Now" to trigger dispatch.
-- This cron removes that manual step.
--
-- Endpoint : POST https://bulkemail.ezeroandone.io/api/internal/dispatch
-- Auth     : Authorization: Bearer <INTERNAL_WORKER_SECRET>
--            (read at run time from the Supabase Vault secret below)
-- Body     : {"batchSize": 20}
--            NOTE: the endpoint currently hardcodes its own batch size and
--            ignores this body; the field is kept for forward-compatibility.
-- Schedule : every 2 minutes  ('*/2 * * * *')
--
-- IMPORTANT — SECRET MUST MATCH VERCEL:
--   The value stored in the Supabase Vault secret named
--   "mergemail_internal_worker_secret" MUST equal the
--   INTERNAL_WORKER_SECRET environment variable configured in Vercel.
--   If they differ, the endpoint returns 401 and no jobs are dispatched.
--   Generate one with:
--     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
--   then set the SAME value in both Supabase Vault and Vercel env vars.
--
-- DOMAIN NOTE:
--   The URL below uses the production domain from the deployment config
--   (bulkemail.ezeroandone.io). If your live deployment uses a different
--   domain (e.g. mergemail.ezeroandone.io), update v_url inside the
--   mergemail_dispatch() function below to match PUBLIC_APP_URL.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Supabase Dashboard -> SQL Editor.
--   2. Paste this entire file and Run. It is idempotent — safe to re-run.
--      (pg_cron, pg_net and vault are enabled with IF NOT EXISTS; the cron
--       job is unscheduled-then-rescheduled; the vault secret is created
--       only if it does not already exist, so a real value is never wiped.)
--   3. Put the real secret into the Vault. Either:
--        a) Supabase Dashboard -> Project Settings -> Vault -> find the
--           secret named "mergemail_internal_worker_secret" -> edit its
--           value to match INTERNAL_WORKER_SECRET in Vercel.
--        or b) drop + recreate it:
--             SELECT id FROM vault.secrets WHERE name = 'mergemail_internal_worker_secret';
--             SELECT vault.delete_secret('<id from above>');
--             SELECT vault.create_secret(
--               '<REAL_INTERNAL_WORKER_SECRET>',
--               'mergemail_internal_worker_secret',
--               'MergeMail INTERNAL_WORKER_SECRET — must match the Vercel env var.'
--             );
--   4. Confirm pg_cron is allowed in Database -> Settings (it must run in
--      the "postgres" database, which the SQL Editor uses by default).
--   5. Run the VERIFY section at the bottom of this file.
-- ============================================================


-- ============================================================
-- SECTION 1 — EXTENSIONS
-- pg_cron  : schedules the recurring job.
-- pg_net   : performs the outbound HTTP POST to the dispatch endpoint.
--            (already enabled by 001_extensions.sql; kept here so this
--             migration is self-contained. IF NOT EXISTS = safe no-op.)
-- vault    : Supabase Vault (built on pgsodium) stores the internal
--            worker secret. On hosted Supabase it is usually already
--            enabled via Dashboard -> Database -> Extensions.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;


-- ============================================================
-- SECTION 2 — VAULT SECRET
-- Creates the secret with a clearly-marked PLACEHOLDER only if it does
-- NOT already exist, so re-running the migration never clobbers a real
-- value the user has already set. Replace the placeholder with the real
-- INTERNAL_WORKER_SECRET (see HOW TO RUN step 3).
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'mergemail_internal_worker_secret'
  ) THEN
    PERFORM vault.create_secret(
      'REPLACE_WITH_INTERNAL_WORKER_SECRET',
      'mergemail_internal_worker_secret',
      'MergeMail INTERNAL_WORKER_SECRET — must match the Vercel env var of the same name. Used by the dispatch cron for Authorization: Bearer auth.'
    );
    RAISE NOTICE 'Created placeholder vault secret "mergemail_internal_worker_secret". Replace its value with the real INTERNAL_WORKER_SECRET (must match Vercel).';
  ELSE
    RAISE NOTICE 'Vault secret "mergemail_internal_worker_secret" already exists — left untouched. Update its value via the Supabase Dashboard if it changed.';
  END IF;
END
$$;


-- ============================================================
-- SECTION 3 — DISPATCH FUNCTION
-- SECURITY DEFINER (owned by postgres) so it can read the decrypted vault
-- secret regardless of which role pg_cron runs the job as. The secret is
-- read fresh on every run, so updating the Vault value updates the cron
-- without re-running this migration. If the secret is missing/empty the
-- function skips the call and logs a warning instead of spamming the
-- endpoint with guaranteed-401 requests.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mergemail_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_secret text;
  v_url    text := 'https://bulkemail.ezeroandone.io/api/internal/dispatch';
BEGIN
  SELECT decrypted_secret
  INTO   v_secret
  FROM   vault.decrypted_secrets
  WHERE  name = 'mergemail_internal_worker_secret'
  LIMIT  1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'MergeMail dispatch skipped: vault secret "mergemail_internal_worker_secret" is missing. Set it in Supabase Vault to match INTERNAL_WORKER_SECRET in Vercel.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || v_secret,
                 'Content-Type',  'application/json'
               ),
    body    := '{"batchSize": 20}'::jsonb
  );
END;
$$;


-- ============================================================
-- SECTION 4 — SCHEDULE
-- Unschedule any previous job with this name (if present) then schedule
-- fresh, so re-running the migration is safe and never produces a
-- duplicate. Runs every 2 minutes.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mergemail-dispatch') THEN
    PERFORM cron.unschedule('mergemail-dispatch');
    RAISE NOTICE 'Unscheduled previous "mergemail-dispatch" cron job.';
  ELSE
    RAISE NOTICE 'No existing "mergemail-dispatch" job; creating fresh.';
  END IF;

  PERFORM cron.schedule(
    'mergemail-dispatch',
    '*/2 * * * *',
    $job$SELECT public.mergemail_dispatch();$job$
  );
  RAISE NOTICE 'Scheduled "mergemail-dispatch" to run every 2 minutes (*/2 * * * *).';
END
$$;


-- ============================================================
-- SECTION 5 — VERIFY (informational; runs as part of the file)
-- Confirms the two artifacts this migration creates/updates.
-- ============================================================

-- 5a. The scheduled cron job (active = true means enabled).
SELECT jobid, schedule, jobname, command, active
FROM   cron.job
WHERE  jobname = 'mergemail-dispatch';

-- 5b. The vault secret exists (value intentionally not selected here).
SELECT id, name, description, created_at
FROM   vault.secrets
WHERE  name = 'mergemail_internal_worker_secret';

-- ── Optional inspection (uncomment after the cron has fired a few times) ─
-- Recent cron run outcomes:
--   SELECT jobid, runid, status, return_message, start_time, end_time
--   FROM   cron.job_run_details
--   ORDER  BY start_time DESC
--   LIMIT  10;
--
-- HTTP responses from pg_net (200 = dispatch accepted, 401 = secret mismatch):
--   SELECT id, status_code, left(content::text, 200) AS content_preview, created
--   FROM   net._http_response
--   ORDER  BY created DESC
--   LIMIT  10;
