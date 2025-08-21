import { D1Database } from '@cloudflare/workers-types';

export class DatabaseMigrations {
  constructor(private db: D1Database) {}

  async runMigrations(): Promise<void> {
    // Create migrations table if it doesn't exist
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Check if nickname migration has been run
    const nicknameExists = await this.db.prepare(`
      SELECT name FROM migrations WHERE name = ?
    `).bind('001_add_nickname_field').first();

    if (!nicknameExists) {
      // Check if nickname column already exists
      const tableInfo = await this.db.prepare(`
        PRAGMA table_info(contacts)
      `).all();

      const hasNickname = tableInfo.results?.some((column: any) => column.name === 'nickname');

      if (!hasNickname) {
        console.log('Adding nickname column to contacts table...');
        
        // Add nickname column
        await this.db.prepare(`
          ALTER TABLE contacts ADD COLUMN nickname TEXT
        `).run();

        console.log('Nickname column added successfully');
      }

      // Mark migration as completed
      await this.db.prepare(`
        INSERT INTO migrations (name) VALUES (?)
      `).bind('001_add_nickname_field').run();

      console.log('Migration 001_add_nickname_field completed');
    }

    // Run email tables migration
    await this.createEmailTables();

    // Check if email_accounts table migration is needed
    const emailAccountsExists = await this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='email_accounts'
    `).first();

    if (!emailAccountsExists) {
      console.log('Creating email_accounts table...');

      // Create email_accounts table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_accounts (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'imap',

          -- Incoming server settings (IMAP/POP3)
          incoming_host TEXT NOT NULL,
          incoming_port INTEGER NOT NULL DEFAULT 993,
          incoming_secure INTEGER NOT NULL DEFAULT 1,
          incoming_username TEXT NOT NULL,
          incoming_password TEXT NOT NULL,
          incoming_auth_method TEXT NOT NULL DEFAULT 'plain',

          -- Outgoing server settings (SMTP)
          outgoing_host TEXT,
          outgoing_port INTEGER DEFAULT 587,
          outgoing_secure INTEGER DEFAULT 1,
          outgoing_username TEXT,
          outgoing_password TEXT,
          outgoing_auth_method TEXT DEFAULT 'plain',

          -- Account settings
          sync_interval INTEGER NOT NULL DEFAULT 5,
          is_default INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_sync TEXT NOT NULL,

          -- Timestamps
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

          -- Foreign key constraint
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_is_default ON email_accounts(user_id, is_default)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON email_accounts(user_id, is_active)
      `).run();

