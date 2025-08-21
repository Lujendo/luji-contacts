/**
 * Email Worker for processing incoming emails via Cloudflare Email Routing
 * This worker receives emails sent to your domain and stores them in D1 database
 */

import PostalMime from 'postal-mime';

export interface EmailMessage {
  from: string;
  to: string;
  headers: Headers;
  text(): Promise<string>;
  html(): Promise<string>;
  raw(): Promise<ReadableStream>;
  setReject(reason: string): void;
  forward(destinationAddress: string, headers?: Headers): Promise<void>;
}

export interface EmailWorkerEnv {
  DB: D1Database;
  STORAGE: R2Bucket;
  SEND_EMAIL: any; // Cloudflare send_email binding
}

export default {
  async email(message: EmailMessage, env: EmailWorkerEnv, ctx: ExecutionContext): Promise<void> {
    try {
      console.log(`📧 Processing incoming email from ${message.from} to ${message.to}`);

      // Extract email data
      const messageId = message.headers.get('message-id') || crypto.randomUUID();
      const subject = message.headers.get('subject') || '(No Subject)';
      const fromAddr = message.from;
      const toAddr = message.to;
      const ccAddr = message.headers.get('cc') || null;
      const bccAddr = message.headers.get('bcc') || null;
      const replyTo = message.headers.get('reply-to') || null;
      const receivedAt = new Date().toISOString();

      // Parse email with postal-mime for better parsing
      const rawStream = await message.raw();
      const rawArrayBuffer = await new Response(rawStream).arrayBuffer();
      const parsedEmail = await PostalMime.parse(new Uint8Array(rawArrayBuffer));

      // Get email bodies
      const bodyText = parsedEmail.text || await message.text().catch(() => '');
      const bodyHtml = parsedEmail.html || await message.html().catch(() => '');

      // Extract all headers as JSON
      const headersObj: Record<string, string> = {};
      message.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
      const headersJson = JSON.stringify(headersObj);

      // Process attachments
      const attachments = parsedEmail.attachments.map(att => ({
        filename: att.filename,
        contentType: att.mimeType,
        size: att.content.length,
        contentId: att.contentId,
        disposition: att.disposition
      }));
      const attachmentsJson = JSON.stringify(attachments);

      // Find matching email account
      const account = await env.DB.prepare(`
        SELECT id FROM email_accounts 
        WHERE email = ? AND is_active = 1
        LIMIT 1
      `).bind(toAddr).first();

      const accountId = account?.id || null;

      // Store email in database
      const emailId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO worker_emails (
          id, message_id, account_id, from_addr, to_addr, cc_addr, bcc_addr,
          reply_to, subject, body_text, body_html, headers, attachments, folder,
          is_read, received_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        emailId,
        messageId,
        accountId,
        fromAddr,
        toAddr,
        ccAddr,
        bccAddr,
        replyTo,
        subject,
        bodyText,
        bodyHtml,
        headersJson,
        attachmentsJson,
        'inbox',
        false,
        receivedAt,
        receivedAt
      ).run();

      // Update folder counts if account exists
      if (accountId) {
        await updateFolderCounts(env.DB, accountId, 'inbox');
      }

      console.log(`✅ Email stored successfully: ${emailId}`);

      // Optional: Forward to another address if needed
      // await message.forward('backup@example.com');

    } catch (error) {
      console.error('❌ Error processing email:', error);
      
      // Reject the email if there's a critical error
      if (error instanceof Error && error.message.includes('storage')) {
        message.setReject('Temporary storage error, please try again later');
      }
      
      // Don't reject for non-critical errors to avoid bouncing emails
    }
  }
};

/**
 * Update folder counts after adding/removing emails
 */
async function updateFolderCounts(db: D1Database, accountId: string, folderName: string): Promise<void> {
  try {
    // Get current counts
    const totalCount = await db.prepare(`
      SELECT COUNT(*) as count FROM worker_emails 
      WHERE account_id = ? AND folder = ? AND is_deleted = FALSE
    `).bind(accountId, folderName).first();

    const unreadCount = await db.prepare(`
      SELECT COUNT(*) as count FROM worker_emails 
      WHERE account_id = ? AND folder = ? AND is_deleted = FALSE AND is_read = FALSE
    `).bind(accountId, folderName).first();

    // Update or create folder record
    await db.prepare(`
      INSERT INTO email_folders (id, account_id, name, display_name, type, total_count, unread_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id, name) DO UPDATE SET
        total_count = excluded.total_count,
        unread_count = excluded.unread_count,
        updated_at = excluded.updated_at
    `).bind(
      crypto.randomUUID(),
      accountId,
      folderName,
      folderName.charAt(0).toUpperCase() + folderName.slice(1),
      folderName === 'inbox' ? 'inbox' : 'custom',
      (totalCount as any)?.count || 0,
      (unreadCount as any)?.count || 0,
      new Date().toISOString()
    ).run();

  } catch (error) {
    console.error('Error updating folder counts:', error);
  }
}

/**
 * Initialize default folders for an email account
 */
export async function initializeDefaultFolders(db: D1Database, accountId: string): Promise<void> {
  const defaultFolders = [
    { name: 'inbox', displayName: 'Inbox', type: 'inbox' },
    { name: 'sent', displayName: 'Sent', type: 'sent' },
    { name: 'drafts', displayName: 'Drafts', type: 'drafts' },
    { name: 'trash', displayName: 'Trash', type: 'trash' },
    { name: 'spam', displayName: 'Spam', type: 'spam' }
  ];

  for (const folder of defaultFolders) {
    await db.prepare(`
      INSERT OR IGNORE INTO email_folders (
        id, account_id, name, display_name, type, 
        total_count, unread_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).bind(
      crypto.randomUUID(),
      accountId,
      folder.name,
      folder.displayName,
      folder.type,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
  }
}
