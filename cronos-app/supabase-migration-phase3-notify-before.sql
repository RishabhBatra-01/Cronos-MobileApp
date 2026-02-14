-- Phase 3: Notify Before Migration
-- Adds pre-notification offset support to tasks table

-- Add pre_notify_offsets column (array of ISO 8601 duration strings)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS pre_notify_offsets TEXT[];

-- Add index for querying tasks with pre-notifications
CREATE INDEX IF NOT EXISTS idx_tasks_pre_notify 
ON tasks(pre_notify_offsets) 
WHERE pre_notify_offsets IS NOT NULL AND array_length(pre_notify_offsets, 1) > 0;

-- Add comment for documentation
COMMENT ON COLUMN tasks.pre_notify_offsets IS 'ISO 8601 duration offsets for pre-notifications (e.g., PT5M, PT1H, PT1D). Multiple notifications can be scheduled before the main trigger.';

-- Example values:
-- ['PT5M'] = 5 minutes before
-- ['PT15M', 'PT1H'] = 15 minutes and 1 hour before
-- ['PT5M', 'PT15M', 'PT1H', 'PT1D'] = 5 min, 15 min, 1 hour, and 1 day before
