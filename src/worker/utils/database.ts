// Database utilities for Cloudflare D1
export interface User {
  id: number;
  username?: string;
  email?: string;
  password?: string;
  role: 'admin' | 'user' | 'subscriber';
  contact_limit?: number;
  is_email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  birthday?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupContact {
  id: number;
  group_id: number;
  contact_id: number;
  created_at?: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_pass?: string;
  from_email?: string;
  from_name?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plan {
  id: number;
  name: string;
  features?: string; // JSON string
  price?: number;
  billing_cycle?: 'monthly' | 'yearly';
  contact_limit?: number;
  is_email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await this.db.prepare(`
      INSERT INTO users (username, email, password, role, contact_limit, is_email_enabled)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      userData.username,
      userData.email,
      userData.password,
      userData.role,
      userData.contact_limit,
      userData.is_email_enabled
    ).first<User>();

    if (!result) {
      throw new Error('Failed to create user');
    }
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
  }

  // Contact operations
  async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const result = await this.db.prepare(`
      INSERT INTO contacts (
        user_id, first_name, last_name, email, phone, address_street, address_city,
        address_state, address_zip, address_country, birthday, website, facebook,
        twitter, linkedin, instagram, company, job_title, notes, profile_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      contactData.user_id,
      contactData.first_name,
      contactData.last_name,
      contactData.email,
      contactData.phone,
      contactData.address_street,
      contactData.address_city,
      contactData.address_state,
      contactData.address_zip,
      contactData.address_country,
      contactData.birthday,
      contactData.website,
      contactData.facebook,
      contactData.twitter,
      contactData.linkedin,
      contactData.instagram,
      contactData.company,
      contactData.job_title,
      contactData.notes,
      contactData.profile_image_url
    ).first<Contact>();

    if (!result) {
      throw new Error('Failed to create contact');
    }
    return result;
  }

  async getContactsByUserId(userId: number, search?: string, sort?: string, direction?: string): Promise<Contact[]> {
    let query = 'SELECT * FROM contacts WHERE user_id = ?';
    const params: any[] = [userId];

    if (search) {
      query += ` AND (
        first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR 
        phone LIKE ? OR notes LIKE ? OR company LIKE ? OR 
        job_title LIKE ? OR address_city LIKE ? OR address_country LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (sort) {
      const validSorts = ['first_name', 'last_name', 'email', 'created_at', 'company'];
      if (validSorts.includes(sort)) {
        const dir = direction === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sort} ${dir}`;
      }
    } else {
      query += ' ORDER BY created_at DESC';
    }

    return await this.db.prepare(query).bind(...params).all<Contact>().then(result => result.results || []);
  }

  async getContactById(id: number, userId: number): Promise<Contact | null> {
    return await this.db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<Contact>();
  }

  async updateContact(id: number, userId: number, contactData: Partial<Contact>): Promise<Contact | null> {
    const fields = Object.keys(contactData).filter(key => key !== 'id' && key !== 'user_id');
    if (fields.length === 0) return null;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (contactData as any)[field]);

    const result = await this.db.prepare(`
      UPDATE contacts SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
      RETURNING *
    `).bind(...values, id, userId).first<Contact>();

    return result || null;
  }

  async deleteContact(id: number, userId: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return result.success && (result.meta?.changes || 0) > 0;
  }

  // Group operations
  async createGroup(groupData: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> {
    const result = await this.db.prepare(`
      INSERT INTO groups (user_id, name, description)
      VALUES (?, ?, ?)
      RETURNING *
    `).bind(groupData.user_id, groupData.name, groupData.description).first<Group>();

    if (!result) {
      throw new Error('Failed to create group');
    }
    return result;
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    return await this.db.prepare('SELECT * FROM groups WHERE user_id = ? ORDER BY name')
      .bind(userId)
      .all<Group>()
      .then(result => result.results || []);
  }

  async getGroupById(id: number, userId: number): Promise<Group | null> {
    return await this.db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first<Group>();
  }

  async updateGroup(id: number, userId: number, groupData: Partial<Group>): Promise<Group | null> {
    const result = await this.db.prepare(`
      UPDATE groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
      RETURNING *
    `).bind(groupData.name, groupData.description, id, userId).first<Group>();

    return result || null;
  }

  async deleteGroup(id: number, userId: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return result.success && (result.meta?.changes || 0) > 0;
  }

  // Group-Contact operations
  async addContactToGroup(groupId: number, contactId: number): Promise<GroupContact> {
    const result = await this.db.prepare(`
      INSERT INTO group_contacts (group_id, contact_id)
      VALUES (?, ?)
      RETURNING *
    `).bind(groupId, contactId).first<GroupContact>();

    if (!result) {
      throw new Error('Failed to add contact to group');
    }
    return result;
  }

  async removeContactFromGroup(groupId: number, contactId: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM group_contacts WHERE group_id = ? AND contact_id = ?')
      .bind(groupId, contactId)
      .run();

    return result.success && (result.meta?.changes || 0) > 0;
  }

  async getContactsByGroupId(groupId: number): Promise<Contact[]> {
    return await this.db.prepare(`
      SELECT c.* FROM contacts c
      JOIN group_contacts gc ON c.id = gc.contact_id
      WHERE gc.group_id = ?
      ORDER BY c.first_name, c.last_name
    `).bind(groupId).all<Contact>().then(result => result.results || []);
  }

  async getGroupsByContactId(contactId: number): Promise<Group[]> {
    return await this.db.prepare(`
      SELECT g.* FROM groups g
      JOIN group_contacts gc ON g.id = gc.group_id
      WHERE gc.contact_id = ?
      ORDER BY g.name
    `).bind(contactId).all<Group>().then(result => result.results || []);
  }
}
