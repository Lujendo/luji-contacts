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
}
