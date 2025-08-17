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

      // Mark migration as completed
      await this.db.prepare(`
        INSERT INTO migrations (name) VALUES (?)
      `).bind('002_create_email_tables').run();

      console.log('✅ Email tables created successfully');
    }
  }
}
