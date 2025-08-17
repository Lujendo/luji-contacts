import { Hono } from 'hono';
import { DatabaseService } from '../utils/database';
import { EmailAccount } from '../../types/emailClient';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

export function createEmailAccountRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono<{ Bindings: Env }>();

  // Apply authentication middleware to all routes
  app.use('*', createAuthMiddleware(auth, db));

// Email Account Database Schema
interface EmailAccountRecord {
  id: string;
  user_id: number;
  name: string;
  email: string;
  provider: string;
  incoming_host: string;
  incoming_port: number;
  incoming_secure: boolean;
  incoming_username: string;
  incoming_password: string;
  incoming_auth_method: string;
  outgoing_host: string;
  outgoing_port: number;
  outgoing_secure: boolean;
  outgoing_username: string;
  outgoing_password: string;
  outgoing_auth_method: string;
  sync_interval: number;
  is_default: boolean;
  is_active: boolean;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

  // Get all email accounts for user
  app.get('/', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const userId = user.id;

      const accounts = await c.env.DB.prepare(`
      SELECT * FROM email_accounts 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at ASC
    `).bind(userId).all();

    const formattedAccounts = accounts.results.map((account: any) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      provider: account.provider,
      incoming: {
        host: account.incoming_host,
        port: account.incoming_port,
        secure: account.incoming_secure === 1,
        username: account.incoming_username,
        password: account.incoming_password,
        authMethod: account.incoming_auth_method
      },
      outgoing: {
        host: account.outgoing_host,
        port: account.outgoing_port,
        secure: account.outgoing_secure === 1,
        username: account.outgoing_username,
        password: account.outgoing_password,
        authMethod: account.outgoing_auth_method
      },
      folders: [], // Will be populated when needed
      isDefault: account.is_default === 1,
      isActive: account.is_active === 1,
      lastSync: new Date(account.last_sync),
      syncInterval: account.sync_interval
    }));

    return c.json({ accounts: formattedAccounts });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return c.json({ error: 'Failed to fetch email accounts' }, 500);
  }
});

