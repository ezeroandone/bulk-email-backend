-- Add an optional campaign_id filter to claim_delivery_batch so the
-- "Send Now" button only dispatches jobs for a specific campaign.
-- When p_campaign_id is NULL (the default), the function claims jobs from
-- ALL campaigns — this is the behavior the cron job relies on.

-- The function signature changes (new optional parameter), so DROP the
-- existing function before recreating it.
DROP FUNCTION IF EXISTS claim_delivery_batch(TEXT, INTEGER, TIMESTAMPTZ);

-- Function: claim_delivery_batch
-- Atomically claims up to p_batch_size delivery jobs that are queued and ready.
-- Returns the claimed job rows. Using UPDATE...WHERE id IN (SELECT...LIMIT n)
-- is atomic in PostgreSQL — concurrent calls get disjoint sets.
-- When p_campaign_id is provided, only that campaign's queued jobs are
-- considered; when NULL, jobs from all campaigns are considered.
CREATE OR REPLACE FUNCTION claim_delivery_batch(
  p_batch_token  TEXT,
  p_batch_size   INTEGER,
  p_now          TIMESTAMPTZ DEFAULT now(),
  p_campaign_id  UUID DEFAULT NULL
)
RETURNS TABLE (
  id                    UUID,
  campaign_id           UUID,
  campaign_recipient_id UUID,
  attempt_count         INTEGER,
  max_attempts          INTEGER
)
LANGUAGE sql
AS $$
  UPDATE delivery_jobs
  SET
    status     = 'claimed',
    claimed_by = p_batch_token
  WHERE id IN (
    SELECT id
    FROM   delivery_jobs
    WHERE  status = 'queued'
      AND  (next_attempt_at IS NULL OR next_attempt_at <= p_now)
      AND  (p_campaign_id IS NULL OR campaign_id = p_campaign_id)
    ORDER  BY created_at
    LIMIT  p_batch_size
    FOR    UPDATE SKIP LOCKED        -- skip rows locked by concurrent transactions
  )
  RETURNING
    id,
    campaign_id,
    campaign_recipient_id,
    attempt_count,
    max_attempts;
$$;
