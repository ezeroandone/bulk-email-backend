-- Add 'claimed' to the delivery_job_status enum if not already present
ALTER TYPE delivery_job_status ADD VALUE IF NOT EXISTS 'claimed';

-- Add claimed_by column if it doesn't exist
ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS claimed_by TEXT;

-- Function: claim_delivery_batch
-- Atomically claims up to p_batch_size delivery jobs that are queued and ready.
-- Returns the claimed job rows. Using UPDATE...WHERE id IN (SELECT...LIMIT n)
-- is atomic in PostgreSQL — concurrent calls get disjoint sets.
CREATE OR REPLACE FUNCTION claim_delivery_batch(
  p_batch_token TEXT,
  p_batch_size  INTEGER,
  p_now         TIMESTAMPTZ DEFAULT now()
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

-- Add claimed_by column if it doesn't exist (handled above, kept for clarity)