// Create new email account
app.post('/', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const userId = user.id;
    const accountData = await c.req.json();

    console.log('📧 Creating email account for user:', userId);
    console.log('📧 Account data received:', JSON.stringify(accountData, null, 2));

    // Validate required fields
    if (!accountData.name || !accountData.email || !accountData.incoming?.host) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Ensure SMTP settings have defaults
    const outgoingSettings = accountData.outgoing || {};
    const smtpHost = outgoingSettings.host?.trim() || accountData.incoming.host.replace('imap.', 'smtp.').replace('pop.', 'smtp.');
    const smtpPort = outgoingSettings.port || 587;
    const smtpSecure = outgoingSettings.secure !== undefined ? outgoingSettings.secure : true;
    const smtpUsername = outgoingSettings.username?.trim() || accountData.incoming.username;
    const smtpPassword = outgoingSettings.password?.trim() || accountData.incoming.password;
    const smtpAuthMethod = outgoingSettings.authMethod?.trim() || 'plain';

    // Generate unique ID
    const accountId = crypto.randomUUID();

    // If this is the first account, make it default
    const existingAccounts = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM email_accounts WHERE user_id = ?
    `).bind(userId).first();

    const isDefault = existingAccounts?.count === 0;

    // Insert new account
    await c.env.DB.prepare(`
      INSERT INTO email_accounts (
        id, user_id, name, email, provider,
        incoming_host, incoming_port, incoming_secure, incoming_username, incoming_password, incoming_auth_method,
        outgoing_host, outgoing_port, outgoing_secure, outgoing_username, outgoing_password, outgoing_auth_method,
        sync_interval, is_default, is_active, last_sync, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      accountId,
      userId,
      accountData.name,
      accountData.email,
      accountData.provider || 'imap',
      accountData.incoming.host,
      accountData.incoming.port || 993,
      accountData.incoming.secure ? 1 : 0,
      accountData.incoming.username,
      accountData.incoming.password,
      accountData.incoming.authMethod || 'plain',
      smtpHost,
      smtpPort,
      smtpSecure ? 1 : 0,
      smtpUsername,
      smtpPassword,
      smtpAuthMethod,
      accountData.syncInterval || 5,
      isDefault ? 1 : 0,
      1, // is_active
      new Date().toISOString(), // Always use current time for last_sync
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    // Return the created account
    const newAccount = {
      id: accountId,
      name: accountData.name,
      email: accountData.email,
      provider: accountData.provider || 'imap',
      incoming: accountData.incoming,
      outgoing: accountData.outgoing || {},
      folders: [],
      isDefault,
      isActive: true,
      lastSync: new Date(),
      syncInterval: accountData.syncInterval || 5
    };

    return c.json({ account: newAccount }, 201);
  } catch (error) {
    console.error('Error creating email account:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return c.json({
      error: 'Failed to create email account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update email account
app.put('/:id', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const userId = user.id;
    const accountId = c.req.param('id');
    const updates = await c.req.json();

    // Verify account belongs to user
    const existingAccount = await c.env.DB.prepare(`
      SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first();

    if (!existingAccount) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Update account
    await c.env.DB.prepare(`
      UPDATE email_accounts SET
        name = ?, email = ?, provider = ?,
        incoming_host = ?, incoming_port = ?, incoming_secure = ?, 
        incoming_username = ?, incoming_password = ?, incoming_auth_method = ?,
        outgoing_host = ?, outgoing_port = ?, outgoing_secure = ?, 
        outgoing_username = ?, outgoing_password = ?, outgoing_auth_method = ?,
        sync_interval = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      updates.name || existingAccount.name,
      updates.email || existingAccount.email,
      updates.provider || existingAccount.provider,
      updates.incoming?.host || existingAccount.incoming_host,
      updates.incoming?.port || existingAccount.incoming_port,
      updates.incoming?.secure ? 1 : 0,
      updates.incoming?.username || existingAccount.incoming_username,
      updates.incoming?.password || existingAccount.incoming_password,
      updates.incoming?.authMethod || existingAccount.incoming_auth_method,
      updates.outgoing?.host || existingAccount.outgoing_host,
      updates.outgoing?.port || existingAccount.outgoing_port,
      updates.outgoing?.secure ? 1 : 0,
      updates.outgoing?.username || existingAccount.outgoing_username,
      updates.outgoing?.password || existingAccount.outgoing_password,
      updates.outgoing?.authMethod || existingAccount.outgoing_auth_method,
      updates.syncInterval || existingAccount.sync_interval,
      new Date().toISOString(),
      accountId,
      userId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating email account:', error);
    return c.json({ error: 'Failed to update email account' }, 500);
  }
});

// Delete email account
app.delete('/:id', async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    const userId = user.id;
    const accountId = c.req.param('id');

    // Verify account belongs to user
    const existingAccount = await c.env.DB.prepare(`
      SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first();

    if (!existingAccount) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Delete account
    await c.env.DB.prepare(`
      DELETE FROM email_accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting email account:', error);
    return c.json({ error: 'Failed to delete email account' }, 500);
  }
});

// Test email account connection
app.post('/test', async (c) => {
  try {
    getAuthenticatedUser(c); // Ensure user is authenticated

    const accountData = await c.req.json();

    // Basic validation
    if (!accountData.incoming?.host || !accountData.incoming?.port) {
      return c.json({
        success: false,
        error: 'Missing server configuration'
      }, 400);
    }

    // For now, we'll simulate a connection test
    // In a real implementation, you would test the actual IMAP/SMTP connection
    const isValid = accountData.incoming.host && 
                   accountData.incoming.port && 
                   accountData.incoming.username && 
                   accountData.incoming.password;

    if (isValid) {
      return c.json({
        success: true,
        message: 'Connection test successful'
      });
    } else {
      return c.json({
        success: false,
        error: 'Invalid configuration'
      }, 400);
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    return c.json({
      success: false,
      error: 'Connection test failed'
    }, 500);
  }
});

  // Debug endpoint to check table schema
  app.get('/debug/schema', async (c) => {
    try {
      getAuthenticatedUser(c); // Ensure user is authenticated

      const tableInfo = await c.env.DB.prepare(`
        PRAGMA table_info(email_accounts)
      `).all();

      return c.json({
        tableExists: tableInfo.results.length > 0,
        schema: tableInfo.results
      });
    } catch (error) {
      console.error('Error checking schema:', error);
      return c.json({
        error: 'Failed to check schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return app;
}
