-- Migration: Add nickname field to contacts table
-- Date: 2025-01-29
-- Description: Add nickname/artist name field to support alternative names

-- Add nickname column to contacts table
ALTER TABLE contacts ADD COLUMN nickname TEXT;

-- Update any existing indexes to include nickname in search
-- Note: SQLite doesn't support adding columns to existing indexes,
-- so we would need to recreate them, but for now we'll rely on
-- the application-level search functionality
