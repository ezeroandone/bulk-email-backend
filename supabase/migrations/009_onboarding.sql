-- ------------------------------------------------------------
-- Add onboarding_step to profiles
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_done  BOOLEAN NOT NULL DEFAULT false;
