-- Migration to add updated_at field to all tables
-- Run this with: wrangler d1 execute luji-contacts-db --remote --file=migrations/add-updated-at-field.sql

-- Add updated_at field to contacts table
ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at field to users table
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at field to groups table
ALTER TABLE groups ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at field to user_preferences table
ALTER TABLE user_preferences ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at field to plans table
ALTER TABLE plans ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
