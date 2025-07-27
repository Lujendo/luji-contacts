#!/usr/bin/env node

/**
 * Generate complete SQL migration from JSON data
 */

const fs = require('fs').promises;
const path = require('path');

async function generateSQL() {
  try {
    // Read the JSON data
    const jsonData = await fs.readFile('./migration-data/migration-data.json', 'utf8');
    const data = JSON.parse(jsonData);
    
    const sqlStatements = [];
    
    // Users
    if (data.users && data.users.length > 0) {
      sqlStatements.push('-- Insert users');
      for (const user of data.users) {
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
    if (data.contacts && data.contacts.length > 0) {
      sqlStatements.push('-- Insert contacts');
      for (const contact of data.contacts) {
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
    if (data.groups && data.groups.length > 0) {
      sqlStatements.push('-- Insert groups');
      for (const group of data.groups) {
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
    if (data.group_contacts && data.group_contacts.length > 0) {
      sqlStatements.push('-- Insert group-contact relationships');
      for (const gc of data.group_contacts) {
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
    if (data.user_preferences && data.user_preferences.length > 0) {
      sqlStatements.push('-- Insert user preferences');
      for (const pref of data.user_preferences) {
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

    // Write the complete SQL file
    const sqlContent = sqlStatements.join('\n');
    await fs.writeFile('./migration-data/migration-complete.sql', sqlContent);
    
    console.log('✅ Complete migration SQL generated: migration-data/migration-complete.sql');
    console.log(`📊 Generated ${sqlStatements.filter(s => s.startsWith('INSERT')).length} INSERT statements`);
    
  } catch (error) {
    console.error('❌ Error generating SQL:', error.message);
    process.exit(1);
  }
}

generateSQL();
