import { EmailAccount, EmailFolder, EmailMessage } from '../types/emailClient';

export class EmailFetchService {
  private static instance: EmailFetchService;

  static getInstance(): EmailFetchService {
    if (!EmailFetchService.instance) {
      EmailFetchService.instance = new EmailFetchService();
    }
    return EmailFetchService.instance;
  }

  /**
   * Fetch folders for an email account
   */
  async fetchFolders(account: EmailAccount): Promise<EmailFolder[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/folders/${account.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📧 API Response:', data);

        if (data.warning) {
          console.log('⚠️ API Warning:', data.warning);
          console.log('❌ API Error:', data.error);
        }

        const folders = data.folders || [];
        console.log('📧 Folders from API:', folders.length, folders);

        if (folders.length === 0) {
          console.log('📧 No folders received, using defaults');
          return this.getDefaultFolders();
        }

        return folders;
      } else {
        console.error('Failed to fetch folders:', await response.text());
        return this.getDefaultFolders();
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      return this.getDefaultFolders();
    }
  }

  /**
   * Fetch messages for a specific folder
   */
  async fetchMessages(account: EmailAccount, folderId: string, page: number = 1, limit: number = 50): Promise<EmailMessage[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/messages/${account.id}/${folderId}?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      } else {
        console.error('Failed to fetch messages:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Sync account - fetch latest emails
   */
  async syncAccount(account: EmailAccount): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/sync/${account.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: data.message || 'Sync completed' };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Sync failed' };
      }
    } catch (error) {
      console.error('Error syncing account:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Sync failed' };
    }
  }

  /**
   * Get default folders when real folders can't be fetched
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
      },
      {
        id: 'spam',
        name: 'Spam',
        displayName: 'Spam',
        type: 'spam',
        children: [],
        unreadCount: 0,
        totalCount: 0,
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
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      }
    ];
  }

  /**
   * Mark message as read/unread
   */
  async markMessageRead(account: EmailAccount, messageId: string, isRead: boolean): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/messages/${account.id}/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead })
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(account: EmailAccount, messageId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/messages/${account.id}/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Move message to folder
   */
  async moveMessage(account: EmailAccount, messageId: string, targetFolderId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/emails/messages/${account.id}/${messageId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetFolderId })
      });

      return response.ok;
    } catch (error) {
      console.error('Error moving message:', error);
      return false;
    }
  }
}
