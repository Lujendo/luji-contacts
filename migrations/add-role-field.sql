-- Migration to add role field to contacts table
-- Run this with: wrangler d1 execute luji-contacts --file=migrations/add-role-field.sql

-- Add role field to contacts table
ALTER TABLE contacts ADD COLUMN role VARCHAR(255);

-- Add new social media fields
ALTER TABLE contacts ADD COLUMN youtube VARCHAR(255);
ALTER TABLE contacts ADD COLUMN tiktok VARCHAR(255);
ALTER TABLE contacts ADD COLUMN snapchat VARCHAR(255);
ALTER TABLE contacts ADD COLUMN discord VARCHAR(255);
ALTER TABLE contacts ADD COLUMN spotify VARCHAR(255);
ALTER TABLE contacts ADD COLUMN apple_music VARCHAR(255);
ALTER TABLE contacts ADD COLUMN github VARCHAR(255);
ALTER TABLE contacts ADD COLUMN behance VARCHAR(255);
ALTER TABLE contacts ADD COLUMN dribbble VARCHAR(255);
