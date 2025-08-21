/**
 * Email Worker Service - Replaces IMAP-based email fetching
 * Uses HTTP API to fetch emails stored by Email Workers in D1 database
 */

export interface EmailFolder {
  id: string;
  name: string;
  displayName: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom';
  children: EmailFolder[];
  unreadCount: number;
  totalCount: number;
  canSelect: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canRename: boolean;
}

export interface EmailMessage {
  id: string;
  messageId: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  headers: Record<string, string>;
  attachments: any[];
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string;
  flags: {
    seen: boolean;
    flagged: boolean;
  };
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
}

export interface EmailListResponse {
  emails: EmailMessage[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class EmailWorkerService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = '', token: string = '') {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Get folders for an email account
   */
  async getFolders(accountId: string): Promise<{ folders: EmailFolder[]; account: EmailAccount }> {
    const response = await fetch(`${this.baseUrl}/api/email-worker/folders/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch folders: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get emails from a specific folder
   */
  async getEmails(
    accountId: string, 
    folder: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<EmailListResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/api/email-worker/emails/${accountId}/${folder}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific email by ID
   */
  async getEmail(accountId: string, emailId: string): Promise<{ email: EmailMessage }> {
    const response = await fetch(
      `${this.baseUrl}/api/email-worker/emails/${accountId}/email/${emailId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update email properties (mark as read, starred, move to folder, etc.)
   */
  async updateEmail(
    accountId: string, 
    emailId: string, 
    updates: { 
      is_read?: boolean; 
      is_starred?: boolean; 
      folder?: string; 
    }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/api/email-worker/emails/${accountId}/email/${emailId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update email: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Mark email as read
   */
  async markAsRead(accountId: string, emailId: string): Promise<void> {
    await this.updateEmail(accountId, emailId, { is_read: true });
  }

  /**
   * Mark email as unread
   */
  async markAsUnread(accountId: string, emailId: string): Promise<void> {
    await this.updateEmail(accountId, emailId, { is_read: false });
  }

  /**
   * Star email
   */
  async starEmail(accountId: string, emailId: string): Promise<void> {
    await this.updateEmail(accountId, emailId, { is_starred: true });
  }

  /**
   * Unstar email
   */
  async unstarEmail(accountId: string, emailId: string): Promise<void> {
    await this.updateEmail(accountId, emailId, { is_starred: false });
  }

  /**
   * Move email to folder
   */
  async moveToFolder(accountId: string, emailId: string, folder: string): Promise<void> {
    await this.updateEmail(accountId, emailId, { folder });
  }

  /**
   * Delete email (move to trash)
   */
  async deleteEmail(accountId: string, emailId: string): Promise<void> {
    await this.moveToFolder(accountId, emailId, 'trash');
  }

  /**
   * Search emails (basic implementation - can be enhanced)
   */
  async searchEmails(
    accountId: string,
    query: string,
    options: { folder?: string; limit?: number; offset?: number } = {}
  ): Promise<EmailListResponse> {
    // For now, get all emails and filter client-side
    // In production, this should be implemented server-side with proper search indexing
    const folder = options.folder || 'inbox';
    const emails = await this.getEmails(accountId, folder, { 
      limit: options.limit || 100, 
      offset: options.offset || 0 
    });

    const filteredEmails = emails.emails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.from.toLowerCase().includes(query.toLowerCase()) ||
      email.bodyText.toLowerCase().includes(query.toLowerCase())
    );

    return {
      emails: filteredEmails,
      pagination: {
        ...emails.pagination,
        total: filteredEmails.length
      }
    };
  }

  /**
   * Get unread count for all folders
   */
  async getUnreadCounts(accountId: string): Promise<Record<string, number>> {
    const { folders } = await this.getFolders(accountId);
    const counts: Record<string, number> = {};
    
    folders.forEach(folder => {
      counts[folder.name] = folder.unreadCount;
    });

    return counts;
  }

  /**
   * Sync emails (placeholder - Email Workers handle this automatically)
   */
  async syncEmails(accountId: string): Promise<{ success: boolean; message: string }> {
    // Email Workers automatically process incoming emails
    // This method exists for compatibility with existing UI
    return {
      success: true,
      message: 'Email Workers automatically sync incoming emails'
    };
  }
}

// Create a singleton instance for use throughout the app
export const emailWorkerService = new EmailWorkerService();

// Helper function to initialize the service with auth token
export function initializeEmailWorkerService(token: string, baseUrl?: string): EmailWorkerService {
  const service = new EmailWorkerService(baseUrl, token);
  return service;
}
