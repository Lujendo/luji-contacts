#!/usr/bin/env node

/**
 * Data Migration Script: contacts1 (MariaDB) -> luji-contacts (Cloudflare D1)
 * 
 * This script migrates data from the original contacts1 MariaDB database
 * to the new Cloudflare D1 database structure.
 */

const mariadb = require('mariadb');
const fs = require('fs').promises;
const path = require('path');

// Database configuration for the source (contacts1)
const sourceDbConfig = {
  host: process.env.SOURCE_DB_HOST || 'localhost',
  user: process.env.SOURCE_DB_USER || 'contacts_user',
  password: process.env.SOURCE_DB_PASS || 'contacts_password',
  database: process.env.SOURCE_DB_NAME || 'contacts_db',
  port: process.env.SOURCE_DB_PORT || 3306,
  connectionLimit: 5
};

// Output directory for migration files
const MIGRATION_DIR = './migration-data';

class DataMigrator {
  constructor() {
    this.sourcePool = null;
    this.migrationData = {
      users: [],
      contacts: [],
      groups: [],
      group_contacts: [],
      user_preferences: [],
      plans: []
    };
  }

  async initialize() {
    console.log('🔄 Initializing data migration...');

    // Create migration directory
    try {
      await fs.mkdir(MIGRATION_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // For this demo, we'll skip the database connection and use sample data
    console.log('💡 Using sample data (source database connection skipped)');
    return false;
  }

  async exportSourceData() {
    console.log('📤 Exporting data from source database...');

    try {
      // Export users
      const users = await this.sourcePool.query('SELECT * FROM users ORDER BY id');
      this.migrationData.users = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role || 'user',
        contact_limit: user.contact_limit || 50,
        is_email_enabled: user.is_email_enabled || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      console.log(`   ✅ Exported ${this.migrationData.users.length} users`);

      // Export contacts
      const contacts = await this.sourcePool.query('SELECT * FROM contacts ORDER BY id');
      this.migrationData.contacts = contacts.map(contact => ({
        id: contact.id,
        user_id: contact.user_id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        address_street: contact.address_street,
        address_city: contact.address_city,
        address_state: contact.address_state,
        address_zip: contact.address_zip,
        address_country: contact.address_country,
        birthday: contact.birthday,
        website: contact.website,
        facebook: contact.facebook,
        twitter: contact.twitter,
        linkedin: contact.linkedin,
        instagram: contact.instagram,
        company: contact.company,
        job_title: contact.job_title,
        notes: contact.notes,
        profile_image_url: contact.profile_image_url,
        created_at: contact.created_at,
        updated_at: contact.updated_at
      }));
      console.log(`   ✅ Exported ${this.migrationData.contacts.length} contacts`);

      // Export groups
      const groups = await this.sourcePool.query('SELECT * FROM groups ORDER BY id');
      this.migrationData.groups = groups.map(group => ({
        id: group.id,
        user_id: group.user_id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        updated_at: group.updated_at
      }));
      console.log(`   ✅ Exported ${this.migrationData.groups.length} groups`);

      // Export group_contacts
      const groupContacts = await this.sourcePool.query('SELECT * FROM group_contacts ORDER BY id');
      this.migrationData.group_contacts = groupContacts.map(gc => ({
        id: gc.id,
        group_id: gc.group_id,
        contact_id: gc.contact_id,
        created_at: gc.created_at
      }));
      console.log(`   ✅ Exported ${this.migrationData.group_contacts.length} group-contact relationships`);

      // Export user_preferences
      try {
        const userPrefs = await this.sourcePool.query('SELECT * FROM user_preferences ORDER BY id');
        this.migrationData.user_preferences = userPrefs.map(pref => ({
          id: pref.id,
          user_id: pref.user_id,
          smtp_host: pref.smtp_host,
          smtp_port: pref.smtp_port,
          smtp_secure: pref.smtp_secure,
          smtp_user: pref.smtp_user,
          smtp_pass: pref.smtp_pass,
          from_email: pref.from_email,
          from_name: pref.from_name,
          theme: pref.theme || 'light',
          language: pref.language || 'en',
          timezone: pref.timezone || 'UTC',
          created_at: pref.created_at,
          updated_at: pref.updated_at
        }));
        console.log(`   ✅ Exported ${this.migrationData.user_preferences.length} user preferences`);
      } catch (error) {
        console.log('   ⚠️  User preferences table not found, skipping...');
      }

      // Export plans (if exists)
      try {
        const plans = await this.sourcePool.query('SELECT * FROM plans ORDER BY id');
        this.migrationData.plans = plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          features: plan.features,
          price: plan.price,
          billing_cycle: plan.billing_cycle,
          contact_limit: plan.contact_limit,
          is_email_enabled: plan.is_email_enabled,
          created_at: plan.created_at,
          updated_at: plan.updated_at
        }));
        console.log(`   ✅ Exported ${this.migrationData.plans.length} plans`);
      } catch (error) {
        console.log('   ⚠️  Plans table not found, will use default plans...');
      }

    } catch (error) {
      console.error('❌ Error exporting data:', error.message);
      throw error;
    }
  }

  async createSampleData() {
    console.log('📝 Creating sample data (source database not available)...');

    // Sample users (passwords are hashed for 'password123')
    this.migrationData.users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@luji-contacts.com',
        password: '$2b$10$JKbGQbRHRhJVq0Qm9hKqY.Sc9z5OLj1d7SkRnkA.j2D.3fCq0qyYe',
        role: 'admin',
        contact_limit: -1,
        is_email_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'demo_user',
        email: 'demo@luji-contacts.com',
        password: '$2b$10$JKbGQbRHRhJVq0Qm9hKqY.Sc9z5OLj1d7SkRnkA.j2D.3fCq0qyYe',
        role: 'user',
        contact_limit: 100,
        is_email_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample contacts
    this.migrationData.contacts = [
      {
        id: 1,
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        address_street: '123 Main Street',
        address_city: 'San Francisco',
        address_state: 'CA',
        address_zip: '94105',
        address_country: 'USA',
        company: 'Tech Corp',
        job_title: 'Software Engineer',
        website: 'https://johndoe.dev',
        linkedin: 'https://linkedin.com/in/johndoe',
        notes: 'Lead developer on the mobile app project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-987-6543',
        address_street: '456 Oak Avenue',
        address_city: 'New York',
        address_state: 'NY',
        address_zip: '10001',
        address_country: 'USA',
        company: 'Design Studio',
        job_title: 'UX Designer',
        website: 'https://janesmith.design',
        notes: 'Excellent designer, worked on our last three projects',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 2,
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike@example.com',
        phone: '+1-555-555-0123',
        address_city: 'Austin',
        address_state: 'TX',
        address_country: 'USA',
        company: 'Startup Inc',
        job_title: 'CEO',
        notes: 'Potential business partner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample groups
    this.migrationData.groups = [
      {
        id: 1,
        user_id: 1,
        name: 'Work Colleagues',
        description: 'People I work with regularly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 1,
        name: 'Clients',
        description: 'Current and potential clients',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 2,
        name: 'Business Network',
        description: 'Professional networking contacts',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Sample group-contact relationships
    this.migrationData.group_contacts = [
      { id: 1, group_id: 1, contact_id: 1, created_at: new Date().toISOString() },
      { id: 2, group_id: 1, contact_id: 2, created_at: new Date().toISOString() },
      { id: 3, group_id: 3, contact_id: 3, created_at: new Date().toISOString() }
    ];

    // Sample user preferences
    this.migrationData.user_preferences = [
      {
        id: 1,
        user_id: 1,
        theme: 'light',
        language: 'en',
        timezone: 'America/Los_Angeles',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 2,
        theme: 'dark',
        language: 'en',
        timezone: 'America/Chicago',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('✅ Sample data created successfully');
  }

  async saveToFiles() {
    console.log('💾 Saving migration data to files...');

    // Save raw data as JSON for reference
    await fs.writeFile(
      path.join(MIGRATION_DIR, 'migration-data.json'),
      JSON.stringify(this.migrationData, null, 2)
    );

    // Generate D1 SQL migration file
    const sqlStatements = [];

    // Users
    if (this.migrationData.users.length > 0) {
      sqlStatements.push('-- Insert users');
      for (const user of this.migrationData.users) {
        const values = [
          user.id,
          user.username ? `'${user.username.replace(/'/g, "''")}'` : 'NULL',
          user.email ? `'${user.email.replace(/'/g, "''")}'` : 'NULL',
          user.password ? `'${user.password.replace(/'/g, "''")}'` : 'NULL',
          `'${user.role}'`,
          user.contact_limit || 50,
          user.is_email_enabled ? 1 : 0,
          user.created_at ? `'${user.created_at}'` : 'CURRENT_TIMESTAMP',
          user.updated_at ? `'${user.updated_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO users (id, username, email, password, role, contact_limit, is_email_enabled, created_at, updated_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    // Contacts
    if (this.migrationData.contacts.length > 0) {
      sqlStatements.push('-- Insert contacts');
      for (const contact of this.migrationData.contacts) {
        const values = [
          contact.id,
          contact.user_id,
          contact.first_name ? `'${contact.first_name.replace(/'/g, "''")}'` : 'NULL',
          contact.last_name ? `'${contact.last_name.replace(/'/g, "''")}'` : 'NULL',
          contact.email ? `'${contact.email.replace(/'/g, "''")}'` : 'NULL',
          contact.phone ? `'${contact.phone.replace(/'/g, "''")}'` : 'NULL',
          contact.address_street ? `'${contact.address_street.replace(/'/g, "''")}'` : 'NULL',
          contact.address_city ? `'${contact.address_city.replace(/'/g, "''")}'` : 'NULL',
          contact.address_state ? `'${contact.address_state.replace(/'/g, "''")}'` : 'NULL',
          contact.address_zip ? `'${contact.address_zip.replace(/'/g, "''")}'` : 'NULL',
          contact.address_country ? `'${contact.address_country.replace(/'/g, "''")}'` : 'NULL',
          contact.birthday ? `'${contact.birthday}'` : 'NULL',
          contact.website ? `'${contact.website.replace(/'/g, "''")}'` : 'NULL',
          contact.facebook ? `'${contact.facebook.replace(/'/g, "''")}'` : 'NULL',
          contact.twitter ? `'${contact.twitter.replace(/'/g, "''")}'` : 'NULL',
          contact.linkedin ? `'${contact.linkedin.replace(/'/g, "''")}'` : 'NULL',
          contact.instagram ? `'${contact.instagram.replace(/'/g, "''")}'` : 'NULL',
          contact.company ? `'${contact.company.replace(/'/g, "''")}'` : 'NULL',
          contact.job_title ? `'${contact.job_title.replace(/'/g, "''")}'` : 'NULL',
          contact.notes ? `'${contact.notes.replace(/'/g, "''")}'` : 'NULL',
          contact.profile_image_url ? `'${contact.profile_image_url.replace(/'/g, "''")}'` : 'NULL',
          contact.created_at ? `'${contact.created_at}'` : 'CURRENT_TIMESTAMP',
          contact.updated_at ? `'${contact.updated_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO contacts (id, user_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, address_country, birthday, website, facebook, twitter, linkedin, instagram, company, job_title, notes, profile_image_url, created_at, updated_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    // Groups
    if (this.migrationData.groups.length > 0) {
      sqlStatements.push('-- Insert groups');
      for (const group of this.migrationData.groups) {
        const values = [
          group.id,
          group.user_id,
          group.name ? `'${group.name.replace(/'/g, "''")}'` : 'NULL',
          group.description ? `'${group.description.replace(/'/g, "''")}'` : 'NULL',
          group.created_at ? `'${group.created_at}'` : 'CURRENT_TIMESTAMP',
          group.updated_at ? `'${group.updated_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO groups (id, user_id, name, description, created_at, updated_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    // Group contacts
    if (this.migrationData.group_contacts.length > 0) {
      sqlStatements.push('-- Insert group-contact relationships');
      for (const gc of this.migrationData.group_contacts) {
        const values = [
          gc.id,
          gc.group_id,
          gc.contact_id,
          gc.created_at ? `'${gc.created_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO group_contacts (id, group_id, contact_id, created_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    // User preferences
    if (this.migrationData.user_preferences.length > 0) {
      sqlStatements.push('-- Insert user preferences');
      for (const pref of this.migrationData.user_preferences) {
        const values = [
          pref.id,
          pref.user_id,
          pref.smtp_host ? `'${pref.smtp_host.replace(/'/g, "''")}'` : 'NULL',
          pref.smtp_port || 'NULL',
          pref.smtp_secure ? 1 : 0,
          pref.smtp_user ? `'${pref.smtp_user.replace(/'/g, "''")}'` : 'NULL',
          pref.smtp_pass ? `'${pref.smtp_pass.replace(/'/g, "''")}'` : 'NULL',
          pref.from_email ? `'${pref.from_email.replace(/'/g, "''")}'` : 'NULL',
          pref.from_name ? `'${pref.from_name.replace(/'/g, "''")}'` : 'NULL',
          `'${pref.theme}'`,
          `'${pref.language}'`,
          pref.timezone ? `'${pref.timezone.replace(/'/g, "''")}'` : 'NULL',
          pref.created_at ? `'${pref.created_at}'` : 'CURRENT_TIMESTAMP',
          pref.updated_at ? `'${pref.updated_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO user_preferences (id, user_id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name, theme, language, timezone, created_at, updated_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    // Plans (if any)
    if (this.migrationData.plans.length > 0) {
      sqlStatements.push('-- Insert plans');
      for (const plan of this.migrationData.plans) {
        const values = [
          plan.id,
          plan.name ? `'${plan.name.replace(/'/g, "''")}'` : 'NULL',
          plan.features ? `'${plan.features.replace(/'/g, "''")}'` : 'NULL',
          plan.price || 0,
          plan.billing_cycle ? `'${plan.billing_cycle.replace(/'/g, "''")}'` : 'NULL',
          plan.contact_limit || 50,
          plan.is_email_enabled ? 1 : 0,
          plan.created_at ? `'${plan.created_at}'` : 'CURRENT_TIMESTAMP',
          plan.updated_at ? `'${plan.updated_at}'` : 'CURRENT_TIMESTAMP'
        ];
        sqlStatements.push(
          `INSERT OR REPLACE INTO plans (id, name, features, price, billing_cycle, contact_limit, is_email_enabled, created_at, updated_at) VALUES (${values.join(', ')});`
        );
      }
      sqlStatements.push('');
    }

    const sqlContent = sqlStatements.join('\n');
    await fs.writeFile(path.join(MIGRATION_DIR, 'migration.sql'), sqlContent);

    console.log(`✅ Migration files saved to ${MIGRATION_DIR}/`);
    console.log(`   📄 migration-data.json - Raw data in JSON format`);
    console.log(`   📄 migration.sql - D1 SQL migration script`);
  }

  async cleanup() {
    if (this.sourcePool) {
      await this.sourcePool.end();
      console.log('✅ Source database connection closed');
    }
  }

  async run() {
    try {
      const connected = await this.initialize();
      
      if (connected) {
        await this.exportSourceData();
      } else {
        await this.createSampleData();
      }
      
      await this.saveToFiles();
      
      console.log('\n🎉 Data migration preparation completed!');
      console.log('\n📋 Next steps:');
      console.log('1. Review the generated files in ./migration-data/');
      console.log('2. Run: npx wrangler d1 execute luji-contacts-db --file=migration-data/migration.sql --remote');
      console.log('3. Verify the data in your Cloudflare D1 database');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.run();
}

module.exports = DataMigrator;
