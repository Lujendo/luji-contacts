import { Hono } from 'hono';
import { EmailService } from '../../services/EmailService';
import { emailQueueService } from '../../services/EmailQueueService';
import { EmailData, SendEmailOptions, BulkEmailOptions } from '../../types/email';
import { getAuthenticatedUser } from '../utils/auth';

// Helper function to authenticate user from context
async function authenticateUser(c: any) {
  try {
    return getAuthenticatedUser(c);
  } catch (error) {
    return null;
  }
}

const app = new Hono();

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
    await db.prepare(`
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

export default app;
