-- Migration: Add priority and description columns to tasks table
-- Date: 2026-02-01
-- Description: Adds optional priority (low/medium/high) and description fields to tasks

-- Add priority column with default 'medium'
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Add description column (optional text field)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN tasks.priority IS 'Task priority level: low, medium (default), or high';
COMMENT ON COLUMN tasks.description IS 'Optional notes or details about the task';

-- Update existing rows to have default priority if NULL
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;
