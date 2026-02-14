-- Phase 1: Active/Inactive Toggle - Database Migration
-- Add new columns to tasks table for reminder scheduling

-- Add new columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for active tasks (improves query performance)
CREATE INDEX IF NOT EXISTS idx_tasks_active 
ON tasks(is_active) 
WHERE is_active = true;

-- Create index for scheduled tasks (for future phases)
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled 
ON tasks(scheduled_date, scheduled_time) 
WHERE is_active = true AND scheduled_date IS NOT NULL;

-- Update existing tasks to have is_active = true (backward compatibility)
UPDATE tasks 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comment to document the columns
COMMENT ON COLUMN tasks.scheduled_date IS 'Scheduled date in YYYY-MM-DD format (Phase 1)';
COMMENT ON COLUMN tasks.scheduled_time IS 'Scheduled time in HH:mm format (Phase 1)';
COMMENT ON COLUMN tasks.timezone IS 'IANA timezone (e.g., America/Los_Angeles) (Phase 1)';
COMMENT ON COLUMN tasks.is_active IS 'Controls whether task participates in scheduling (Phase 1)';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('scheduled_date', 'scheduled_time', 'timezone', 'is_active');
