// Database utilities for Cloudflare D1

// Standardized API Response Interface
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  success?: boolean;
}

// Standardized Error Response Interface
export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  success: false;
}

// Error Types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Error Response Helper
export class ErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    details?: any,
    statusCode: 400 | 401 | 403 | 404 | 409 | 429 | 500 = 500
  ): { response: ApiError; status: 400 | 401 | 403 | 404 | 409 | 429 | 500 } {
    return {
      response: {
        error: message,
        code: type,
        details,
        success: false
      },
      status: statusCode
    };
  }

  static validationError(message: string, details?: any) {
    return this.createError(ErrorType.VALIDATION_ERROR, message, details, 400);
  }

  static authenticationError(message: string = 'Authentication required') {
    return this.createError(ErrorType.AUTHENTICATION_ERROR, message, undefined, 401);
  }

  static authorizationError(message: string = 'Insufficient permissions') {
    return this.createError(ErrorType.AUTHORIZATION_ERROR, message, undefined, 403);
  }

  static notFoundError(message: string = 'Resource not found') {
    return this.createError(ErrorType.NOT_FOUND_ERROR, message, undefined, 404);
  }

  static conflictError(message: string, details?: any) {
    return this.createError(ErrorType.CONFLICT_ERROR, message, details, 409);
  }

  static fileError(message: string, details?: any) {
    return this.createError(ErrorType.FILE_ERROR, message, details, 400);
  }

  static databaseError(message: string = 'Database operation failed') {
    return this.createError(ErrorType.DATABASE_ERROR, message, undefined, 500);
  }

  static internalError(message: string = 'Internal server error') {
    return this.createError(ErrorType.INTERNAL_ERROR, message, undefined, 500);
  }
}

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
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  discord?: string;
  spotify?: string;
  apple_music?: string;
  github?: string;
  behance?: string;
  dribbble?: string;
  company?: string;
  job_title?: string;
  role?: string;
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

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    const allowedFields = ['username', 'email', 'role', 'contact_limit', 'is_email_enabled'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return await this.getUserById(id);
    }

    const setClause = updates.join(', ');
    const result = await this.db.prepare(`
      UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `).bind(...values, id).first<User>();

    return result || null;
  }

  // Contact operations
  async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const result = await this.db.prepare(`
      INSERT INTO contacts (
        user_id, first_name, last_name, nickname, email, phone, address_street, address_city,
        address_state, address_zip, address_country, birthday, website, facebook,
        twitter, linkedin, instagram, youtube, tiktok, snapchat, discord, spotify,
        apple_music, github, behance, dribbble, company, job_title, role, notes, profile_image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      contactData.user_id,
      contactData.first_name,
      contactData.last_name,
      contactData.nickname,
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
      contactData.youtube,
      contactData.tiktok,
      contactData.snapchat,
      contactData.discord,
      contactData.spotify,
      contactData.apple_music,
      contactData.github,
      contactData.behance,
      contactData.dribbble,
      contactData.company,
      contactData.job_title,
      contactData.role,
      contactData.notes,
      contactData.profile_image_url
    ).first<Contact>();

    if (!result) {
      throw new Error('Failed to create contact');
    }
    return result;
  }

  async getContactsByUserId(
    userId: number,
    search?: string,
    sort?: string,
    direction?: string,
    limit?: number,
    offset?: number
  ): Promise<{ contacts: Contact[], total: number }> {
    // Build base query for counting
    let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE user_id = ?';
    let query = 'SELECT * FROM contacts WHERE user_id = ?';
    const params: any[] = [userId];
    const countParams: any[] = [userId];

    // Add comprehensive search conditions across ALL contact fields
    if (search) {
      const searchTerm = search.trim();
      console.log('🔍 Database Search - Term:', searchTerm, 'Length:', searchTerm.length);

      if (searchTerm.length > 0) {
        // Comprehensive search across ALL text fields for maximum discoverability
        const searchCondition = ` AND (
          -- Core identity fields
          first_name LIKE ? OR last_name LIKE ? OR nickname LIKE ? OR
          (first_name || ' ' || last_name) LIKE ? OR

          -- Contact information
          email LIKE ? OR phone LIKE ? OR

          -- Professional information
          company LIKE ? OR job_title LIKE ? OR role LIKE ? OR

          -- Address fields (complete address search)
          address_street LIKE ? OR address_city LIKE ? OR
          address_state LIKE ? OR address_zip LIKE ? OR address_country LIKE ? OR

          -- Social media and web presence
          website LIKE ? OR facebook LIKE ? OR twitter LIKE ? OR
          linkedin LIKE ? OR instagram LIKE ? OR youtube LIKE ? OR
          tiktok LIKE ? OR snapchat LIKE ? OR discord LIKE ? OR
          spotify LIKE ? OR apple_music LIKE ? OR github LIKE ? OR
          behance LIKE ? OR dribbble LIKE ? OR

          -- Notes field (most important for comprehensive search)
          notes LIKE ? OR

          -- Birthday (for date-based searches)
          birthday LIKE ?
        )`;
        query += searchCondition;
        countQuery += searchCondition;

        // Optimize search parameters based on field type
        const containsSearch = `%${searchTerm}%`;  // Most fields use contains search
        const prefixSearch = `${searchTerm}%`;     // Email uses prefix for performance

        const searchParams = [
          // Core identity fields (contains search for partial name matching)
          containsSearch,   // first_name
          containsSearch,   // last_name
          containsSearch,   // nickname
          containsSearch,   // full name concatenation

          // Contact information
          prefixSearch,     // email (prefix for better performance on indexed field)
          containsSearch,   // phone

          // Professional information
          containsSearch,   // company
          containsSearch,   // job_title
          containsSearch,   // role

          // Address fields (all use contains for partial matching)
          containsSearch,   // address_street
          containsSearch,   // address_city
          containsSearch,   // address_state
          containsSearch,   // address_zip
          containsSearch,   // address_country

          // Social media and web presence (all use contains)
          containsSearch,   // website
          containsSearch,   // facebook
          containsSearch,   // twitter
          containsSearch,   // linkedin
          containsSearch,   // instagram
          containsSearch,   // youtube
          containsSearch,   // tiktok
          containsSearch,   // snapchat
          containsSearch,   // discord
          containsSearch,   // spotify
          containsSearch,   // apple_music
          containsSearch,   // github
          containsSearch,   // behance
          containsSearch,   // dribbble

          // Notes field (most important for comprehensive search)
          containsSearch,   // notes

          // Birthday (for date searches like "1990" or "January")
          containsSearch    // birthday
        ];

        params.push(...searchParams);
        countParams.push(...searchParams);

        console.log('🔍 Database Search - Comprehensive search across', searchParams.length, 'fields');
        console.log('🔍 Database Search - Term:', searchTerm);

      }
    }

    // Add sorting
    if (sort) {
      const validSorts = ['first_name', 'last_name', 'email', 'created_at', 'company', 'job_title', 'role'];
      if (validSorts.includes(sort)) {
        const dir = direction === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sort} ${dir}`;
      }
    } else {
      query += ' ORDER BY created_at DESC';
    }

    // Add pagination
    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
      if (offset !== undefined) {
        query += ` OFFSET ${offset}`;
      }
    }

    // Execute both queries
    const [contactsResult, countResult] = await Promise.all([
      this.db.prepare(query).bind(...params).all<Contact>(),
      this.db.prepare(countQuery).bind(...countParams).first<{ total: number }>()
    ]);

    const contacts = contactsResult.results || [];
    const total = countResult?.total || 0;

    console.log('🔍 Database Search - Results:', contacts.length, 'contacts found, total:', total);
    if (search && contacts.length > 0) {
      console.log('🔍 Database Search - First result:', contacts[0].first_name, contacts[0].last_name, contacts[0].nickname);
    }

    return {
      contacts,
      total
    };
  }

  // Keep the old method for backward compatibility
  async getContactsByUserIdLegacy(userId: number, search?: string, sort?: string, direction?: string): Promise<Contact[]> {
    const result = await this.getContactsByUserId(userId, search, sort, direction);
    return result.contacts;
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
