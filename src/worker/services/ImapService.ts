import { CFImap } from 'cf-imap';
import { EmailAccount, EmailFolder, EmailMessage } from '../../types/emailClient';

export interface ImapConnectionConfig {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    username?: string;
    password?: string;
  };
  authMethod?: 'plain' | 'oauth2';
  oauth?: {
    user: string;
    accessToken: string;
  };
}

export interface ImapFolder {
  name: string;
  delimiter: string;
  flags: string[];
  children?: ImapFolder[];
}

export interface ImapMessage {
  uid: number;
  flags: string[];
  envelope: {
    date: string;
    subject: string;
    from: Array<{ name?: string; mailbox: string; host: string }>;
    to: Array<{ name?: string; mailbox: string; host: string }>;
    cc?: Array<{ name?: string; mailbox: string; host: string }>;
    bcc?: Array<{ name?: string; mailbox: string; host: string }>;
    messageId: string;
  };
  bodyStructure: any;
  size: number;
}

export class ImapService {
  private imap: CFImap | null = null;
  private isConnected = false;

  /**
   * Create IMAP connection from email account
   */
  static createConnectionConfig(account: EmailAccount): ImapConnectionConfig {
    const base = {
      host: account.incoming.host,
      port: account.incoming.port,
      tls: account.incoming.secure
    } as ImapConnectionConfig;

    if (account.incoming.authMethod === 'oauth2') {
      // We will read tokens in the route and pass via oauth field when available
      return { ...base, auth: {}, authMethod: 'oauth2' } as ImapConnectionConfig;
    }

    return {
      ...base,
      auth: {
        username: account.incoming.username,
        password: account.incoming.password
      },
      authMethod: 'plain'
    } as ImapConnectionConfig;
  }

