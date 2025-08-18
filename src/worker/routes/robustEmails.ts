import { Hono } from 'hono';
import { RobustEmailService } from '../services/RobustEmailService';
import { DatabaseService } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

/**
 * Create robust email routes with proper dependencies
 */
export function createRobustEmailRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono();

  // Add authentication middleware
  app.use('*', createAuthMiddleware(auth, db));

/**
 * Auto-configure email server settings for a domain
 */
app.post('/auto-configure', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const { email } = await c.req.json();

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Valid email address required' }, 400);
    }

    console.log(`🔍 Auto-configuring email server for: ${email}`);
    
    const configurations = await RobustEmailService.autoConfigureEmailServer(email);
    
    console.log(`📧 Generated ${configurations.length} possible configurations`);
    
    return c.json({
      email,
      configurations: configurations.slice(0, 10), // Return top 10 most likely configs
      message: `Generated ${configurations.length} possible server configurations`
    });

  } catch (error) {
    console.error('❌ Auto-configuration failed:', error);
    return c.json({ 
      error: 'Failed to auto-configure email server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Test email server connection with comprehensive diagnostics
 */
app.post('/test-connection', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const { host, port, secure, username, password } = await c.req.json();

    if (!host || !port || !username || !password) {
      return c.json({ 
        error: 'Missing required fields: host, port, username, password' 
      }, 400);
    }

    console.log(`🔍 Testing email connection for ${username} to ${host}:${port}`);
    
    const config = {
      host,
      port: parseInt(port),
      secure: Boolean(secure),
      auth: {
        username,
        password,
        method: 'plain' as const
      }
    };

    const result = await RobustEmailService.testEmailConnection(config);
    
    if (result.success) {
      console.log(`✅ Email connection successful for ${username}`);
      return c.json({
        success: true,
        message: 'Email server connection successful',
        serverInfo: result.serverInfo,
        folderCount: result.folders?.length || 0,
        messageCount: result.messages?.length || 0,
        folders: result.folders?.slice(0, 5), // Return first 5 folders as preview
        sampleMessages: result.messages?.slice(0, 3) // Return first 3 messages as preview
      });
    } else {
      console.log(`❌ Email connection failed for ${username}: ${result.error}`);
      return c.json({
        success: false,
        error: result.error,
        suggestions: this.getConnectionSuggestions(result.error || '')
      }, 400);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return c.json({ 
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Comprehensive email server discovery and testing
 */
app.post('/discover-settings', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    console.log(`🔍 Discovering email settings for: ${email}`);
    
    // Generate possible configurations
    const configurations = await RobustEmailService.autoConfigureEmailServer(email);
    
    const results = [];
    let successfulConfig = null;
    
    // Test each configuration (limit to first 5 to avoid timeout)
    for (const config of configurations.slice(0, 5)) {
      config.auth.password = password;
      
      console.log(`🧪 Testing ${config.host}:${config.port} (SSL: ${config.secure})`);
      
      const result = await RobustEmailService.testEmailConnection(config);
      
      results.push({
        config,
        result: {
          success: result.success,
          error: result.error,
          serverInfo: result.serverInfo
        }
      });
      
      if (result.success && !successfulConfig) {
        successfulConfig = {
          config,
          folders: result.folders,
          messages: result.messages,
          serverInfo: result.serverInfo
        };
        break; // Stop on first successful connection
      }
    }
    
    if (successfulConfig) {
      console.log(`✅ Found working configuration: ${successfulConfig.config.host}:${successfulConfig.config.port}`);
      
      return c.json({
        success: true,
        message: 'Email server settings discovered successfully',
        recommendedConfig: successfulConfig.config,
        serverInfo: successfulConfig.serverInfo,
        folders: successfulConfig.folders,
        sampleMessages: successfulConfig.messages?.slice(0, 3),
        allResults: results
      });
    } else {
      console.log(`❌ No working configuration found for ${email}`);
      
      return c.json({
        success: false,
        message: 'Could not find working email server settings',
        allResults: results,
        suggestions: [
          'Verify your email and password are correct',
          'Check if IMAP/POP3 is enabled on your email account',
          'Contact your email provider for server settings',
          'Try enabling "Less secure app access" if using Gmail',
          'Check if two-factor authentication requires app password'
        ]
      }, 400);
    }

  } catch (error) {
    console.error('❌ Settings discovery failed:', error);
    return c.json({ 
      error: 'Settings discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get comprehensive email data using robust connection
 */
app.get('/robust-folders/:accountId', async (c) => {
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

    console.log(`📧 Fetching robust email data for: ${accountRow.email}`);

    const config = {
      host: accountRow.incoming_host,
      port: accountRow.incoming_port,
      secure: accountRow.incoming_secure === 1,
      auth: {
        username: accountRow.incoming_username,
        password: accountRow.incoming_password,
        method: 'plain' as const
      }
    };

    const result = await RobustEmailService.testEmailConnection(config);

    if (result.success) {
      console.log(`✅ Robust email fetch successful for ${accountRow.email}`);
      
      return c.json({
        success: true,
        folders: result.folders || [],
        serverInfo: result.serverInfo,
        message: 'Email data fetched successfully using robust connection'
      });
    } else {
      console.log(`❌ Robust email fetch failed for ${accountRow.email}: ${result.error}`);
      
      // Return default folders as fallback
      const defaultFolders = [
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

      return c.json({
        success: false,
        folders: defaultFolders,
        error: result.error,
        message: 'Using default folders due to connection failure',
        suggestions: this.getConnectionSuggestions(result.error || '')
      });
    }

  } catch (error) {
    console.error('❌ Robust email fetch failed:', error);
    return c.json({ 
      error: 'Failed to fetch email data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get connection troubleshooting suggestions based on error
 */
function getConnectionSuggestions(error: string): string[] {
  const suggestions = [];
  
  if (error.includes('timeout') || error.includes('unreachable')) {
    suggestions.push('Check if the server hostname is correct');
    suggestions.push('Verify the port number (993 for IMAP SSL, 143 for IMAP, 995 for POP3 SSL, 110 for POP3)');
    suggestions.push('Check if your firewall is blocking the connection');
  }
  
  if (error.includes('authentication') || error.includes('login') || error.includes('password')) {
    suggestions.push('Verify your username and password are correct');
    suggestions.push('Check if IMAP/POP3 access is enabled on your account');
    suggestions.push('Try using your full email address as the username');
    suggestions.push('Check if you need an app-specific password');
  }
  
  if (error.includes('SSL') || error.includes('TLS') || error.includes('certificate')) {
    suggestions.push('Try toggling the SSL/TLS setting');
    suggestions.push('Check if the server supports the SSL/TLS version');
    suggestions.push('Verify the server certificate is valid');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Contact your email provider for correct server settings');
    suggestions.push('Check your email provider\'s documentation');
    suggestions.push('Verify your account has email access enabled');
  }
  
  return suggestions;
}

  return app;
}
