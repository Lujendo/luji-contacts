import { v4 as uuidv4 } from 'uuid';
import { EmailQueueItem, EmailData, SendEmailOptions, QueueStatistics } from '../types/email';

/**
 * Professional Email Queue Service
 * Handles email queuing, retry logic, and delivery management
 */
export class EmailQueueService {
  private queue: Map<string, EmailQueueItem> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL = 5000; // 5 seconds
  private readonly MAX_CONCURRENT_EMAILS = 10;

  constructor() {
    this.startQueueProcessor();
  }

  /**
   * Add email to queue for sending
   */
  async addToQueue(
    emailData: EmailData,
    userId: number,
    options: SendEmailOptions = {}
  ): Promise<string> {
    const queueItem: EmailQueueItem = {
      id: uuidv4(),
      userId,
      priority: options.priority || 'normal',
      scheduledAt: options.scheduledAt || new Date(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      emailData: {
        ...emailData,
        trackOpens: options.trackOpens ?? emailData.trackOpens,
        trackClicks: options.trackClicks ?? emailData.trackClicks,
        tags: options.tags || emailData.tags,
        metadata: { ...emailData.metadata, ...options.metadata }
      },
      providerId: options.providerId || 'auto',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queue.set(queueItem.id, queueItem);
    
    console.log(`📧 Email queued: ${queueItem.id} for user ${userId}`);
    return queueItem.id;
  }

  /**
   * Get queue item by ID
   */
  getQueueItem(id: string): EmailQueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Get queue items by user ID
   */
  getUserQueueItems(userId: number): EmailQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.userId === userId);
  }

  /**
   * Cancel queued email
   */
  cancelEmail(id: string): boolean {
    const item = this.queue.get(id);
    if (item && item.status === 'pending') {
      item.status = 'cancelled';
      item.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getQueueStatistics(): QueueStatistics {
    const items = Array.from(this.queue.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayItems = items.filter(item => item.createdAt >= today);
    const sentItems = items.filter(item => item.status === 'sent');
    const totalProcessingTime = sentItems.reduce((sum, item) => {
      if (item.sentAt) {
        return sum + (item.sentAt.getTime() - item.createdAt.getTime());
      }
      return sum;
    }, 0);

    return {
      pending: items.filter(item => item.status === 'pending').length,
      processing: items.filter(item => item.status === 'processing').length,
      sent: items.filter(item => item.status === 'sent').length,
      failed: items.filter(item => item.status === 'failed').length,
      cancelled: items.filter(item => item.status === 'cancelled').length,
      totalToday: todayItems.length,
      averageProcessingTime: sentItems.length > 0 ? totalProcessingTime / sentItems.length : 0,
      successRate: items.length > 0 ? (sentItems.length / items.length) * 100 : 0
    };
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('❌ Queue processing error:', error);
      });
    }, this.PROCESSING_INTERVAL);

    console.log('🚀 Email queue processor started');
  }

  /**
   * Stop the queue processor
   */
  stopQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('⏹️ Email queue processor stopped');
  }

  /**
   * Process pending emails in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingItems = this.getPendingItems();
      const itemsToProcess = pendingItems.slice(0, this.MAX_CONCURRENT_EMAILS);

      if (itemsToProcess.length > 0) {
        console.log(`📨 Processing ${itemsToProcess.length} emails from queue`);
        
        const promises = itemsToProcess.map(item => this.processQueueItem(item));
        await Promise.allSettled(promises);
      }

      // Clean up old completed items (older than 24 hours)
      this.cleanupOldItems();

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get pending items sorted by priority and schedule time
   */
  private getPendingItems(): EmailQueueItem[] {
    const now = new Date();
    
    return Array.from(this.queue.values())
      .filter(item => 
        item.status === 'pending' && 
        item.scheduledAt <= now
      )
      .sort((a, b) => {
        // Sort by priority first (high = 0, normal = 1, low = 2)
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        
        // Then by scheduled time (earlier first)
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      });
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: EmailQueueItem): Promise<void> {
    item.status = 'processing';
    item.updatedAt = new Date();

    try {
      // Import EmailService dynamically to avoid circular dependencies
      const { EmailService } = await import('./EmailService');
      const emailService = new EmailService();

      await emailService.sendEmailDirect(item.emailData, item.userId, item.providerId);
      
      item.status = 'sent';
      item.sentAt = new Date();
      item.updatedAt = new Date();
      
      console.log(`✅ Email sent successfully: ${item.id}`);

    } catch (error) {
      console.error(`❌ Email sending failed: ${item.id}`, error);
      
      item.retryCount++;
      item.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.updatedAt = new Date();

      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
        console.error(`💀 Email permanently failed after ${item.maxRetries} retries: ${item.id}`);
      } else {
        item.status = 'pending';
        // Exponential backoff: 1min, 5min, 15min
        const delayMinutes = Math.pow(3, item.retryCount);
        item.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        
        console.log(`🔄 Email retry ${item.retryCount}/${item.maxRetries} scheduled for ${item.scheduledAt}: ${item.id}`);
      }
    }
  }

  /**
   * Clean up old completed items to prevent memory leaks
   */
  private cleanupOldItems(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleanedCount = 0;

    for (const [id, item] of this.queue.entries()) {
      if (
        (item.status === 'sent' || item.status === 'failed' || item.status === 'cancelled') &&
        item.updatedAt < cutoffTime
      ) {
        this.queue.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old queue items`);
    }
  }

  /**
   * Get retry delay in milliseconds based on retry count
   */
  private getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1min, 5min, 15min
    const delayMinutes = Math.pow(3, retryCount);
    return delayMinutes * 60 * 1000;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down email queue service...');
    
    this.stopQueueProcessor();
    
    // Wait for current processing to complete
    while (this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Email queue service shutdown complete');
  }
}

// Singleton instance
export const emailQueueService = new EmailQueueService();
