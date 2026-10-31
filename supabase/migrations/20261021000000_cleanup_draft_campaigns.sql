-- ============================================================
-- 20261021000000_cleanup_draft_campaigns.sql
-- Cleanup: remove stale/orphaned draft campaigns for the admin user.
--
-- Target:
--   campaigns WHERE user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
--   AND status = 'draft'
--
-- Protected (NEVER touched):
--   bdce0836-b3cf-447b-b6fa-3b779eff8d0e
--   a6db824b-2b52-4fba-8745-4ce08eec1a07
--
-- FK relationships to campaigns (all ON DELETE CASCADE):
--   delivery_jobs.campaign_id       -> campaigns(id) ON DELETE CASCADE
--   campaign_recipients.campaign_id -> campaigns(id) ON DELETE CASCADE
--   file_matches.campaign_id         -> campaigns(id) ON DELETE CASCADE
--   delivery_attempts.delivery_job_id -> delivery_jobs(id) ON DELETE CASCADE
--
-- NOTE: document_assets does NOT reference campaigns (it references
-- profiles + workspaces and is only referenced *by* campaign_recipients /
-- file_matches via ON DELETE SET NULL). It is therefore intentionally NOT
-- deleted here — it is user-owned storage, not a campaign child.
--
-- Because every child FK uses ON DELETE CASCADE, deleting the campaigns
-- would cascade automatically. Child rows are still deleted explicitly
-- first, in FK-safe order, so the operation is robust even if a CASCADE
-- constraint were ever dropped.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Select and run ONLY the "SECTION 1 — PREVIEW" block below.
--      Review the rows it returns. Confirm that ONLY drafts for the admin
--      user are listed and that neither protected ID appears.
--   2. When you are satisfied, select and run "SECTION 2 — DELETE" block.
--      It runs in a single transaction; if anything fails it rolls back.
--   3. Optionally run "SECTION 3 — VERIFY" to confirm the cleanup.
-- ============================================================


-- ============================================================
-- SECTION 1 — PREVIEW (run this first; do NOT run the rest yet)
-- Lists the draft campaigns that the DELETE will target.
-- ============================================================
SELECT id,
       name,
       status,
       created_at
FROM   campaigns
WHERE  user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
  AND  status = 'draft'
  AND  id NOT IN (
        'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
        'a6db824b-2b52-4fba-8745-4ce08eec1a07'
      )
ORDER BY created_at;

-- Sanity check: confirm the two protected campaigns still exist and are
-- NOT in the target set (this should return them regardless of status).
SELECT id, name, status
FROM   campaigns
WHERE  id IN (
        'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
        'a6db824b-2b52-4fba-8745-4ce08eec1a07'
      );


-- ============================================================
-- SECTION 2 — DELETE (run ONLY after reviewing SECTION 1 output)
-- Wrapped in a transaction; rolls back on any error.
-- Protected IDs are excluded in every statement via the subquery.
-- ============================================================
BEGIN;

-- 1) file_matches (children of campaigns; nothing references them)
DELETE FROM file_matches
WHERE campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
      AND status = 'draft'
      AND id NOT IN (
            'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
            'a6db824b-2b52-4fba-8745-4ce08eec1a07'
          )
);

-- 2) campaign_recipients (delivery_jobs.campaign_recipient_id is
--    ON DELETE SET NULL, so this is safe)
DELETE FROM campaign_recipients
WHERE campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
      AND status = 'draft'
      AND id NOT IN (
            'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
            'a6db824b-2b52-4fba-8745-4ce08eec1a07'
          )
);

-- 3) delivery_jobs (cascades delivery_attempts automatically)
DELETE FROM delivery_jobs
WHERE campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
      AND status = 'draft'
      AND id NOT IN (
            'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
            'a6db824b-2b52-4fba-8745-4ce08eec1a07'
          )
);

-- 4) campaigns (the actual cleanup)
DELETE FROM campaigns
WHERE user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
  AND status = 'draft'
  AND id NOT IN (
        'bdce0836-b3cf-447b-b6fa-3b779eff8d0e',
        'a6db824b-2b52-4fba-8745-4ce08eec1a07'
      );

COMMIT;


-- ============================================================
-- SECTION 3 — VERIFY (optional, run after SECTION 2)
-- Remaining drafts for this user should be empty (protected campaigns
-- are only kept if they were drafts — verify they are untouched).
-- ============================================================
SELECT id, name, status, created_at
FROM   campaigns
WHERE  user_id = '5b3f3288-01ea-4f9d-ae56-3b660d11d74a'
  AND  status = 'draft'
ORDER BY created_at;
