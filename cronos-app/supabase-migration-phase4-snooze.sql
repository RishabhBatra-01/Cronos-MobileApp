-- Phase 4: Snooze Migration
-- Adds snooze functionality to tasks table

-- Add snooze columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS snooze_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS snooze_duration TEXT,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;

-- Add index for querying snoozed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_snoozed 
ON tasks(snoozed_until) 
WHERE snoozed_until IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.snooze_enabled IS 'Whether snooze is enabled for this task';
COMMENT ON COLUMN tasks.snooze_duration IS 'ISO 8601 duration for snooze (e.g., PT5M, PT10M, PT30M, PT1H)';
COMMENT ON COLUMN tasks.snoozed_until IS 'Timestamp when snoozed notification should fire';
COMMENT ON COLUMN tasks.snooze_count IS 'Number of times task has been snoozed';

-- Example values:
-- snooze_enabled = true, snooze_duration = 'PT10M' (10 minutes)
-- snooze_enabled = true, snooze_duration = 'PT30M' (30 minutes)
-- snooze_enabled = false (snooze disabled)
