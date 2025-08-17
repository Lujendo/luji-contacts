// Classic Email Client Types

export interface EmailMessage {
  id: string;
  messageId: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  date: Date;
  receivedDate: Date;
  body: {
    text?: string;
    html?: string;
  };
  attachments: EmailAttachment[];
  flags: EmailFlags;
  headers: Record<string, string>;
  size: number;
  folder: string;
  uid: number;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  disposition: 'attachment' | 'inline';
  content?: string | ArrayBuffer;
}

export interface EmailFlags {
  seen: boolean;
  answered: boolean;
  flagged: boolean;
  deleted: boolean;
  draft: boolean;
  recent: boolean;
}

export interface EmailFolder {
  id: string;
  name: string;
  displayName: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  parent?: string;
  children: EmailFolder[];
  unreadCount: number;
  totalCount: number;
  canSelect: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canRename: boolean;
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'imap' | 'pop3' | 'exchange' | 'gmail' | 'outlook';
  incoming: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    authMethod: 'plain' | 'oauth2';
  };
  outgoing: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    authMethod: 'plain' | 'oauth2';
  };
  folders: EmailFolder[];
  isDefault: boolean;
  isActive: boolean;
  lastSync: Date;
  syncInterval: number; // minutes
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  messageCount: number;
  unreadCount: number;
  lastMessage: EmailMessage;
  messages: EmailMessage[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
  folder: string;
}

export interface EmailDraft {
  id: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments: EmailAttachment[];
  inReplyTo?: string;
  references?: string[];
  createdAt: Date;
  updatedAt: Date;
  autoSave: boolean;
}

export interface EmailFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  actions: FilterAction[];
  isActive: boolean;
  order: number;
}

export interface FilterCondition {
  field: 'from' | 'to' | 'cc' | 'subject' | 'body' | 'attachment' | 'size' | 'date';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'greaterThan' | 'lessThan';
  value: string | number;
  caseSensitive: boolean;
}

export interface FilterAction {
  type: 'move' | 'copy' | 'delete' | 'markRead' | 'markStarred' | 'addLabel' | 'forward' | 'reply';
  value?: string;
}

export interface EmailSearchQuery {
  query: string;
  folder?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  labels?: string[];
}

export interface EmailSearchResult {
  messages: EmailMessage[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

export interface EmailSyncStatus {
  accountId: string;
  isSync: boolean;
  lastSync: Date;
  progress: {
    current: number;
    total: number;
    folder: string;
  };
  error?: string;
}

export interface EmailNotification {
  id: string;
  type: 'newEmail' | 'syncComplete' | 'syncError' | 'accountError';
  title: string;
  message: string;
  accountId?: string;
  messageId?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface EmailClientSettings {
  defaultAccount?: string;
  previewPane: 'right' | 'bottom' | 'hidden';
  messageListDensity: 'compact' | 'normal' | 'comfortable';
  autoMarkRead: boolean;
  autoMarkReadDelay: number; // seconds
  showImages: 'always' | 'never' | 'ask';
  enableNotifications: boolean;
  playSound: boolean;
  checkInterval: number; // minutes
  maxAttachmentSize: number; // MB
  defaultSignature?: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

export interface EmailClientState {
  accounts: EmailAccount[];
  currentAccount?: EmailAccount;
  currentFolder?: EmailFolder;
  selectedMessages: string[];
  currentMessage?: EmailMessage;
  currentThread?: EmailThread;
  searchQuery?: EmailSearchQuery;
  searchResults?: EmailSearchResult;
  syncStatus: Record<string, EmailSyncStatus>;
  notifications: EmailNotification[];
  settings: EmailClientSettings;
  isLoading: boolean;
  error?: string;
}

// Email Client Actions
export type EmailClientAction =
  | { type: 'SET_ACCOUNTS'; payload: EmailAccount[] }
  | { type: 'SET_CURRENT_ACCOUNT'; payload: EmailAccount }
  | { type: 'SET_CURRENT_FOLDER'; payload: EmailFolder }
  | { type: 'SET_MESSAGES'; payload: EmailMessage[] }
  | { type: 'SET_CURRENT_MESSAGE'; payload: EmailMessage }
  | { type: 'SET_SELECTED_MESSAGES'; payload: string[] }
  | { type: 'ADD_MESSAGE'; payload: EmailMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<EmailMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'MARK_READ'; payload: { messageIds: string[]; isRead: boolean } }
  | { type: 'MARK_STARRED'; payload: { messageIds: string[]; isStarred: boolean } }
  | { type: 'MOVE_MESSAGES'; payload: { messageIds: string[]; targetFolder: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: EmailSearchQuery }
  | { type: 'SET_SEARCH_RESULTS'; payload: EmailSearchResult }
  | { type: 'SET_SYNC_STATUS'; payload: { accountId: string; status: EmailSyncStatus } }
  | { type: 'ADD_NOTIFICATION'; payload: EmailNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<EmailClientSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined };

// Email Operations
export interface EmailOperations {
  // Account management
  addAccount: (account: Omit<EmailAccount, 'id'>) => Promise<EmailAccount>;
  updateAccount: (id: string, updates: Partial<EmailAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  testConnection: (account: Partial<EmailAccount>) => Promise<boolean>;

  // Folder operations
  getFolders: (accountId: string) => Promise<EmailFolder[]>;
  createFolder: (accountId: string, name: string, parent?: string) => Promise<EmailFolder>;
  renameFolder: (accountId: string, folderId: string, newName: string) => Promise<void>;
  deleteFolder: (accountId: string, folderId: string) => Promise<void>;

  // Message operations
  getMessages: (accountId: string, folderId: string, page?: number, limit?: number) => Promise<EmailMessage[]>;
  getMessage: (accountId: string, messageId: string) => Promise<EmailMessage>;
  sendMessage: (accountId: string, message: EmailDraft) => Promise<void>;
  replyMessage: (accountId: string, messageId: string, reply: EmailDraft) => Promise<void>;
  forwardMessage: (accountId: string, messageId: string, forward: EmailDraft) => Promise<void>;
  deleteMessages: (accountId: string, messageIds: string[]) => Promise<void>;
  moveMessages: (accountId: string, messageIds: string[], targetFolder: string) => Promise<void>;
  markMessages: (accountId: string, messageIds: string[], flags: Partial<EmailFlags>) => Promise<void>;

  // Search operations
  searchMessages: (accountId: string, query: EmailSearchQuery) => Promise<EmailSearchResult>;

  // Sync operations
  syncAccount: (accountId: string) => Promise<void>;
  syncFolder: (accountId: string, folderId: string) => Promise<void>;

  // Draft operations
  saveDraft: (accountId: string, draft: EmailDraft) => Promise<EmailDraft>;
  getDrafts: (accountId: string) => Promise<EmailDraft[]>;
  deleteDraft: (accountId: string, draftId: string) => Promise<void>;
}
