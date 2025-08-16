-- Migration to add updated_at field to contacts table only
-- Run this with: wrangler d1 execute luji-contacts-db --remote --file=migrations/add-updated-at-contacts-only.sql

-- Add updated_at field to contacts table
ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
