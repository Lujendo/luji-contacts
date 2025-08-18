import { EmailAccount, EmailFolder, EmailMessage } from '../../types/emailClient';

export interface EmailEngineConfig {
  baseUrl: string;
  accessToken?: string;
}

export interface EmailEngineAccount {
  account: string;
  name: string;
  email: string;
  state: 'connected' | 'connecting' | 'authenticationError' | 'connectError';
  imap?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailEngineMessage {
  id: string;
  uid: number;
  emailId: string;
  messageId: string;
  date: string;
  flags: string[];
  envelope: {
    from: Array<{ name?: string; address: string }>;
    to: Array<{ name?: string; address: string }>;
    cc?: Array<{ name?: string; address: string }>;
    subject: string;
    messageId: string;
    date: string;
  };
  bodyStructure: any;
  size: number;
  text?: {
    id: string;
    encodedSize: number;
  };
  html?: {
    id: string;
    encodedSize: number;
  };
}

/**
 * EmailEngine Service for reliable email integration
 * Uses EmailEngine REST API for production-ready email handling
 */
export class EmailEngineService {
  private config: EmailEngineConfig;

  constructor(config: EmailEngineConfig) {
    this.config = config;
  }

  /**
   * Create email account in EmailEngine
   */
  async createAccount(account: EmailAccount): Promise<{ success: boolean; accountId?: string; error?: string }> {
    try {
      console.log(`📧 Creating EmailEngine account for: ${account.email}`);

      const emailEngineAccount: Partial<EmailEngineAccount> = {
        account: account.id,
        name: account.name,
        email: account.email,
        imap: {
          host: account.incoming.host,
          port: account.incoming.port,
          secure: account.incoming.secure,
          auth: {
            user: account.incoming.username,
            pass: account.incoming.password
          }
        },
        smtp: {
          host: account.outgoing.host,
          port: account.outgoing.port,
          secure: account.outgoing.secure,
          auth: {
            user: account.outgoing.username,
            pass: account.outgoing.password
          }
        }
      };

      const response = await fetch(`${this.config.baseUrl}/v1/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        },
        body: JSON.stringify(emailEngineAccount)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ EmailEngine account created: ${account.email}`);
        return { success: true, accountId: result.account };
      } else {
        const error = await response.text();
        console.error(`❌ EmailEngine account creation failed: ${error}`);
        return { success: false, error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ EmailEngine account creation error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get account status from EmailEngine
   */
  async getAccountStatus(accountId: string): Promise<{ success: boolean; account?: EmailEngineAccount; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/account/${accountId}`, {
        headers: {
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        }
      });

      if (response.ok) {
        const account = await response.json();
        return { success: true, account };
      } else {
        const error = await response.text();
        return { success: false, error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get folders from EmailEngine
   */
  async getFolders(accountId: string): Promise<EmailFolder[]> {
    try {
      console.log(`📧 Fetching folders from EmailEngine for account: ${accountId}`);

      const response = await fetch(`${this.config.baseUrl}/v1/account/${accountId}/mailboxes`, {
        headers: {
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        const folders = this.convertEmailEngineFolders(data.mailboxes || []);
        console.log(`✅ EmailEngine returned ${folders.length} folders`);
        return folders;
      } else {
        const error = await response.text();
        console.error(`❌ EmailEngine folders fetch failed: ${error}`);
        return this.getDefaultFolders();
      }

    } catch (error) {
      console.error('❌ EmailEngine folders error:', error);
      return this.getDefaultFolders();
    }
  }

  /**
   * Get messages from EmailEngine
   */
  async getMessages(accountId: string, mailboxPath: string, limit: number = 50): Promise<EmailMessage[]> {
    try {
      console.log(`📧 Fetching messages from EmailEngine: ${accountId}/${mailboxPath}`);

      const response = await fetch(`${this.config.baseUrl}/v1/account/${accountId}/messages?path=${encodeURIComponent(mailboxPath)}&limit=${limit}`, {
        headers: {
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = this.convertEmailEngineMessages(data.messages || [], mailboxPath);
        console.log(`✅ EmailEngine returned ${messages.length} messages`);
        return messages;
      } else {
        const error = await response.text();
        console.error(`❌ EmailEngine messages fetch failed: ${error}`);
        return [];
      }

    } catch (error) {
      console.error('❌ EmailEngine messages error:', error);
      return [];
    }
  }

  /**
   * Get message content from EmailEngine
   */
  async getMessageContent(accountId: string, messageId: string): Promise<{ text?: string; html?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/account/${accountId}/message/${messageId}`, {
        headers: {
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          text: data.text?.content,
          html: data.html?.content
        };
      } else {
        console.error('❌ Failed to fetch message content');
        return {};
      }

    } catch (error) {
      console.error('❌ EmailEngine message content error:', error);
      return {};
    }
  }

  /**
   * Test EmailEngine connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/settings`, {
        headers: {
          ...(this.config.accessToken && { 'Authorization': `Bearer ${this.config.accessToken}` })
        }
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert EmailEngine folders to our format
   */
  private convertEmailEngineFolders(emailEngineFolders: any[]): EmailFolder[] {
    return emailEngineFolders.map((folder, index) => ({
      id: folder.path || `folder_${index}`,
      name: folder.path || folder.name,
      displayName: folder.name || folder.path,
      type: this.determineFolderType(folder.path || folder.name),
      children: [],
      unreadCount: folder.unseen || 0,
      totalCount: folder.messages || 0,
      canSelect: !folder.noSelect,
      canCreate: !folder.noInferiors,
      canDelete: folder.subscribed !== false,
      canRename: folder.subscribed !== false
    }));
  }

  /**
   * Convert EmailEngine messages to our format
   */
  private convertEmailEngineMessages(emailEngineMessages: EmailEngineMessage[], folderId: string): EmailMessage[] {
    return emailEngineMessages.map((msg) => {
      const from = msg.envelope.from?.[0];
      const to = msg.envelope.to || [];
      const cc = msg.envelope.cc || [];

      return {
        id: msg.id,
        messageId: msg.messageId,
        subject: msg.envelope.subject || '(No Subject)',
        from: {
          name: from?.name || '',
          email: from?.address || ''
        },
        to: to.map(addr => ({
          name: addr.name || '',
          email: addr.address
        })),
        cc: cc.map(addr => ({
          name: addr.name || '',
          email: addr.address
        })),
        bcc: [],
        date: new Date(msg.envelope.date),
        receivedDate: new Date(msg.date),
        body: {
          text: '', // Will be fetched separately
          html: ''  // Will be fetched separately
        },
        attachments: [],
        flags: {
          seen: msg.flags.includes('\\Seen'),
          answered: msg.flags.includes('\\Answered'),
          flagged: msg.flags.includes('\\Flagged'),
          deleted: msg.flags.includes('\\Deleted'),
          draft: msg.flags.includes('\\Draft'),
          recent: msg.flags.includes('\\Recent')
        },
        headers: {},
        size: msg.size,
        folder: folderId,
        uid: msg.uid,
        isRead: msg.flags.includes('\\Seen'),
        isStarred: msg.flags.includes('\\Flagged'),
        isImportant: false,
        labels: []
      };
    });
  }

  /**
   * Determine folder type from name
   */
  private determineFolderType(folderName: string): EmailFolder['type'] {
    const name = folderName.toLowerCase();
    if (name === 'inbox') return 'inbox';
    if (name.includes('sent')) return 'sent';
    if (name.includes('draft')) return 'drafts';
    if (name.includes('spam') || name.includes('junk')) return 'spam';
    if (name.includes('trash') || name.includes('deleted')) return 'trash';
    if (name.includes('archive')) return 'archive';
    return 'custom';
  }

  /**
   * Get default folders when EmailEngine is unavailable
   */
  private getDefaultFolders(): EmailFolder[] {
    return [
      {
        id: 'inbox',
        name: 'INBOX',
        displayName: 'Inbox',
        type: 'inbox',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'sent',
        name: 'Sent',
        displayName: 'Sent',
        type: 'sent',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'drafts',
        name: 'Drafts',
        displayName: 'Drafts',
        type: 'drafts',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      }
    ];
  }
}
