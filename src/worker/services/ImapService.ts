import { CFImap } from 'cf-imap';
import { EmailAccount, EmailFolder, EmailMessage } from '../../types/emailClient';

export interface ImapConnectionConfig {
  host: string;
  port: number;
  tls: boolean;
  auth: {
    username: string;
    password: string;
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
    return {
      host: account.incoming.host,
      port: account.incoming.port,
      tls: account.incoming.secure,
      auth: {
        username: account.incoming.username,
        password: account.incoming.password
      }
    };
  }

  /**
   * Connect to IMAP server
   */
  async connect(config: ImapConnectionConfig): Promise<void> {
    try {
      console.log(`📧 Connecting to IMAP server: ${config.host}:${config.port}`);
      
      this.imap = new CFImap({
        host: config.host,
        port: config.port,
        tls: config.tls,
        auth: config.auth
      });

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
      const namespaces = await this.imap.getNamespaces();
      console.log('📧 Namespaces:', namespaces);

      // Get folder list
      const imapFolders = await this.imap.getFolders();
      console.log('📧 Raw IMAP folders:', imapFolders);

      // Convert IMAP folders to our format
      const folders = this.convertImapFolders(imapFolders);
      
      console.log(`✅ Retrieved ${folders.length} folders from IMAP`);
      return folders;
    } catch (error) {
      console.error('❌ Failed to fetch IMAP folders:', error);
      throw new Error(`Failed to fetch folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      
      // Select the folder
      const folderInfo = await this.imap.selectFolder(folderName);
      console.log('📧 Folder info:', folderInfo);

      if (folderInfo.exists === 0) {
        console.log('📧 Folder is empty');
        return [];
      }

      // Fetch recent messages (limit to avoid timeout)
      const messageCount = Math.min(limit, folderInfo.exists);
      const startUid = Math.max(1, folderInfo.exists - messageCount + 1);
      const endUid = folderInfo.exists;

      console.log(`📧 Fetching messages ${startUid}:${endUid} from ${folderName}`);

      // Fetch message headers and basic info
      const messages = await this.imap.fetchMessages(`${startUid}:${endUid}`, {
        envelope: true,
        flags: true,
        uid: true,
        bodyStructure: true,
        size: true
      });

      console.log(`✅ Retrieved ${messages.length} messages from ${folderName}`);

      // Convert IMAP messages to our format
      return this.convertImapMessages(messages, folderName);
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
