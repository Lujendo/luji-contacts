import { Hono } from 'hono';
import { UltimateEmailManager } from '../email-engine/core/UltimateEmailManager';
import { DatabaseService } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

/**
 * Create Ultimate Email Engine routes with proper dependencies
 */
export function createEmailEngineRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono();

  // Add authentication middleware
  app.use('*', createAuthMiddleware(auth));

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

      // For now, return mock folders since the full IMAP implementation is not complete
      // In production, this would connect to the account and fetch real folders
      const mockFolders = [
        {
          id: 'INBOX',
          name: 'INBOX',
          displayName: 'Inbox',
          type: 'inbox' as const,
          children: [],
          unreadCount: 0,
          totalCount: 0,
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
          totalCount: 0,
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
          unreadCount: 0,
          totalCount: 0,
          canSelect: true,
          canCreate: false,
          canDelete: false,
          canRename: false
        }
      ];

      console.log(`✅ Ultimate Email Engine returned ${mockFolders.length} folders (mock data)`);

      return c.json({
        success: true,
        folders: mockFolders,
        message: `Retrieved ${mockFolders.length} folders from Ultimate Email Engine (mock data)`
      });

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

      // For now, return mock messages since the full IMAP implementation is not complete
      // In production, this would connect to the account and fetch real messages
      const mockMessages = [
        {
          id: 'msg_1',
          messageId: '<test1@example.com>',
          subject: 'Welcome to Ultimate Email Engine',
          from: {
            name: 'Ultimate Email Engine',
            email: 'engine@lujiventrucci.com'
          },
          to: [{ name: 'User', email: 'user@example.com' }],
          cc: [],
          bcc: [],
          date: new Date(),
          receivedDate: new Date(),
          body: {
            text: 'Welcome to the Ultimate Email Engine - the world\'s most robust email infrastructure!',
            html: '<p>Welcome to the <strong>Ultimate Email Engine</strong> - the world\'s most robust email infrastructure!</p>'
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
          size: 1024,
          folder: folderId,
          uid: 1,
          isRead: false,
          isStarred: true,
          isImportant: true,
          labels: ['Ultimate', 'Engine']
        }
      ];

      console.log(`✅ Ultimate Email Engine returned ${mockMessages.length} messages (mock data)`);

      return c.json({
        success: true,
        messages: mockMessages,
        pagination: {
          limit,
          total: mockMessages.length,
          hasMore: false
        },
        message: `Retrieved ${mockMessages.length} messages from Ultimate Email Engine (mock data)`
      });

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

  return app;
}