      console.log('Email accounts table and indexes created successfully');
    }

    // Migration 003: Add OAuth columns for email_accounts
    const oauthMigExists = await this.db.prepare(`
      SELECT name FROM migrations WHERE name = ?
    `).bind('003_add_email_oauth_columns').first();

    if (!oauthMigExists) {
      // Check existing columns
      const tableInfo = await this.db.prepare(`PRAGMA table_info(email_accounts)`).all();
      const has = (name: string) => (tableInfo.results || []).some((c: any) => c.name === name);

      const alterStatements: string[] = [];
      if (!has('incoming_oauth_provider')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_provider TEXT`);
      if (!has('incoming_oauth_access_token')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_access_token TEXT`);
      if (!has('incoming_oauth_refresh_token')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_refresh_token TEXT`);
      if (!has('incoming_oauth_expires_at')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_expires_at TEXT`);
      if (!has('incoming_oauth_scope')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_scope TEXT`);
      if (!has('incoming_oauth_token_type')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN incoming_oauth_token_type TEXT`);

      // Optional: outgoing (SMTP) OAuth columns for future use
      if (!has('outgoing_oauth_provider')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_provider TEXT`);
      if (!has('outgoing_oauth_access_token')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_access_token TEXT`);
      if (!has('outgoing_oauth_refresh_token')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_refresh_token TEXT`);
      if (!has('outgoing_oauth_expires_at')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_expires_at TEXT`);
      if (!has('outgoing_oauth_scope')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_scope TEXT`);
      if (!has('outgoing_oauth_token_type')) alterStatements.push(`ALTER TABLE email_accounts ADD COLUMN outgoing_oauth_token_type TEXT`);

      for (const stmt of alterStatements) {
        await this.db.prepare(stmt).run();
      }

      await this.db.prepare(`INSERT INTO migrations (name) VALUES (?)`).bind('003_add_email_oauth_columns').run();
      console.log('Migration 003_add_email_oauth_columns completed');
    }

    // Migration 004: Create emails table for Email Workers
    const emailWorkerMigExists = await this.db.prepare(`
      SELECT name FROM migrations WHERE name = ?
    `).bind('004_create_email_worker_tables').first();

    if (!emailWorkerMigExists) {
      console.log('Creating Email Worker tables...');

      // Create emails table for storing incoming emails
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS worker_emails (
          id TEXT PRIMARY KEY,
          message_id TEXT UNIQUE,
          account_id TEXT,
          from_addr TEXT NOT NULL,
          to_addr TEXT NOT NULL,
          cc_addr TEXT,
          bcc_addr TEXT,
          reply_to TEXT,
          subject TEXT,
          body_text TEXT,
          body_html TEXT,
          headers TEXT, -- JSON string of all headers
          attachments TEXT, -- JSON string of attachment metadata
          folder TEXT DEFAULT 'inbox',
          is_read BOOLEAN DEFAULT FALSE,
          is_starred BOOLEAN DEFAULT FALSE,
          is_deleted BOOLEAN DEFAULT FALSE,
          received_at TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes for worker_emails
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_worker_emails_account_folder ON worker_emails(account_id, folder)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_worker_emails_received_at ON worker_emails(received_at DESC)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_worker_emails_message_id ON worker_emails(message_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_worker_emails_from_addr ON worker_emails(from_addr)
      `).run();

      // Create email_folders table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_folders (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          name TEXT NOT NULL,
          display_name TEXT NOT NULL,
          type TEXT DEFAULT 'custom', -- inbox, sent, drafts, trash, spam, custom
          parent_id TEXT,
          unread_count INTEGER DEFAULT 0,
          total_count INTEGER DEFAULT 0,
          can_select BOOLEAN DEFAULT TRUE,
          can_create BOOLEAN DEFAULT FALSE,
          can_delete BOOLEAN DEFAULT FALSE,
          can_rename BOOLEAN DEFAULT TRUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES email_folders(id) ON DELETE CASCADE,
          UNIQUE(account_id, name)
        )
      `).run();

      // Create indexes for email_folders
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_folders_account ON email_folders(account_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_folders_type ON email_folders(account_id, type)
      `).run();

      await this.db.prepare(`INSERT INTO migrations (name) VALUES (?)`).bind('004_create_email_worker_tables').run();
      console.log('Migration 004_create_email_worker_tables completed');
    }
  }

  async checkNicknameColumn(): Promise<boolean> {
    try {
      const tableInfo = await this.db.prepare(`
        PRAGMA table_info(contacts)
      `).all();

      return tableInfo.results?.some((column: any) => column.name === 'nickname') || false;
    } catch (error) {
      console.error('Error checking nickname column:', error);
      return false;
    }
  }

  async createEmailTables(): Promise<void> {
    // Check if email tables migration has been run
    const emailTablesExists = await this.db.prepare(`
      SELECT name FROM migrations WHERE name = ?
    `).bind('002_create_email_tables').first();

    if (!emailTablesExists) {
      console.log('Creating email tables...');

      // Create emails table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          subject TEXT,
          body TEXT,
          recipients_count INTEGER DEFAULT 0,
          queue_id TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT NOT NULL,
          sent_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create email_queue table (for tracking)
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_queue_logs (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          queue_id TEXT NOT NULL,
          status TEXT NOT NULL,
          provider_id TEXT,
          error_message TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create email_providers table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_providers (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          priority INTEGER DEFAULT 1,
          config TEXT NOT NULL,
          daily_limit INTEGER,
          daily_sent INTEGER DEFAULT 0,
          last_reset_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create email_templates table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          category TEXT DEFAULT 'personal',
          subject TEXT NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT,
          variables TEXT, -- JSON array of template variables
          is_public INTEGER DEFAULT 0,
          thumbnail TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create email_accounts table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS email_accounts (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'imap',

          -- Incoming server settings (IMAP/POP3)
          incoming_host TEXT NOT NULL,
          incoming_port INTEGER NOT NULL DEFAULT 993,
          incoming_secure INTEGER NOT NULL DEFAULT 1,
          incoming_username TEXT NOT NULL,
          incoming_password TEXT NOT NULL,
          incoming_auth_method TEXT NOT NULL DEFAULT 'plain',

          -- Outgoing server settings (SMTP)
          outgoing_host TEXT,
          outgoing_port INTEGER DEFAULT 587,
          outgoing_secure INTEGER DEFAULT 1,
          outgoing_username TEXT,
          outgoing_password TEXT,
          outgoing_auth_method TEXT DEFAULT 'plain',

          -- Account settings
          sync_interval INTEGER NOT NULL DEFAULT 5,
          is_default INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_sync TEXT NOT NULL,

          -- Timestamps
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

          -- Foreign key constraint
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes for better performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_queue_logs_user_id ON email_queue_logs(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_queue_logs_queue_id ON email_queue_logs(queue_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_providers_user_id ON email_providers(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_is_default ON email_accounts(user_id, is_default)
      `).run();

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON email_accounts(user_id, is_active)
      `).run();

      // Mark migration as completed
      await this.db.prepare(`
        INSERT INTO migrations (name) VALUES (?)
      `).bind('002_create_email_tables').run();

      console.log('✅ Email tables created successfully');
    }
  }
}
