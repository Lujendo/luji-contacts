import React, { useState, useEffect, useCallback } from 'react';
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
import { Contact } from '../types';
import EmailForm from './EmailForm';
import EmailAccountSettings from './EmailAccountSettings';
import EnhancedComposeModal from './EnhancedComposeModal';
import ResizablePane from './ResizablePane';
import { EmailFetchService } from '../services/EmailFetchService';

interface ClassicEmailClientProps {
  onClose: () => void;
  preSelectedContacts?: Contact[];
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
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder | null>(null);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadedAccountId, setLoadedAccountId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showCompose, setShowCompose] = useState(composeMode);
  const [previewPane, setPreviewPane] = useState<'right' | 'bottom' | 'hidden'>('right');
  const [messageListWidth, setMessageListWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadContacts();
    loadEmailAccounts();
  }, []);

  // Load real email data for an account
  const loadEmailData = useCallback(async (account: EmailAccount) => {
    // Prevent multiple simultaneous loads for the same account
    if (isLoading || loadedAccountId === account.id) {
      console.log('📧 Skipping load - already loading or loaded for account:', account.id);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const emailService = EmailFetchService.getInstance();

      // Try Ultimate Email Engine first, then robust service, then fallback to regular service
      console.log('📧 Loading folders for account:', account.name);

      let folders: EmailFolder[] = [];
      try {
        const token = localStorage.getItem('token');

        // First try the Ultimate Email Engine
        console.log('🚀 Trying Ultimate Email Engine...');
        const ultimateResponse = await fetch(`/api/ultimate-email/folders/${account.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (ultimateResponse.ok) {
          const ultimateData = await ultimateResponse.json();
          if (ultimateData.success && ultimateData.folders && ultimateData.folders.length > 0) {
            folders = ultimateData.folders;
            console.log('✅ Ultimate Email Engine returned folders:', folders.length);
          } else {
            console.log('⚠️ Ultimate Email Engine failed, trying robust service');
            folders = await tryRobustEmailService(account);
          }
        } else {
          console.log('⚠️ Ultimate Email Engine unavailable, trying robust service');
          folders = await tryRobustEmailService(account);
        }
      } catch (error) {
        console.log('⚠️ Ultimate Email Engine error, trying robust service:', error);
        folders = await tryRobustEmailService(account);
      }

      console.log('📧 Final folders received:', folders.length, folders);

      // Set default selected folder (inbox)
      const inboxFolder = folders.find(f => f.type === 'inbox') || folders[0];
      if (inboxFolder) {
        setSelectedFolder(inboxFolder);

        // Load messages for the inbox
        console.log('📧 Loading messages for folder:', inboxFolder.displayName);
        const messages = await emailService.fetchMessages(account, inboxFolder.id, 1, 50, inboxFolder.name);
        console.log('📧 Messages received:', messages.length);
        setMessages(messages);

        // Update folder counts and set folders in one operation
        const updatedFolders = folders.map(folder =>
          folder.id === inboxFolder.id
            ? { ...folder, totalCount: messages.length, unreadCount: messages.filter(m => !m.isRead).length }
            : folder
        );
        setFolders(updatedFolders);
      } else {
        // No inbox found, just set the folders
        setFolders(folders);
      }

      console.log('✅ Email data loaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading email data:', errorMessage);
      setLoadError(errorMessage);

      // Fallback to default folders if loading fails
      const emailService = EmailFetchService.getInstance();
      const defaultFolders = (emailService as any).getDefaultFolders();
      setFolders(defaultFolders);
      setSelectedFolder(defaultFolders[0]);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Reset loaded account when current account changes
  useEffect(() => {
    if (currentAccount?.id !== loadedAccountId) {
      setLoadedAccountId(null);
      setLoadError(null);
      setFolders([]);
      setMessages([]);
      setSelectedFolder(null);
    }
  }, [currentAccount?.id, loadedAccountId]);

  // Load real email data when current account changes
  useEffect(() => {
    if (currentAccount && currentAccount.id && loadedAccountId !== currentAccount.id && !isLoading) {
      console.log(`📧 Loading email data for new account: ${currentAccount.id}`);
      setLoadedAccountId(currentAccount.id);
      loadEmailData(currentAccount);
    }
  }, [currentAccount?.id, loadedAccountId, isLoading]); // Remove loadEmailData from dependencies to prevent recreation

  // Load contacts from API
  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setFilteredContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Load email accounts from API
  const loadEmailAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/email-accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        if (data.accounts && data.accounts.length > 0) {
          const defaultAccount = data.accounts.find((acc: EmailAccount) => acc.isDefault) || data.accounts[0];
          setCurrentAccount(defaultAccount);
        }
      }
    } catch (error) {
      console.error('Error loading email accounts:', error);
    }
  };

  // Email account management handlers
  const handleAddAccount = async (accountData: Omit<EmailAccount, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(prev => [...prev, data.account]);
        if (accounts.length === 0) {
          setCurrentAccount(data.account);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding email account:', error);
      throw error;
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<EmailAccount>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/email-accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setAccounts(prev => prev.map(acc =>
          acc.id === id ? { ...acc, ...updates } : acc
        ));
        if (currentAccount?.id === id) {
          setCurrentAccount(prev => prev ? { ...prev, ...updates } : null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating email account:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/email-accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        if (currentAccount?.id === id) {
          const remainingAccounts = accounts.filter(acc => acc.id !== id);
          setCurrentAccount(remainingAccounts.length > 0 ? remainingAccounts[0] : null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting email account:', error);
      throw error;
    }
  };

  const handleTestConnection = async (account: Partial<EmailAccount>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/email-accounts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(account)
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error testing email connection:', error);
      return false;
    }
  };



  const getFolderIcon = (folder: EmailFolder) => {
    switch (folder.type) {
      case 'inbox':
        return <Inbox className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'drafts':
        return <FileText className="h-4 w-4" />;
      case 'spam':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      case 'trash':
        return <Trash2 className="h-4 w-4" />;
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

  // Helper method for robust email service fallback
  const tryRobustEmailService = async (account: EmailAccount): Promise<EmailFolder[]> => {
    try {
      const token = localStorage.getItem('token');
      const robustResponse = await fetch(`/api/robust-emails/robust-folders/${account.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (robustResponse.ok) {
        const robustData = await robustResponse.json();
        if (robustData.success && robustData.folders && robustData.folders.length > 0) {
          console.log('✅ Robust email service returned folders:', robustData.folders.length);
          return robustData.folders;
        }
      }
    } catch (error) {
      console.log('⚠️ Robust email service error:', error);
    }

    // Final fallback to regular service
    console.log('⚠️ Using regular email service as final fallback');
    const emailService = EmailFetchService.getInstance();
    return await emailService.fetchFolders(account);
  };

  const handleFolderClick = async (folder: EmailFolder) => {
    if (!currentAccount) return;

    setCurrentFolder(folder);
    setSelectedMessage(null);
    setSelectedMessages([]);
    setIsLoading(true);

    try {
      const emailService = EmailFetchService.getInstance();
      console.log('📧 Loading messages for folder:', folder.displayName, 'Account:', currentAccount.email);
      const messages = await emailService.fetchMessages(currentAccount, folder.id, 1, 50, folder.name);
      console.log('📧 Raw messages received:', messages.length, messages);
      setMessages(messages);

      // Update folder counts
      const updatedFolders = folders.map(f =>
        f.id === folder.id
          ? { ...f, totalCount: messages.length, unreadCount: messages.filter(m => !m.isRead).length }
          : f
      );
      setFolders(updatedFolders);

      console.log(`✅ Loaded ${messages.length} messages for ${folder.displayName} in account ${currentAccount.email}`);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
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

            {/* Multi-Account Selector */}
            {accounts.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Account:</span>
                <select
                  value={currentAccount?.id || ''}
                  onChange={(e) => {
                    const selectedAccount = accounts.find(acc => acc.id === e.target.value);
                    if (selectedAccount) {
                      setCurrentAccount(selectedAccount);
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Single Account Display */}
            {accounts.length === 1 && currentAccount && (
              <span className="text-sm text-gray-500">
                {currentAccount.email}
              </span>
            )}

            {/* No Accounts */}
            {accounts.length === 0 && (
              <span className="text-sm text-red-500">
                No email accounts configured
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
              onClick={() => setShowAccountSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Account Settings"
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
            {!currentAccount ? (
              <div className="p-4 text-center text-gray-500">
                <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No email account selected</p>
                <p className="text-xs mt-1">Add an email account to get started</p>
              </div>
            ) : isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-gray-400 animate-spin" />
                <p className="text-sm">Loading folders...</p>
              </div>
            ) : folders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No folders found</p>
                <p className="text-xs mt-1">Check your account settings</p>
              </div>
            ) : (
              folders.map((folder) => (
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
              ))
            )}
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
                {/* Connection warning banner */}
                {!isLoading && (loadError || EmailFetchService.getInstance().getLastWarning()) && (
                  <div className="ml-4 px-3 py-1 text-xs rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                    {loadError || EmailFetchService.getInstance().getLastWarning()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Content Area */}
          <div className="flex-1 overflow-hidden">
            <ResizablePane
              initialLeftWidth={messageListWidth}
              onResize={setMessageListWidth}
              leftPane={
                <div className="h-full bg-white">
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
              }
              rightPane={
                <div className="h-full bg-white flex flex-col">
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
              }
            />
          </div>
        </div>
      </div>

      {/* Enhanced Compose Modal */}
      <EnhancedComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        contacts={contacts}
        preSelectedContacts={preSelectedContacts}
      />

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAccountSettings(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Email Account Settings</h3>
              </div>
              <div className="p-6">
                <EmailAccountSettings
                  accounts={accounts}
                  onAddAccount={handleAddAccount}
                  onUpdateAccount={handleUpdateAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onTestConnection={handleTestConnection}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowAccountSettings(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassicEmailClient;