  /**
   * Connect to IMAP server
   */
  async connect(config: ImapConnectionConfig): Promise<void> {
    try {
      console.log(`📧 Connecting to IMAP server: ${config.host}:${config.port}`);

      const imapOpts: any = {
        host: config.host,
        port: config.port,
        tls: config.tls
      };
      if (config.authMethod === 'oauth2' && config.oauth?.accessToken && config.oauth.user) {
        imapOpts.auth = { method: 'XOAUTH2', user: config.oauth.user, accessToken: config.oauth.accessToken };
      } else {
        imapOpts.auth = config.auth;
      }

      this.imap = new CFImap(imapOpts);

      await this.imap.connect();
      this.isConnected = true;

      console.log('✅ IMAP connection established');
    } catch (error) {
      console.error('❌ IMAP connection failed:', error);
      this.isConnected = false;
      throw new Error(`Failed to connect to IMAP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Try to connect with common fallbacks (implicit TLS 993, then 143 without TLS)
   */
  async connectAuto(config: ImapConnectionConfig): Promise<void> {
    const attempts: ImapConnectionConfig[] = [];

    // Attempt 1: as provided
    attempts.push({ ...config });

    // If not already 993/TLS, try 993/TLS
    if (!(config.port === 993 && config.tls)) {
      attempts.push({ ...config, port: 993, tls: true });
    }

    // Attempt 2: 143 with TLS (some libraries use this flag to initiate STARTTLS)
    if (!(config.port === 143 && config.tls === true)) {
      attempts.push({ ...config, port: 143, tls: true });
    }

    // Attempt 3: 143 without TLS (plain)
    if (!(config.port === 143 && config.tls === false)) {
      attempts.push({ ...config, port: 143, tls: false });
    }

    const errors: string[] = [];
    for (const attempt of attempts) {
      try {
        const authMode = attempt.authMethod === 'oauth2' && attempt.oauth?.accessToken ? `XOAUTH2(user=${attempt.oauth.user})` : 'PLAIN';
        console.log(`🔁 IMAP connect attempt ${attempt.host}:${attempt.port} tls=${attempt.tls} auth=${authMode}`);
        await this.connect(attempt);
        return; // success
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`⚠️ IMAP connect attempt failed: ${attempt.host}:${attempt.port} tls=${attempt.tls} -> ${msg}`);
        errors.push(`${attempt.port}/${attempt.tls ? 'TLS' : 'noTLS'}: ${msg}`);
        // ensure clean state before next attempt
        await this.disconnect();
      }
    }

    throw new Error(`All IMAP connection attempts failed: ${errors.join(' | ')}`);
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnect(): Promise<void> {
    if (this.imap && this.isConnected) {
      try {
        await this.imap.logout();
        console.log('✅ IMAP disconnected');
      } catch (error) {
        console.error('❌ IMAP disconnect error:', error);
      } finally {
        this.imap = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Get list of folders from IMAP server
   */
  async getFolders(): Promise<EmailFolder[]> {
    if (!this.imap || !this.isConnected) {
      throw new Error('Not connected to IMAP server');
    }

    try {
      console.log('📧 Fetching IMAP folders...');

      // Get namespaces first (optional but recommended)
      const namespaces = await (this.imap as any).getNamespaces?.();
      console.log('📧 Namespaces:', namespaces);

      // Try several method names to list folders/mailboxes
      let imapFolders = await (this.imap as any).getFolders?.();
      if (!imapFolders) imapFolders = await (this.imap as any).listMailboxes?.();
      if (!imapFolders) imapFolders = await (this.imap as any).listBoxes?.();
      if (!imapFolders) imapFolders = await (this.imap as any).list?.();
      console.log('📧 Raw IMAP folders (any):', imapFolders);

      // If still nothing, assume at least INBOX exists
      if (!imapFolders || (Array.isArray(imapFolders) && imapFolders.length === 0)) {
        console.warn('⚠️ No folders returned by server API, falling back to INBOX-only');
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
          }
        ];
      }

      // Convert IMAP folders to our format
      const folders = this.convertImapFolders((imapFolders || []) as any);

      console.log(`✅ Retrieved ${folders.length} folders from IMAP`);
      return folders;
    } catch (error) {
      console.error('❌ Failed to fetch IMAP folders:', error);
      throw new Error(`Failed to fetch folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async selectAnyMailbox(folderName: string): Promise<any> {
    // Try common method names
    const imapAny = this.imap as any;
    let info = await imapAny.selectFolder?.(folderName);
    if (!info) info = await imapAny.selectMailbox?.(folderName);
    if (!info) info = await imapAny.openBox?.(folderName, true);
    if (!info) info = await imapAny.select?.(folderName);
    // Try status call as last resort
    if (!info) {
      const status = await imapAny.status?.(folderName, ['MESSAGES']);
      if (status && typeof status.messages === 'number') {
        info = { exists: status.messages };
      }
    }
    // Fallback to INBOX
    if (!info && folderName !== 'INBOX') {
      console.warn(`⚠️ select folder ${folderName} failed, retrying INBOX`);
      return this.selectAnyMailbox('INBOX');
    }
    return info;
  }

  /**
   * Select a folder and get messages
   */
  async getMessages(folderName: string, limit: number = 50): Promise<EmailMessage[]> {
    if (!this.imap || !this.isConnected) {
      throw new Error('Not connected to IMAP server');
    }

    try {
      console.log(`📧 Selecting folder: ${folderName}`);
      
      // Select the folder (try multiple methods)
      const folderInfo = await this.selectAnyMailbox(folderName);
      console.log('📧 Folder info:', folderInfo);

      if (folderInfo.exists === 0) {
        console.log('📧 Folder is empty');
        return [];
      }

      // Fetch recent messages (limit to avoid timeout)
      const messageCount = Math.min(limit, folderInfo.exists);
      const seqStart = Math.max(1, folderInfo.exists - messageCount + 1);

      // Prefer sequence range with '*' as end to be robust across servers
      let range = `${seqStart}:*`;
      console.log(`📧 Fetching messages (seq) ${range} from ${folderName}`);

      // Fetch message headers and basic info
      let messages = await (this.imap as any).fetchMessages?.(range, {
        envelope: true,
        flags: true,
        uid: true,
        bodyStructure: true,
        size: true
      });

      // Fallback: try full range if empty
      if (!messages || messages.length === 0) {
        range = '1:*';
        console.log(`📧 Primary fetch returned 0 — fallback to full range ${range}`);
        messages = await (this.imap as any).fetchMessages?.(range, {
          envelope: true,
          flags: true,
          uid: true,
          bodyStructure: true,
          size: true
        });
      }

      const count = Array.isArray(messages) ? messages.length : 0;
      console.log(`✅ Retrieved ${count} messages from ${folderName}`);

      // Convert IMAP messages to our format (take last N if we fetched too many)
      const msgs = (messages || []) as any[];
      const slice = count > limit ? msgs.slice(-limit) : msgs;
      return this.convertImapMessages(slice as any, folderName);
    } catch (error) {
      console.error(`❌ Failed to fetch messages from ${folderName}:`, error);
      throw new Error(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert IMAP folders to our EmailFolder format
   */
  private convertImapFolders(imapFolders: ImapFolder[]): EmailFolder[] {
    return imapFolders.map((folder, index) => {
      const folderType = this.determineFolderType(folder.name);
      
      return {
        id: folder.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || `folder_${index}`,
        name: folder.name,
        displayName: this.getFolderDisplayName(folder.name),
        type: folderType,
        children: folder.children ? this.convertImapFolders(folder.children) : [],
        unreadCount: 0, // Will be updated when we fetch messages
        totalCount: 0,  // Will be updated when we fetch messages
        canSelect: !folder.flags.includes('\\Noselect'),
        canCreate: !folder.flags.includes('\\Noinferiors'),
        canDelete: !folder.flags.includes('\\Marked'),
        canRename: !folder.flags.includes('\\Marked')
      };
    });
  }

  /**
   * Convert IMAP messages to our EmailMessage format
   */
  private convertImapMessages(imapMessages: ImapMessage[], folderId: string): EmailMessage[] {
    return imapMessages.map((msg) => {
      const from = msg.envelope.from?.[0];
      const to = msg.envelope.to || [];
      const cc = msg.envelope.cc || [];
      const bcc = msg.envelope.bcc || [];

      return {
        id: `${folderId}_${msg.uid}`,
        messageId: msg.envelope.messageId,
        subject: msg.envelope.subject || '(No Subject)',
        from: from ? {
          name: from.name || '',
          email: `${from.mailbox}@${from.host}`
        } : { name: '', email: '' },
        to: to.map(addr => ({
          name: addr.name || '',
          email: `${addr.mailbox}@${addr.host}`
        })),
        cc: cc.map(addr => ({
          name: addr.name || '',
          email: `${addr.mailbox}@${addr.host}`
        })),
        bcc: bcc.map(addr => ({
          name: addr.name || '',
          email: `${addr.mailbox}@${addr.host}`
        })),
        date: new Date(msg.envelope.date),
        receivedDate: new Date(msg.envelope.date),
        body: {
          text: '', // Will be fetched separately when needed
          html: ''  // Will be fetched separately when needed
        },
        attachments: [], // Will be parsed from bodyStructure when needed
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
        isImportant: false, // Gmail-specific, would need special handling
        labels: [] // Gmail-specific, would need special handling
      };
    });
  }

  /**
   * Determine folder type from folder name
   */
  private determineFolderType(folderName: string): EmailFolder['type'] {
    const name = folderName.toLowerCase();
    
    if (name === 'inbox' || name === 'inbox') return 'inbox';
    if (name.includes('sent') || name.includes('sent items')) return 'sent';
    if (name.includes('draft')) return 'drafts';
    if (name.includes('spam') || name.includes('junk')) return 'spam';
    if (name.includes('trash') || name.includes('deleted')) return 'trash';
    if (name.includes('archive')) return 'archive';
    
    return 'custom';
  }

  /**
   * Get display name for folder
   */
  private getFolderDisplayName(folderName: string): string {
    // Handle common folder names
    const name = folderName.toLowerCase();
    
    if (name === 'inbox') return 'Inbox';
    if (name.includes('sent')) return 'Sent';
    if (name.includes('draft')) return 'Drafts';
    if (name.includes('spam') || name.includes('junk')) return 'Spam';
    if (name.includes('trash') || name.includes('deleted')) return 'Trash';
    if (name.includes('archive')) return 'Archive';
    
    // Return original name with proper capitalization
    return folderName.split('/').pop() || folderName;
  }
}
