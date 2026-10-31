-- ============================================================
-- 20261021000002_fix_delivery_attempts_schema.sql
-- Align the delivery_attempts table with the columns the internal
-- dispatcher actually inserts, so attempt records stop failing with
-- HTTP 400 / Postgres "column does not exist" / NOT NULL violations.
--
-- Source of truth for the insert payload:
--   src/routes/api/internal/dispatch/+server.ts
--
-- The dispatcher inserts these columns into delivery_attempts:
--   on success : job_id, attempt_number, status, duration_ms
--   on failure  : job_id, attempt_number, status, error_code,
--                 error_message, duration_ms
--
-- Existing table (003_tables.sql) has instead:
--   delivery_job_id (UUID NOT NULL FK), attempt_number (INT NOT NULL),
--   started_at (TIMESTAMPTZ NOT NULL), completed_at, status (TEXT NOT NULL),
--   smtp_response, error_message, error_code, is_transient,
--   created_at, updated_at
--
-- Mismatch analysis:
--   * job_id      — MISSING. Table has "delivery_job_id", but the dispatcher
--                   sends "job_id". Per instructions we do NOT drop/rename the
--                   existing column, so we add a new "job_id" column.
--   * duration_ms — MISSING. Dispatcher records elapsed time here; the table
--                   has no such column.
--   * delivery_job_id is NOT NULL with no default, but the dispatcher does
--     NOT populate it (it uses job_id instead). The insert would still fail,
--     so we relax that NOT NULL constraint.
--   * started_at is NOT NULL with no default, but the dispatcher does NOT
--     populate it (it records duration_ms instead). Relax NOT NULL so the
--     insert can succeed.
--
-- This migration only ADDS missing columns and relaxes NOT NULL constraints.
-- It does NOT drop or rename any existing column.
-- ============================================================

-- 1. Add the columns the dispatcher inserts that are missing from the table.
ALTER TABLE delivery_attempts
    ADD COLUMN IF NOT EXISTS job_id UUID
    REFERENCES delivery_jobs(id) ON DELETE CASCADE;

ALTER TABLE delivery_attempts
    ADD COLUMN IF NOT EXISTS duration_ms INT;

-- 2. Relax NOT NULL constraints the dispatcher's payload cannot satisfy.
--    New rows reference the delivery job via the new "job_id" column, so the
--    legacy "delivery_job_id" foreign-key column must allow NULL.
ALTER TABLE delivery_attempts
    ALTER COLUMN delivery_job_id DROP NOT NULL;

--    The dispatcher records elapsed time as duration_ms and never sets
--    started_at, so started_at must allow NULL.
ALTER TABLE delivery_attempts
    ALTER COLUMN started_at DROP NOT NULL;
