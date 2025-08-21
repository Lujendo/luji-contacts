/**
 * HTTP API routes for Email Worker functionality
 * Replaces IMAP-based email fetching with D1 database queries
 */

import { Hono } from 'hono';
import { initializeDefaultFolders } from '../email-worker';

const app = new Hono();

/**
 * GET /api/email-worker/folders/:accountId
 * Get folders for an email account (replaces IMAP folder listing)
 */
app.get('/folders/:accountId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    
    // Verify account exists and user has access
    const account = await c.env.DB.prepare(`
      SELECT ea.id, ea.name, ea.email 
      FROM email_accounts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.id = ? AND u.id = ?
    `).bind(accountId, c.get('userId')).first();

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Get folders with counts
    const folders = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        display_name,
        type,
        parent_id,
        total_count,
        unread_count,
        can_select,
        can_create,
        can_delete,
        can_rename
      FROM email_folders 
      WHERE account_id = ?
      ORDER BY 
        CASE type 
          WHEN 'inbox' THEN 1
          WHEN 'sent' THEN 2
          WHEN 'drafts' THEN 3
          WHEN 'trash' THEN 4
          WHEN 'spam' THEN 5
          ELSE 6
        END,
        display_name
    `).bind(accountId).all();

    // If no folders exist, initialize defaults
    if (!folders.results || folders.results.length === 0) {
      await initializeDefaultFolders(c.env.DB, accountId);
      
      // Fetch again after initialization
      const newFolders = await c.env.DB.prepare(`
        SELECT 
          id, name, display_name, type, parent_id,
          total_count, unread_count, can_select, can_create, can_delete, can_rename
        FROM email_folders 
        WHERE account_id = ?
        ORDER BY 
          CASE type 
            WHEN 'inbox' THEN 1
            WHEN 'sent' THEN 2
            WHEN 'drafts' THEN 3
            WHEN 'trash' THEN 4
            WHEN 'spam' THEN 5
            ELSE 6
          END,
          display_name
      `).bind(accountId).all();

      return c.json({ 
        folders: (newFolders.results || []).map(formatFolder),
        account: { id: account.id, name: account.name, email: account.email }
      });
    }

    return c.json({ 
      folders: (folders.results || []).map(formatFolder),
      account: { id: account.id, name: account.name, email: account.email }
    });

  } catch (error) {
    console.error('Error fetching folders:', error);
    return c.json({ error: 'Failed to fetch folders' }, 500);
  }
});

/**
 * GET /api/email-worker/emails/:accountId/:folder
 * Get emails from a specific folder (replaces IMAP message fetching)
 */
app.get('/emails/:accountId/:folder', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const folder = c.req.param('folder');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Verify account access
    const account = await c.env.DB.prepare(`
      SELECT ea.id FROM email_accounts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.id = ? AND u.id = ?
    `).bind(accountId, c.get('userId')).first();

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Get emails from folder
    const emails = await c.env.DB.prepare(`
      SELECT 
        id, message_id, from_addr, to_addr, cc_addr, bcc_addr,
        reply_to, subject, body_text, body_html, headers,
        folder, is_read, is_starred, is_deleted, received_at
      FROM worker_emails 
      WHERE account_id = ? AND folder = ? AND is_deleted = FALSE
      ORDER BY received_at DESC
      LIMIT ? OFFSET ?
    `).bind(accountId, folder, limit, offset).all();

    // Get total count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM worker_emails 
      WHERE account_id = ? AND folder = ? AND is_deleted = FALSE
    `).bind(accountId, folder).first();

    const total = (totalResult as any)?.total || 0;

    return c.json({
      emails: (emails.results || []).map(formatEmail),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    return c.json({ error: 'Failed to fetch emails' }, 500);
  }
});

/**
 * GET /api/email-worker/emails/:accountId/email/:emailId
 * Get a specific email by ID
 */
app.get('/emails/:accountId/email/:emailId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const emailId = c.req.param('emailId');

    // Verify account access
    const account = await c.env.DB.prepare(`
      SELECT ea.id FROM email_accounts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.id = ? AND u.id = ?
    `).bind(accountId, c.get('userId')).first();

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Get specific email
    const email = await c.env.DB.prepare(`
      SELECT 
        id, message_id, from_addr, to_addr, cc_addr, bcc_addr,
        reply_to, subject, body_text, body_html, headers,
        folder, is_read, is_starred, is_deleted, received_at, attachments
      FROM worker_emails 
      WHERE id = ? AND account_id = ? AND is_deleted = FALSE
    `).bind(emailId, accountId).first();

    if (!email) {
      return c.json({ error: 'Email not found' }, 404);
    }

    return c.json({ email: formatEmail(email) });

  } catch (error) {
    console.error('Error fetching email:', error);
    return c.json({ error: 'Failed to fetch email' }, 500);
  }
});

/**
 * PATCH /api/email-worker/emails/:accountId/email/:emailId
 * Update email properties (mark as read, starred, etc.)
 */
app.patch('/emails/:accountId/email/:emailId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const emailId = c.req.param('emailId');
    const updates = await c.req.json();

    // Verify account access
    const account = await c.env.DB.prepare(`
      SELECT ea.id FROM email_accounts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.id = ? AND u.id = ?
    `).bind(accountId, c.get('userId')).first();

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Build update query
    const allowedFields = ['is_read', 'is_starred', 'folder'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(emailId, accountId);

    await c.env.DB.prepare(`
      UPDATE worker_emails 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND account_id = ?
    `).bind(...values).run();

    return c.json({ success: true });

  } catch (error) {
    console.error('Error updating email:', error);
    return c.json({ error: 'Failed to update email' }, 500);
  }
});

/**
 * Format folder data for API response
 */
function formatFolder(folder: any) {
  return {
    id: folder.id || folder.name,
    name: folder.name,
    displayName: folder.display_name,
    type: folder.type,
    children: [],
    unreadCount: folder.unread_count || 0,
    totalCount: folder.total_count || 0,
    canSelect: Boolean(folder.can_select),
    canCreate: Boolean(folder.can_create),
    canDelete: Boolean(folder.can_delete),
    canRename: Boolean(folder.can_rename)
  };
}

/**
 * Format email data for API response
 */
function formatEmail(email: any) {
  let headers = {};
  try {
    headers = JSON.parse(email.headers || '{}');
  } catch (e) {
    console.warn('Failed to parse email headers:', e);
  }

  let attachments = [];
  try {
    attachments = JSON.parse(email.attachments || '[]');
  } catch (e) {
    console.warn('Failed to parse email attachments:', e);
  }

  return {
    id: email.id,
    messageId: email.message_id,
    from: email.from_addr,
    to: email.to_addr,
    cc: email.cc_addr,
    bcc: email.bcc_addr,
    replyTo: email.reply_to,
    subject: email.subject,
    bodyText: email.body_text,
    bodyHtml: email.body_html,
    headers,
    attachments,
    folder: email.folder,
    isRead: Boolean(email.is_read),
    isStarred: Boolean(email.is_starred),
    receivedAt: email.received_at,
    flags: {
      seen: Boolean(email.is_read),
      flagged: Boolean(email.is_starred)
    }
  };
}

export default app;
