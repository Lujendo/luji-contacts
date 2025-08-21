import { Hono } from 'hono';
import { EmailService } from '../../services/EmailService';
import { emailQueueService } from '../../services/EmailQueueService';
import { EmailData, SendEmailOptions, BulkEmailOptions } from '../../types/email';
import { DatabaseService } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';
import { ImapService } from '../services/ImapService';

export function createEmailRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono();

  // Apply authentication middleware to all routes
  app.use('*', createAuthMiddleware(auth, db));

  // Helper function to authenticate user from context
  async function authenticateUser(c: any) {
    try {
      return getAuthenticatedUser(c);
    } catch (error) {
      return null;
    }
  }

// Initialize email service
const emailService = new EmailService();

/**
 * Send email to specific contacts
 * POST /api/emails/send
 */
app.post('/send', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      to, 
      cc, 
      bcc, 
      subject, 
      html, 
      text, 
      contactIds, 
      groupIds,
      templateId,
      templateVariables,
      options = {}
    } = body;

    // Validate required fields
    if (!subject || (!html && !text)) {
      return c.json({ error: 'Subject and content (HTML or text) are required' }, 400);
    }

    // Build recipient list
    let recipients: string[] = to || [];

    // Add contacts from contactIds
    if (contactIds && contactIds.length > 0) {
      const db = c.env.DB;
      const contactEmails = await db.prepare(`
        SELECT email FROM contacts 
        WHERE id IN (${contactIds.map(() => '?').join(',')}) 
        AND user_id = ? 
        AND email IS NOT NULL
      `).bind(...contactIds, user.id).all();
      
      recipients.push(...contactEmails.results.map((row: any) => row.email));
    }

    // Add contacts from groupIds
    if (groupIds && groupIds.length > 0) {
      const db = c.env.DB;
      const groupContactEmails = await db.prepare(`
        SELECT DISTINCT c.email 
        FROM contacts c
        JOIN contact_groups cg ON c.id = cg.contact_id
        WHERE cg.group_id IN (${groupIds.map(() => '?').join(',')})
        AND c.user_id = ?
        AND c.email IS NOT NULL
      `).bind(...groupIds, user.id).all();
      
      recipients.push(...groupContactEmails.results.map((row: any) => row.email));
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      return c.json({ error: 'No valid email recipients found' }, 400);
    }

    // Build email data
    const emailData: EmailData = {
      to: recipients,
      cc,
      bcc,
      from: user.email || 'noreply@example.com',
      fromName: user.username || 'Contact Manager',
      subject,
      html,
      text,
      templateId,
      templateVariables,
      trackOpens: options.trackOpens,
      trackClicks: options.trackClicks,
      tags: options.tags,
      metadata: {
        userId: user.id,
        contactIds,
        groupIds,
        sentAt: new Date().toISOString()
      }
    };

    // Send email via queue
    const queueId = await emailService.sendEmail(emailData, user.id, options);

    // Log email in database
    await c.env.DB.prepare(`
      INSERT INTO emails (id, user_id, subject, body, recipients_count, queue_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      user.id,
      subject,
      html || text,
      recipients.length,
      queueId,
      new Date().toISOString()
    ).run();

    return c.json({
      success: true,
      queueId,
      recipientCount: recipients.length,
      message: 'Email queued for sending'
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return c.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Send bulk emails
 * POST /api/emails/bulk
 */
app.post('/bulk', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { emails, options = {} } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return c.json({ error: 'Emails array is required' }, 400);
    }

    // Validate and prepare emails
    const emailsToSend = emails.map((email: any) => ({
      emailData: {
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        from: user.email || 'noreply@example.com',
        fromName: user.username || 'Contact Manager',
        subject: email.subject,
        html: email.html,
        text: email.text,
        trackOpens: options.trackOpens,
        trackClicks: options.trackClicks,
        tags: options.tags,
        metadata: {
          userId: user.id,
          bulkSend: true,
          sentAt: new Date().toISOString()
        }
      } as EmailData,
      userId: user.id
    }));

    // Send bulk emails
    const queueIds = await emailService.sendBulkEmails(emailsToSend, options);

    return c.json({
      success: true,
      queueIds,
      emailCount: queueIds.length,
      message: 'Bulk emails queued for sending'
    });

  } catch (error) {
    console.error('❌ Bulk email sending error:', error);
    return c.json({ 
      error: 'Failed to send bulk emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get email queue status
 * GET /api/emails/queue/:id
 */
app.get('/queue/:id', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const queueId = c.req.param('id');
    const queueItem = emailQueueService.getQueueItem(queueId);

    if (!queueItem || queueItem.userId !== user.id) {
      return c.json({ error: 'Queue item not found' }, 404);
    }

    return c.json({
      id: queueItem.id,
      status: queueItem.status,
      priority: queueItem.priority,
      scheduledAt: queueItem.scheduledAt,
      sentAt: queueItem.sentAt,
      retryCount: queueItem.retryCount,
      maxRetries: queueItem.maxRetries,
      errorMessage: queueItem.errorMessage,
      createdAt: queueItem.createdAt,
      updatedAt: queueItem.updatedAt
    });

  } catch (error) {
    console.error('❌ Queue status error:', error);
    return c.json({ 
      error: 'Failed to get queue status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get email history
 * GET /api/emails/history
 */
app.get('/history', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { page = '1', limit = '50' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const db = c.env.DB;
    const emails = await db.prepare(`
      SELECT id, subject, recipients_count, queue_id, created_at, status
      FROM emails 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, parseInt(limit), offset).all();

    const total = await db.prepare(`
      SELECT COUNT(*) as count FROM emails WHERE user_id = ?
    `).bind(user.id).first();

    return c.json({
      emails: emails.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total?.count || 0,
        pages: Math.ceil((total?.count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Email history error:', error);
    return c.json({ 
      error: 'Failed to get email history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get email analytics
 * GET /api/emails/analytics
 */
app.get('/analytics', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { period = '30d' } = c.req.query();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const db = c.env.DB;
    
    // Get basic email statistics
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        SUM(recipients_count) as total_recipients,
        AVG(recipients_count) as avg_recipients
      FROM emails 
      WHERE user_id = ? AND created_at >= ?
    `).bind(user.id, startDate.toISOString()).first();

    // Get queue statistics
    const queueStats = emailQueueService.getQueueStatistics();

    // Get provider status
    const providerStatus = await emailService.getProvidersStatus();

    return c.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      statistics: {
        totalSent: stats?.total_sent || 0,
        totalRecipients: stats?.total_recipients || 0,
        averageRecipients: stats?.avg_recipients || 0,
        queue: queueStats,
        providers: providerStatus
      }
    });

  } catch (error) {
    console.error('❌ Email analytics error:', error);
    return c.json({ 
      error: 'Failed to get email analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Cancel queued email
 * DELETE /api/emails/queue/:id
 */
app.delete('/queue/:id', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const queueId = c.req.param('id');
    const queueItem = emailQueueService.getQueueItem(queueId);

    if (!queueItem || queueItem.userId !== user.id) {
      return c.json({ error: 'Queue item not found' }, 404);
    }

    const cancelled = emailQueueService.cancelEmail(queueId);

    if (cancelled) {
      return c.json({ success: true, message: 'Email cancelled' });
    } else {
      return c.json({ error: 'Email cannot be cancelled (already processing or sent)' }, 400);
    }

  } catch (error) {
    console.error('❌ Email cancellation error:', error);
    return c.json({ 
      error: 'Failed to cancel email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get folders for an email account
app.get('/folders/:accountId', async (c) => {
  const imapService = new ImapService();

  try {
    const user = getAuthenticatedUser(c);
    const accountId = c.req.param('accountId');

    // Verify account belongs to user
    const accountRow = await c.env.DB.prepare(`
      SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, user.id).first();

    if (!accountRow) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Convert database row to EmailAccount object
    const account = {
      id: accountRow.id,
      name: accountRow.name,
      email: accountRow.email,
      provider: accountRow.provider,
      incoming: {
        host: accountRow.incoming_host,
        port: accountRow.incoming_port,
        secure: accountRow.incoming_secure === 1,
        username: accountRow.incoming_username,
        password: accountRow.incoming_password,
        authMethod: accountRow.incoming_auth_method
      },
      outgoing: {
        host: accountRow.outgoing_host,
        port: accountRow.outgoing_port,
        secure: accountRow.outgoing_secure === 1,
        username: accountRow.outgoing_username,
        password: accountRow.outgoing_password,
        authMethod: accountRow.outgoing_auth_method
      },
      folders: [],
      isDefault: accountRow.is_default === 1,
      isActive: accountRow.is_active === 1,
      lastSync: new Date(accountRow.last_sync),
      syncInterval: accountRow.sync_interval
    };

    console.log(`📧 Fetching real folders for account: ${account.email}`);

    // Connect to IMAP server and fetch real folders
    let config = ImapService.createConnectionConfig(account);
    // If OAuth2, try to include access token from DB
    if (account.incoming.authMethod === 'oauth2') {
      // Ensure we have a fresh access token; refresh if expired
      const tokenRow = await c.env.DB.prepare(`
        SELECT incoming_oauth_access_token, incoming_oauth_refresh_token, incoming_oauth_expires_at FROM email_accounts WHERE id = ?
      `).bind(account.id).first();
      if (tokenRow) {
        let { incoming_oauth_access_token: accessToken, incoming_oauth_refresh_token: refreshToken, incoming_oauth_expires_at: expiresAt } = tokenRow as any;
        const isExpired = expiresAt && new Date(expiresAt).getTime() < Date.now() + 60_000;
        if (!accessToken || isExpired) {
          if (refreshToken) {
            const clientId = (c.env as any).GOOGLE_CLIENT_ID as string;
            const clientSecret = (c.env as any).GOOGLE_CLIENT_SECRET as string;
            const body = new URLSearchParams();
            body.set('client_id', clientId);
            body.set('client_secret', clientSecret);
            body.set('refresh_token', refreshToken);
            body.set('grant_type', 'refresh_token');
            const resp = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
            });
            if (resp.ok) {
              const data = await resp.json() as any;
              accessToken = data.access_token;
              const newExpiresAt = new Date(Date.now() + (data.expires_in || 0) * 1000).toISOString();
              await c.env.DB.prepare(`UPDATE email_accounts SET incoming_oauth_access_token = ?, incoming_oauth_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(accessToken, newExpiresAt, account.id).run();
            } else {
              console.warn('Failed to refresh access token');
            }
          }
        }
        if (accessToken) {
          config = { ...config, authMethod: 'oauth2', oauth: { user: account.email, accessToken } } as any;
        }
      }
    }
    await imapService.connectAuto(config);

    const folders = await imapService.getFolders();

    console.log(`✅ Retrieved ${folders.length} real folders from IMAP`);
    return c.json({ folders });

  } catch (error) {
    console.error('❌ Error fetching folders:', error);

    // Return default folders as fallback
    const folders = [
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

    console.log('📧 Returning default folders as fallback');
    return c.json({
      folders,
      warning: 'Using default folders due to connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Always disconnect from IMAP server
    await imapService.disconnect();
  }
});

// Get messages for a folder
app.get('/messages/:accountId/:folderId', async (c) => {
  const imapService = new ImapService();

  try {
    const user = getAuthenticatedUser(c);
    const accountId = c.req.param('accountId');
    const folderId = c.req.param('folderId');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    // Verify account belongs to user
    const accountRow = await c.env.DB.prepare(`
      SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, user.id).first();

    if (!accountRow) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Convert database row to EmailAccount object
    const account = {
      id: accountRow.id,
      name: accountRow.name,
      email: accountRow.email,
      provider: accountRow.provider,
      incoming: {
        host: accountRow.incoming_host,
        port: accountRow.incoming_port,
        secure: accountRow.incoming_secure === 1,
        username: accountRow.incoming_username,
        password: accountRow.incoming_password,
        authMethod: accountRow.incoming_auth_method
      },
      outgoing: {
        host: accountRow.outgoing_host,
        port: accountRow.outgoing_port,
        secure: accountRow.outgoing_secure === 1,
        username: accountRow.outgoing_username,
        password: accountRow.outgoing_password,
        authMethod: accountRow.outgoing_auth_method
      },
      folders: [],
      isDefault: accountRow.is_default === 1,
      isActive: accountRow.is_active === 1,
      lastSync: new Date(accountRow.last_sync),
      syncInterval: accountRow.sync_interval
    };

    console.log(`📧 Fetching real messages for account: ${account.email}, folder: ${folderId}`);

    // Connect to IMAP server and fetch real messages
    let config = ImapService.createConnectionConfig(account);
    if (account.incoming.authMethod === 'oauth2') {
      const tokenRow = await c.env.DB.prepare(`
        SELECT incoming_oauth_access_token, incoming_oauth_refresh_token, incoming_oauth_expires_at FROM email_accounts WHERE id = ?
      `).bind(account.id).first();
      if (tokenRow) {
        let { incoming_oauth_access_token: accessToken, incoming_oauth_refresh_token: refreshToken, incoming_oauth_expires_at: expiresAt } = tokenRow as any;
        const isExpired = expiresAt && new Date(expiresAt).getTime() < Date.now() + 60_000;
        if (!accessToken || isExpired) {
          if (refreshToken) {
            const clientId = (c.env as any).GOOGLE_CLIENT_ID as string;
            const clientSecret = (c.env as any).GOOGLE_CLIENT_SECRET as string;
            const body = new URLSearchParams();
            body.set('client_id', clientId);
            body.set('client_secret', clientSecret);
            body.set('refresh_token', refreshToken);
            body.set('grant_type', 'refresh_token');
            const resp = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
            });
            if (resp.ok) {
              const data = await resp.json() as any;
              accessToken = data.access_token;
              const newExpiresAt = new Date(Date.now() + (data.expires_in || 0) * 1000).toISOString();
              await c.env.DB.prepare(`UPDATE email_accounts SET incoming_oauth_access_token = ?, incoming_oauth_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(accessToken, newExpiresAt, account.id).run();
            } else {
              console.warn('Failed to refresh access token');
            }
          }
        }
        if (accessToken) {
          config = { ...config, authMethod: 'oauth2', oauth: { user: account.email, accessToken } } as any;
        }
      }
    }
    await imapService.connectAuto(config);

    // Prefer explicit folderName query param (allows names like "[Gmail]/All Mail"), fallback to mapping
    const providedFolderName = c.req.query('folderName');
    let folderName = providedFolderName || folderId;
    if (!providedFolderName) {
      if (folderId === 'inbox') folderName = 'INBOX';
      else if (folderId === 'sent') folderName = 'Sent';
      else if (folderId === 'drafts') folderName = 'Drafts';
      else if (folderId === 'spam') folderName = 'Spam';
      else if (folderId === 'trash') folderName = 'Trash';
    }

    const messages = await imapService.getMessages(folderName, limit);

    console.log(`✅ Retrieved ${messages.length} real messages from IMAP`);

    return c.json({
      messages,
      pagination: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);

    // Return empty messages as fallback
    return c.json({
      messages: [],
      pagination: {
        page: parseInt(c.req.query('page') || '1'),
        limit: parseInt(c.req.query('limit') || '50'),
        total: 0,
        totalPages: 0
      },
      warning: 'Using empty messages due to connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Always disconnect from IMAP server
    await imapService.disconnect();
  }
});

// Sync account - fetch latest emails
app.post('/sync/:accountId', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const accountId = c.req.param('accountId');

    // Verify account belongs to user
    const account = await c.env.DB.prepare(`
      SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, user.id).first();

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Update last sync time
    await c.env.DB.prepare(`
      UPDATE email_accounts SET last_sync = ? WHERE id = ?
    `).bind(new Date().toISOString(), accountId).run();

    // For now, just return success since we don't have real IMAP connection
    // In a real implementation, this would connect to the IMAP server and sync emails
    return c.json({
      message: 'Account synced successfully',
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing account:', error);
    return c.json({ error: 'Failed to sync account' }, 500);
  }
});

  return app;
}
