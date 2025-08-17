-- Create email_accounts table for storing user email account configurations
CREATE TABLE IF NOT EXISTS email_accounts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'imap',
  
  -- Incoming server settings (IMAP/POP3)
  incoming_host TEXT NOT NULL,
  incoming_port INTEGER NOT NULL DEFAULT 993,
  incoming_secure BOOLEAN NOT NULL DEFAULT 1,
  incoming_username TEXT NOT NULL,
  incoming_password TEXT NOT NULL,
  incoming_auth_method TEXT NOT NULL DEFAULT 'plain',
  
  -- Outgoing server settings (SMTP)
  outgoing_host TEXT,
  outgoing_port INTEGER DEFAULT 587,
  outgoing_secure BOOLEAN DEFAULT 1,
  outgoing_username TEXT,
  outgoing_password TEXT,
  outgoing_auth_method TEXT DEFAULT 'plain',
  
  -- Account settings
  sync_interval INTEGER NOT NULL DEFAULT 5,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  last_sync TEXT NOT NULL,
  
  -- Timestamps
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_default ON email_accounts(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON email_accounts(user_id, is_active);
