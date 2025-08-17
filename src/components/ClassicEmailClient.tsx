import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Trash2,
  Archive,
  Star,
  Search,
  Settings,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Flag,
  Clock,
  User,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { EmailMessage, EmailFolder, EmailAccount, EmailClientSettings } from '../types/emailClient';
import EmailForm from './EmailForm';

interface ClassicEmailClientProps {
  onClose: () => void;
  preSelectedContacts?: Array<{ id: number; email: string; name?: string }>;
  composeMode?: boolean;
}

const ClassicEmailClient: React.FC<ClassicEmailClientProps> = ({
  onClose,
  preSelectedContacts = [],
  composeMode = false
}) => {
  // State management
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<EmailAccount | null>(null);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(composeMode);
  const [previewPane, setPreviewPane] = useState<'right' | 'bottom' | 'hidden'>('right');

  // Mock data for demonstration
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockAccount: EmailAccount = {
      id: 'account-1',
      name: 'Personal Email',
      email: 'user@example.com',
      provider: 'imap',
      incoming: {
        host: 'imap.example.com',
        port: 993,
        secure: true,
        username: 'user@example.com',
        password: '',
        authMethod: 'plain'
      },
      outgoing: {
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        username: 'user@example.com',
        password: '',
        authMethod: 'plain'
      },
      folders: [
        {
          id: 'inbox',
          name: 'INBOX',
          displayName: 'Inbox',
          type: 'inbox',
          children: [],
          unreadCount: 5,
          totalCount: 25,
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
          totalCount: 12,
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
          unreadCount: 2,
          totalCount: 3,
          canSelect: true,
          canCreate: false,
          canDelete: false,
          canRename: false
        },
        {
          id: 'trash',
          name: 'Trash',
          displayName: 'Trash',
          type: 'trash',
          children: [],
          unreadCount: 0,
          totalCount: 8,
          canSelect: true,
          canCreate: false,
          canDelete: false,
          canRename: false
        }
      ],
      isDefault: true,
      isActive: true,
      lastSync: new Date(),
      syncInterval: 5
    };

    const mockMessages: EmailMessage[] = [
      {
        id: 'msg-1',
        messageId: '<msg1@example.com>',
        subject: 'Welcome to the new email client!',
        from: { name: 'Email Team', email: 'team@example.com' },
        to: [{ name: 'You', email: 'user@example.com' }],
        date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        receivedDate: new Date(Date.now() - 1000 * 60 * 30),
        body: {
          text: 'Welcome to your new professional email client! This is a demonstration of the classic email interface.',
          html: '<p>Welcome to your new <strong>professional email client</strong>! This is a demonstration of the classic email interface.</p>'
        },
        attachments: [],
        flags: { seen: false, answered: false, flagged: true, deleted: false, draft: false, recent: true },
        headers: {},
        size: 1024,
        folder: 'inbox',
        uid: 1,
        isRead: false,
        isStarred: true,
        isImportant: true,
        labels: ['important']
      },
      {
        id: 'msg-2',
        messageId: '<msg2@example.com>',
        subject: 'Project Update - Q4 2024',
        from: { name: 'John Smith', email: 'john@company.com' },
        to: [{ name: 'You', email: 'user@example.com' }],
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
        body: {
          text: 'Here is the latest update on our Q4 project progress. Please review the attached documents.',
          html: '<p>Here is the latest update on our Q4 project progress. Please review the attached documents.</p>'
        },
        attachments: [
          {
            id: 'att-1',
            filename: 'Q4_Report.pdf',
            contentType: 'application/pdf',
            size: 2048576,
            disposition: 'attachment'
          }
        ],
        flags: { seen: true, answered: false, flagged: false, deleted: false, draft: false, recent: false },
        headers: {},
        size: 2048576,
        folder: 'inbox',
        uid: 2,
        isRead: true,
        isStarred: false,
        isImportant: false,
        labels: []
      },
      {
        id: 'msg-3',
        messageId: '<msg3@example.com>',
        subject: 'Meeting Reminder: Team Standup',
        from: { name: 'Calendar', email: 'calendar@company.com' },
        to: [{ name: 'You', email: 'user@example.com' }],
        date: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 4),
        body: {
          text: 'Reminder: Team standup meeting at 2:00 PM today in Conference Room A.',
          html: '<p><strong>Reminder:</strong> Team standup meeting at 2:00 PM today in Conference Room A.</p>'
        },
        attachments: [],
        flags: { seen: false, answered: false, flagged: false, deleted: false, draft: false, recent: true },
        headers: {},
        size: 512,
        folder: 'inbox',
        uid: 3,
        isRead: false,
        isStarred: false,
        isImportant: false,
        labels: ['meeting']
      }
    ];

    setAccounts([mockAccount]);
    setCurrentAccount(mockAccount);
    setCurrentFolder(mockAccount.folders[0]); // Inbox
    setMessages(mockMessages);
  };

  const getFolderIcon = (folder: EmailFolder) => {
    switch (folder.type) {
      case 'inbox':
        return <Inbox className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'drafts':
        return <FileText className="h-4 w-4" />;
      case 'trash':
        return <Trash2 className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleFolderClick = (folder: EmailFolder) => {
    setCurrentFolder(folder);
    setSelectedMessage(null);
    setSelectedMessages([]);
    // In a real implementation, this would fetch messages for the folder
  };

  const handleMessageClick = (message: EmailMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      // Mark as read
      const updatedMessages = messages.map(m =>
        m.id === message.id ? { ...m, isRead: true, flags: { ...m.flags, seen: true } } : m
      );
      setMessages(updatedMessages);
    }
  };

  const handleMessageSelect = (messageId: string, selected: boolean) => {
    if (selected) {
      setSelectedMessages([...selectedMessages, messageId]);
    } else {
      setSelectedMessages(selectedMessages.filter(id => id !== messageId));
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 flex items-center"
              title="Back to Contacts"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              Email Client
            </h1>
            {currentAccount && (
              <span className="text-sm text-gray-500">
                {currentAccount.email}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLoading(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Mailboxes */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Account Selector */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Mailboxes</span>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Folder List */}
          <div className="flex-1 overflow-y-auto">
            {currentAccount?.folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 ${
                  currentFolder?.id === folder.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getFolderIcon(folder)}
                  <span className="text-sm font-medium text-gray-900">
                    {folder.displayName}
                  </span>
                </div>
                {folder.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {folder.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Email Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCompose(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Compose
                </button>
                {selectedMessages.length > 0 && (
                  <>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <Archive className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <Flag className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Message List */}
            <div className={`${previewPane === 'right' ? 'w-1/2' : 'flex-1'} border-r border-gray-200 bg-white`}>
              <div className="h-full overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    } ${!message.isRead ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message.id)}
                        onChange={(e) => handleMessageSelect(message.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${!message.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                              {message.from.name || message.from.email}
                            </span>
                            {message.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                            {message.attachments.length > 0 && <Paperclip className="h-4 w-4 text-gray-400" />}
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate(message.date)}
                          </span>
                        </div>
                        <div className={`text-sm ${!message.isRead ? 'font-medium' : ''} text-gray-900 truncate mt-1`}>
                          {message.subject}
                        </div>
                        <div className="text-sm text-gray-500 truncate mt-1">
                          {message.body.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Preview Pane */}
            {previewPane === 'right' && (
              <div className="w-1/2 bg-white flex flex-col">
                {selectedMessage ? (
                  <>
                    {/* Message Header */}
                    <div className="border-b border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedMessage.subject}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <Reply className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <ReplyAll className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <Forward className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-16">From:</span>
                          <span className="text-gray-900">
                            {selectedMessage.from.name ? 
                              `${selectedMessage.from.name} <${selectedMessage.from.email}>` : 
                              selectedMessage.from.email
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-16">To:</span>
                          <span className="text-gray-900">
                            {selectedMessage.to.map(addr => 
                              addr.name ? `${addr.name} <${addr.email}>` : addr.email
                            ).join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-16">Date:</span>
                          <span className="text-gray-900">
                            {selectedMessage.date.toLocaleString()}
                          </span>
                        </div>
                        {selectedMessage.attachments.length > 0 && (
                          <div className="flex items-start">
                            <span className="font-medium text-gray-700 w-16">Attachments:</span>
                            <div className="space-y-1">
                              {selectedMessage.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2">
                                  <Paperclip className="h-4 w-4 text-gray-400" />
                                  <span className="text-blue-600 hover:underline cursor-pointer">
                                    {attachment.filename}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    ({Math.round(attachment.size / 1024)} KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedMessage.body.html || selectedMessage.body.text?.replace(/\n/g, '<br>') || ''
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select an email to read</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCompose(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Compose Email</h3>
              </div>
              <EmailForm
                onClose={() => setShowCompose(false)}
                selectedContacts={preSelectedContacts.map(contact => ({
                  id: contact.id,
                  first_name: contact.name?.split(' ')[0] || '',
                  last_name: contact.name?.split(' ').slice(1).join(' ') || '',
                  email: contact.email,
                  phone: '',
                  company: '',
                  position: '',
                  notes: '',
                  created_at: new Date(),
                  updated_at: new Date()
                }))}
                contacts={[]}
                groups={[]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassicEmailClient;
