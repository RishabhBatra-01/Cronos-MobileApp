-- Phase 2: Repeat Logic - Database Migration
-- Add columns for repeating tasks

-- Add new columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS repeat_type TEXT,
ADD COLUMN IF NOT EXISTS repeat_config JSONB,
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_repeat_type 
ON tasks(repeat_type) 
WHERE repeat_type IS NOT NULL AND repeat_type != 'NONE';

CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence 
ON tasks(next_occurrence) 
WHERE next_occurrence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_active_repeat 
ON tasks(is_active, repeat_type) 
WHERE is_active = true AND repeat_type IS NOT NULL AND repeat_type != 'NONE';

-- Add comments to document the columns
COMMENT ON COLUMN tasks.repeat_type IS 'Type of repeat: NONE, DAILY, WEEKLY, MONTHLY, CUSTOM (Phase 2)';
COMMENT ON COLUMN tasks.repeat_config IS 'JSON configuration for repeat pattern (Phase 2)';
COMMENT ON COLUMN tasks.last_completed_at IS 'Timestamp of last completion for repeating tasks (Phase 2)';
COMMENT ON COLUMN tasks.next_occurrence IS 'Calculated next occurrence timestamp (Phase 2)';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('repeat_type', 'repeat_config', 'last_completed_at', 'next_occurrence');
