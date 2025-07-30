-- Cloudflare D1 Database Schema for Luji Contacts
-- Based on the original contacts1 application schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('admin', 'user', 'subscriber')) DEFAULT 'user' NOT NULL,
  contact_limit INTEGER DEFAULT 50,
  is_email_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  email TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT,
  birthday DATE,
  website TEXT,
  facebook TEXT,
  twitter TEXT,
  linkedin TEXT,
  instagram TEXT,
  company TEXT,
  job_title TEXT,
  notes TEXT,
  profile_image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group_Contact junction table
CREATE TABLE IF NOT EXISTS group_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE(group_id, contact_id)
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT TRUE,
  smtp_user TEXT,
  smtp_pass TEXT,
  from_email TEXT,
  from_name TEXT,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  features TEXT, -- JSON stored as TEXT in D1
  price REAL DEFAULT 0.00,
  billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  contact_limit INTEGER DEFAULT 50,
  is_email_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email history table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS email_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_id INTEGER,
  subject TEXT,
  body TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON contacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_name ON contacts(user_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_user_company ON contacts(user_id, company);

-- Enhanced indexes for comprehensive search functionality
CREATE INDEX IF NOT EXISTS idx_contacts_notes ON contacts(notes);
CREATE INDEX IF NOT EXISTS idx_contacts_address ON contacts(address_city, address_state, address_country);
CREATE INDEX IF NOT EXISTS idx_contacts_social ON contacts(website, linkedin, twitter);
CREATE INDEX IF NOT EXISTS idx_contacts_professional ON contacts(company, job_title, role);

-- Full-text search support (expanded for comprehensive search)
CREATE INDEX IF NOT EXISTS idx_contacts_search_core ON contacts(user_id, first_name, last_name, email, phone, company, job_title);
CREATE INDEX IF NOT EXISTS idx_contacts_search_extended ON contacts(user_id, notes, address_city, address_state, role);

CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_contacts_group_id ON group_contacts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_contacts_contact_id ON group_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_contact_id ON email_history(contact_id);

-- Insert default plans
INSERT OR IGNORE INTO plans (name, features, price, billing_cycle, contact_limit, is_email_enabled) VALUES
('Free', '{"contacts": 50, "groups": 5, "import_export": true, "email": false}', 0.00, 'monthly', 50, FALSE),
('Pro', '{"contacts": 500, "groups": 25, "import_export": true, "email": true, "advanced_search": true}', 9.99, 'monthly', 500, TRUE),
('Business', '{"contacts": -1, "groups": -1, "import_export": true, "email": true, "advanced_search": true, "api_access": true}', 29.99, 'monthly', -1, TRUE);
