import { Hono } from 'hono';
import { UltimateEmailManager } from '../email-engine/core/UltimateEmailManager';
import { DatabaseService } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';
import { ImapService } from '../services/ImapService';

/**
 * Create Ultimate Email Engine routes with proper dependencies
 */
export function createEmailEngineRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono();

  // Add authentication middleware
  app.use('*', createAuthMiddleware(auth, db));

  // Initialize Ultimate Email Manager
  const emailManager = new UltimateEmailManager({
    maxConnections: 100,
    connectionTimeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
    cacheTTL: 300000,
    performanceMonitoring: true
  });

  /**
   * Get Ultimate Email Engine status and performance metrics
   */
  app.get('/status', async (c) => {
    try {
      const user = getAuthenticatedUser(c);

      console.log('📊 Getting Ultimate Email Engine status...');

      const performanceMetrics = emailManager.getPerformanceMetrics();
      const accountStatuses = emailManager.getAllAccountStatuses();

      return c.json({
        success: true,
        message: 'Ultimate Email Engine status retrieved',
        engine: {
          name: 'Ultimate Email Engine',
          version: '1.0.0',
          status: 'operational'
        },
        performance: performanceMetrics,
        accounts: accountStatuses,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Email Engine status error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get Email Engine status'
      }, 500);
    }
  });

  /**
   * Auto-configure email account using Ultimate Email Engine
   */
  app.post('/auto-configure', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ error: 'Email and password required' }, 400);
      }

      console.log(`🔍 Auto-configuring account with Ultimate Email Engine: ${email}`);

      const result = await emailManager.autoConfigureAccount(email, password);

      if (result.success) {
        console.log(`✅ Auto-configuration successful for ${email}`);
        return c.json({
          success: true,
          message: 'Email account auto-configured successfully',
          configurations: result.configurations,
          recommendedConfig: result.recommendedConfig
        });
      } else {
        console.log(`❌ Auto-configuration failed for ${email}: ${result.error}`);
        return c.json({
          success: false,
          error: result.error,
          configurations: result.configurations,
          message: 'Auto-configuration failed'
        }, 400);
      }

    } catch (error) {
      console.error('❌ Auto-configuration error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Auto-configuration failed'
      }, 500);
    }
  });

  /**
   * Connect account using Ultimate Email Engine
   */
  app.post('/connect-account/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Get account from database
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

      console.log(`🔌 Connecting account with Ultimate Email Engine: ${account.email}`);

      const result = await emailManager.connectAccount(account);

      if (result.success) {
        console.log(`✅ Account connected successfully: ${account.email}`);
        return c.json({
          success: true,
          message: 'Account connected successfully',
          connectionId: result.connectionId
        });
      } else {
        console.log(`❌ Account connection failed: ${result.error}`);
        return c.json({
          success: false,
          error: result.error,
          message: 'Failed to connect account'
        }, 400);
      }

    } catch (error) {
      console.error('❌ Account connection error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Account connection failed'
      }, 500);
    }
  });

  /**
   * Get account status from EmailEngine
   */
  app.get('/account-status/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Verify account belongs to user
      const accountRow = await c.env.DB.prepare(`
        SELECT id FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      const emailEngine = new EmailEngineService(emailEngineConfig);
      const result = await emailEngine.getAccountStatus(accountId);

      if (result.success) {
        return c.json({
          success: true,
          account: result.account,
          message: 'Account status retrieved successfully'
        });
      } else {
        return c.json({
          success: false,
          error: result.error,
          message: 'Failed to get account status'
        }, 400);
      }

    } catch (error) {
      console.error('❌ EmailEngine account status error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Account status check failed'
      }, 500);
    }
  });

  /**
   * Get folders using EmailEngine
   */
  app.get('/folders/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Verify account belongs to user
      const accountRow = await c.env.DB.prepare(`
        SELECT id FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      console.log(`📁 Fetching folders with Ultimate Email Engine for account: ${accountId}`);

      // Get account details from database for folders
      const foldersAccountRow = await c.env.DB.prepare(`
        SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!foldersAccountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      // Convert database row to EmailAccount object
      const account = {
        id: foldersAccountRow.id,
        name: foldersAccountRow.name,
        email: foldersAccountRow.email,
        provider: foldersAccountRow.provider,
        incoming: {
          host: foldersAccountRow.incoming_host,
          port: foldersAccountRow.incoming_port,
          secure: foldersAccountRow.incoming_secure === 1,
          username: foldersAccountRow.incoming_username,
          password: foldersAccountRow.incoming_password,
          authMethod: foldersAccountRow.incoming_auth_method
        },
        outgoing: {
          host: foldersAccountRow.outgoing_host,
          port: foldersAccountRow.outgoing_port,
          secure: foldersAccountRow.outgoing_secure === 1,
          username: foldersAccountRow.outgoing_username,
          password: foldersAccountRow.outgoing_password,
          authMethod: foldersAccountRow.outgoing_auth_method
        },
        folders: [],
        isDefault: foldersAccountRow.is_default === 1,
        isActive: foldersAccountRow.is_active === 1,
        lastSync: new Date(foldersAccountRow.last_sync),
        syncInterval: foldersAccountRow.sync_interval
      };

      try {
        // Use real IMAP service to fetch folders
        const imapService = new ImapService();
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

        console.log(`🔌 Connecting to IMAP server: ${config.host}:${config.port}`);
        await imapService.connectAuto(config);

        const folders = await imapService.getFolders();
        await imapService.disconnect();

        console.log(`✅ Ultimate Email Engine returned ${folders.length} real folders from IMAP`);

        return c.json({
          success: true,
          folders,
          message: `Retrieved ${folders.length} real folders from Ultimate Email Engine via IMAP`
        });

      } catch (imapError) {
        console.error('❌ IMAP connection failed, using enhanced fallback folders:', imapError);

        // Enhanced fallback folders with realistic data for the account
        const fallbackFolders = [
          {
            id: 'INBOX',
            name: 'INBOX',
            displayName: 'Inbox',
            type: 'inbox' as const,
            children: [],
            unreadCount: 5,
            totalCount: 42,
            canSelect: true,
            canCreate: false,
            canDelete: false,
            canRename: false
          },
          {
            id: 'Sent',
            name: 'Sent',
            displayName: 'Sent',
            type: 'sent' as const,
            children: [],
            unreadCount: 0,
            totalCount: 18,
            canSelect: true,
            canCreate: false,
            canDelete: false,
            canRename: false
          },
          {
            id: 'Drafts',
            name: 'Drafts',
            displayName: 'Drafts',
            type: 'drafts' as const,
            children: [],
            unreadCount: 2,
            totalCount: 3,
            canSelect: true,
            canCreate: false,
            canDelete: false,
            canRename: false
          },
          {
            id: 'Spam',
            name: 'Spam',
            displayName: 'Spam',
            type: 'spam' as const,
            children: [],
            unreadCount: 1,
            totalCount: 7,
            canSelect: true,
            canCreate: false,
            canDelete: false,
            canRename: false
          },
          {
            id: 'Trash',
            name: 'Trash',
            displayName: 'Trash',
            type: 'trash' as const,
            children: [],
            unreadCount: 0,
            totalCount: 12,
            canSelect: true,
            canCreate: false,
            canDelete: false,
            canRename: false
          }
        ];

        return c.json({
          success: true,
          folders: fallbackFolders,
          message: `Retrieved ${fallbackFolders.length} enhanced fallback folders (IMAP authentication failed)`,
          warning: `IMAP authentication failed - using demo data. Error: ${imapError instanceof Error ? imapError.message : 'Unknown error'}`,
          isDemo: true
        });
      }

    } catch (error) {
      console.error('❌ Ultimate Email Engine folders error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch folders from Ultimate Email Engine'
      }, 500);
    }
  });

  /**
   * Get messages using EmailEngine
   */
  app.get('/messages/:accountId/:folderId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');
      const folderId = c.req.param('folderId');
      const limit = parseInt(c.req.query('limit') || '50');

      // Verify account belongs to user
      const accountRow = await c.env.DB.prepare(`
        SELECT id FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      console.log(`📧 Fetching messages with Ultimate Email Engine: ${accountId}/${folderId}`);

      // Get account details from database for messages
      const messagesAccountRow = await c.env.DB.prepare(`
        SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!messagesAccountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      // Convert database row to EmailAccount object
      const messageAccount = {
        id: messagesAccountRow.id,
        name: messagesAccountRow.name,
        email: messagesAccountRow.email,
        provider: messagesAccountRow.provider,
        incoming: {
          host: messagesAccountRow.incoming_host,
          port: messagesAccountRow.incoming_port,
          secure: messagesAccountRow.incoming_secure === 1,
          username: messagesAccountRow.incoming_username,
          password: messagesAccountRow.incoming_password,
          authMethod: messagesAccountRow.incoming_auth_method
        },
        outgoing: {
          host: messagesAccountRow.outgoing_host,
          port: messagesAccountRow.outgoing_port,
          secure: messagesAccountRow.outgoing_secure === 1,
          username: messagesAccountRow.outgoing_username,
          password: messagesAccountRow.outgoing_password,
          authMethod: messagesAccountRow.outgoing_auth_method
        },
        folders: [],
        isDefault: messagesAccountRow.is_default === 1,
        isActive: messagesAccountRow.is_active === 1,
        lastSync: new Date(messagesAccountRow.last_sync),
        syncInterval: messagesAccountRow.sync_interval
      };

      try {
        // Use real IMAP service to fetch messages
        const imapService = new ImapService();
        let config = ImapService.createConnectionConfig(messageAccount);
        if (messageAccount.incoming.authMethod === 'oauth2') {
          const tokenRow = await c.env.DB.prepare(`
            SELECT incoming_oauth_access_token, incoming_oauth_refresh_token, incoming_oauth_expires_at FROM email_accounts WHERE id = ?
          `).bind(messageAccount.id).first();
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
                    .bind(accessToken, newExpiresAt, messageAccount.id).run();
                } else {
                  console.warn('Failed to refresh access token');
                }
              }
            }
            if (accessToken) {
              config = { ...config, authMethod: 'oauth2', oauth: { user: messageAccount.email, accessToken } } as any;
            }
          }
        }

        console.log(`🔌 Connecting to IMAP server for messages: ${config.host}:${config.port}`);
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
        await imapService.disconnect();

        console.log(`✅ Ultimate Email Engine returned ${messages.length} real messages from IMAP`);

        return c.json({
          success: true,
          messages,
          pagination: {
            limit,
            total: messages.length,
            hasMore: messages.length === limit
          },
          message: `Retrieved ${messages.length} real messages from Ultimate Email Engine via IMAP`
        });

      } catch (imapError) {
        console.error('❌ IMAP message fetch failed, using enhanced demo messages:', imapError);

        // Enhanced demo messages for better user experience
        const demoMessages = [
          {
            id: 'demo_msg_1',
            messageId: '<demo1@ultimate-email-engine.com>',
            subject: '🚀 Welcome to Ultimate Email Engine!',
            from: {
              name: 'Ultimate Email Engine',
              email: 'welcome@ultimate-email-engine.com'
            },
            to: [{ name: messageAccount.name, email: messageAccount.email }],
            cc: [],
            bcc: [],
            date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            receivedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            body: {
              text: 'Welcome to the Ultimate Email Engine - the world\'s most robust email infrastructure! This is a demo message showing the system\'s capabilities.',
              html: '<div style="font-family: Arial, sans-serif;"><h2>🚀 Welcome to Ultimate Email Engine!</h2><p>The world\'s most robust email infrastructure is now operational.</p><p><strong>Features:</strong></p><ul><li>Intelligent Auto-Discovery</li><li>Enterprise-grade Performance</li><li>Complete Privacy & Independence</li></ul><p>This is demo data - connect with real credentials to see your actual emails.</p></div>'
            },
            attachments: [],
            flags: {
              seen: false,
              answered: false,
              flagged: true,
              deleted: false,
              draft: false,
              recent: true
            },
            headers: {},
            size: 2048,
            folder: folderId,
            uid: 1001,
            isRead: false,
            isStarred: true,
            isImportant: true,
            labels: ['Ultimate', 'Engine', 'Demo']
          },
          {
            id: 'demo_msg_2',
            messageId: '<demo2@ultimate-email-engine.com>',
            subject: '📊 System Performance Report',
            from: {
              name: 'Email Engine Monitor',
              email: 'monitor@ultimate-email-engine.com'
            },
            to: [{ name: messageAccount.name, email: messageAccount.email }],
            cc: [],
            bcc: [],
            date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            receivedDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
            body: {
              text: 'Your Ultimate Email Engine is performing excellently with 85% cache hit rate and sub-second response times.',
              html: '<div style="font-family: Arial, sans-serif;"><h3>📊 Performance Report</h3><p>Your Ultimate Email Engine is performing excellently:</p><ul><li>✅ Cache Hit Rate: 85%</li><li>⚡ Response Time: <500ms</li><li>🏆 System Health: Excellent</li></ul></div>'
            },
            attachments: [],
            flags: {
              seen: true,
              answered: false,
              flagged: false,
              deleted: false,
              draft: false,
              recent: false
            },
            headers: {},
            size: 1536,
            folder: folderId,
            uid: 1002,
            isRead: true,
            isStarred: false,
            isImportant: false,
            labels: ['Performance', 'Report']
          },
          {
            id: 'demo_msg_3',
            messageId: '<demo3@ultimate-email-engine.com>',
            subject: '🔧 IMAP Connection Status',
            from: {
              name: 'System Administrator',
              email: 'admin@ultimate-email-engine.com'
            },
            to: [{ name: messageAccount.name, email: messageAccount.email }],
            cc: [],
            bcc: [],
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            receivedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            body: {
              text: 'IMAP authentication failed with current credentials. Please update with real email credentials or app passwords for Gmail.',
              html: '<div style="font-family: Arial, sans-serif;"><h3>🔧 Connection Status</h3><p><strong>Status:</strong> IMAP authentication failed</p><p><strong>Reason:</strong> Invalid credentials detected</p><p><strong>Solution:</strong> Update with real email credentials or Gmail app passwords</p><p>The system is using demo data until real credentials are provided.</p></div>'
            },
            attachments: [],
            flags: {
              seen: false,
              answered: false,
              flagged: false,
              deleted: false,
              draft: false,
              recent: false
            },
            headers: {},
            size: 1024,
            folder: folderId,
            uid: 1003,
            isRead: false,
            isStarred: false,
            isImportant: true,
            labels: ['System', 'Alert']
          }
        ];

        return c.json({
          success: true,
          messages: demoMessages,
          pagination: {
            limit,
            total: demoMessages.length,
            hasMore: false
          },
          message: `Retrieved ${demoMessages.length} enhanced demo messages (IMAP authentication failed)`,
          warning: `IMAP authentication failed - using demo data. Error: ${imapError instanceof Error ? imapError.message : 'Unknown error'}`,
          isDemo: true
        });
      }

    } catch (error) {
      console.error('❌ Ultimate Email Engine messages error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch messages from Ultimate Email Engine'
      }, 500);
    }
  });

  /**
   * Sync account using Ultimate Email Engine
   */
  app.post('/sync-account/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Verify account belongs to user
      const accountRow = await c.env.DB.prepare(`
        SELECT id FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      console.log(`🔄 Starting account sync with Ultimate Email Engine: ${accountId}`);

      const syncResult = await emailManager.syncAccount(accountId);

      if (syncResult.success) {
        console.log(`✅ Account sync completed: ${accountId}`);
        return c.json({
          success: true,
          syncResult,
          message: 'Account synchronized successfully'
        });
      } else {
        console.log(`⚠️ Account sync completed with errors: ${accountId}`);
        return c.json({
          success: false,
          syncResult,
          message: 'Account sync completed with errors'
        }, 207); // Multi-status
      }

    } catch (error) {
      console.error('❌ Account sync error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Account sync failed'
      }, 500);
    }
  });

  /**
   * Get message content using EmailEngine
   */
  app.get('/message-content/:accountId/:messageId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');
      const messageId = c.req.param('messageId');

      // Verify account belongs to user
      const accountRow = await c.env.DB.prepare(`
        SELECT id FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      console.log(`📧 Fetching EmailEngine message content: ${accountId}/${messageId}`);

      const emailEngine = new EmailEngineService(emailEngineConfig);
      const content = await emailEngine.getMessageContent(accountId, messageId);

      return c.json({
        success: true,
        content,
        message: 'Message content retrieved successfully'
      });

    } catch (error) {
      console.error('❌ EmailEngine message content error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch message content from EmailEngine'
      }, 500);
    }
  });

  /**
   * Debug endpoint to check email account configurations
   */
  app.get('/debug/account/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Get account details from database
      const accountRow = await c.env.DB.prepare(`
        SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        return c.json({ error: 'Account not found' }, 404);
      }

      // Return account info (without sensitive data)
      return c.json({
        success: true,
        account: {
          id: accountRow.id,
          name: accountRow.name,
          email: accountRow.email,
          provider: accountRow.provider,
          incoming: {
            host: accountRow.incoming_host,
            port: accountRow.incoming_port,
            secure: accountRow.incoming_secure === 1,
            username: accountRow.incoming_username,
            hasPassword: !!accountRow.incoming_password,
            passwordLength: accountRow.incoming_password?.length || 0,
            authMethod: accountRow.incoming_auth_method
          },
          outgoing: {
            host: accountRow.outgoing_host,
            port: accountRow.outgoing_port,
            secure: accountRow.outgoing_secure === 1,
            username: accountRow.outgoing_username,
            hasPassword: !!accountRow.outgoing_password,
            passwordLength: accountRow.outgoing_password?.length || 0,
            authMethod: accountRow.outgoing_auth_method
          },
          isDefault: accountRow.is_default === 1,
          isActive: accountRow.is_active === 1,
          lastSync: accountRow.last_sync,
          syncInterval: accountRow.sync_interval
        }
      });

    } catch (error) {
      console.error('❌ Debug account error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get account debug info'
      }, 500);
    }
  });

  /**
   * Test IMAP connection for debugging
   */
  app.post('/debug/test-imap/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      // Get account details from database
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

      console.log(`🧪 Testing IMAP connection for debug: ${account.email}`);

      try {
        // Test IMAP connection
        const imapService = new ImapService();
        const config = ImapService.createConnectionConfig(account);

        console.log(`🔌 Debug: Attempting IMAP connection to ${config.host}:${config.port}`);
        console.log(`🔌 Debug: Username: ${config.auth.username}`);
        console.log(`🔌 Debug: Password length: ${config.auth.password?.length || 0}`);
        console.log(`🔌 Debug: TLS: ${config.tls}`);

        await imapService.connectAuto(config);

        console.log('✅ Debug: IMAP connection successful');

        // Try to get folders
        const folders = await imapService.getFolders();
        await imapService.disconnect();

        return c.json({
          success: true,
          message: 'IMAP connection test successful',
          connectionInfo: {
            host: config.host,
            port: config.port,
            tls: config.tls,
            username: config.auth.username,
            passwordProvided: !!config.auth.password
          },
          foldersFound: folders.length,
          folders: folders.slice(0, 5) // Return first 5 folders
        });

      } catch (imapError) {
        console.error('❌ Debug: IMAP connection failed:', imapError);

        return c.json({
          success: false,
          message: 'IMAP connection test failed',
          error: imapError instanceof Error ? imapError.message : 'Unknown IMAP error',
          connectionInfo: {
            host: account.incoming.host,
            port: account.incoming.port,
            secure: account.incoming.secure,
            username: account.incoming.username,
            passwordProvided: !!account.incoming.password
          }
        });
      }

    } catch (error) {
      console.error('❌ Debug IMAP test error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Debug IMAP test failed'
      }, 500);
    }
  });
  /**
   * Quick custom IMAP check (bypass DB) using request body credentials
   */
  app.post('/debug/test-imap-custom', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const host = body.host || 'mail.lujiventrucci.com';
      const port = Number(body.port || 993);
      const tls = body.tls !== undefined ? !!body.tls : true;
      const username = body.username;
      const password = body.password;
      if (!username || !password) {
        return c.json({ success: false, error: 'username and password required in body' }, 400);
      }

      const imapService = new ImapService();
      const config = {
        host,
        port,
        tls,
        auth: { username, password },
        authMethod: 'plain' as const
      };

      console.log(`🧪 Custom IMAP test to ${host}:${port} tls=${tls} user=${username}`);
      await imapService.connectAuto(config);
      const folders = await imapService.getFolders();
      await imapService.disconnect();

      return c.json({ success: true, foldersFound: folders.length, firstFolders: folders.slice(0,5) });
    } catch (error) {
      console.error('❌ Custom IMAP test failed:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  });


  return app;
}
