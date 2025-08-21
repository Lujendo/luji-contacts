import { EmailData, EmailProvider, SendEmailOptions, BulkEmailOptions } from '../types/email';
import { IEmailProvider, EmailSendResult } from './providers/IEmailProvider';
import { SendGridProvider } from './providers/SendGridProvider';
import { MailgunProvider } from './providers/MailgunProvider';
import { MailChannelsProvider } from './providers/MailChannelsProvider';
import { CloudflareEmailProvider } from './providers/CloudflareEmailProvider';
import { emailQueueService } from './EmailQueueService';

/**
 * Professional Email Service
 * Orchestrates multiple email providers with failover and load balancing
 */
export class EmailService {
  private providers: Map<string, IEmailProvider> = new Map();
  private providerConfigs: Map<string, EmailProvider> = new Map();
  private isInitialized = false;
  private sendEmailBinding: any;

  constructor(sendEmailBinding?: any) {
    // Don't initialize providers in constructor for Cloudflare Workers compatibility
    this.sendEmailBinding = sendEmailBinding;
  }

  /**
   * Initialize email providers (lazy initialization)
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.loadProvidersFromEnvironment();
    }
  }

  /**
   * Load providers from environment variables
   */
  private loadProvidersFromEnvironment(): void {
    // Cloudflare Email provider (highest priority if send_email binding available)
    if (this.sendEmailBinding) {
      try {
        const cloudflareEmail = new CloudflareEmailProvider(this.sendEmailBinding);
        this.providers.set('cloudflare-email', cloudflareEmail);
        this.providerConfigs.set('cloudflare-email', {
          id: 'cloudflare-email',
          name: 'Cloudflare Email',
          type: 'sendgrid',
          isActive: true,
          priority: 1,
          config: {},
          dailyLimit: 10000,
          dailySent: 0,
          lastResetDate: new Date(),
          healthStatus: 'healthy',
          lastHealthCheck: new Date()
        });
        console.log('✅ Cloudflare Email provider registered with send_email binding');
      } catch (error) {
        console.error('❌ Failed to initialize Cloudflare Email provider:', error);
      }
    }

    // MailChannels provider (fallback HTTP API)
    try {
      const mailChannels = new MailChannelsProvider();
      this.providers.set('mailchannels', mailChannels);
      this.providerConfigs.set('mailchannels', {
        id: 'mailchannels',
        name: 'MailChannels',
        type: 'sendgrid',
        isActive: true,
        priority: this.sendEmailBinding ? 2 : 1, // Lower priority if Cloudflare Email is available
        config: {},
        dailyLimit: 5000,
        dailySent: 0,
        lastResetDate: new Date(),
        healthStatus: 'healthy',
        lastHealthCheck: new Date()
      });
      console.log('✅ MailChannels provider loaded');
    } catch (e) {
      console.warn('⚠️ Failed to init MailChannels provider', e);
    }

    // SendGrid provider
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sendGridProvider = new SendGridProvider({
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL,
          fromName: process.env.SENDGRID_FROM_NAME
        });

        this.providers.set('sendgrid', sendGridProvider);
        this.providerConfigs.set('sendgrid', {
          id: 'sendgrid',
          name: 'SendGrid',
          type: 'sendgrid',
          isActive: true,
          priority: 1,
          config: { apiKey: process.env.SENDGRID_API_KEY },
          dailyLimit: 100000,
          dailySent: 0,
          lastResetDate: new Date(),
          healthStatus: 'healthy',
          lastHealthCheck: new Date()
        });

        console.log('✅ SendGrid provider loaded from environment');
      } catch (error) {
        console.error('❌ Failed to load SendGrid provider:', error);
      }
    }

    // Mailgun provider
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      try {
        const mailgunProvider = new MailgunProvider({
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN,
          region: (process.env.MAILGUN_REGION as 'us' | 'eu') || 'us'
        });

        this.providers.set('mailgun', mailgunProvider);
        this.providerConfigs.set('mailgun', {
          id: 'mailgun',
          name: 'Mailgun',
          type: 'mailgun',
          isActive: true,
          priority: 2,
          config: {
            apiKey: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN,
            region: process.env.MAILGUN_REGION || 'us'
          },
          dailyLimit: 10000,
          dailySent: 0,
          lastResetDate: new Date(),
          healthStatus: 'healthy',
          lastHealthCheck: new Date()
        });

        console.log('✅ Mailgun provider loaded from environment');
      } catch (error) {
        console.error('❌ Failed to load Mailgun provider:', error);
      }
    }

    // Log available providers
    console.log(`📧 Email service initialized with ${this.providers.size} provider(s):`,
      Array.from(this.providers.keys()).join(', '));
  }

  /**
   * Send email using queue system (recommended)
   */
  async sendEmail(
    emailData: EmailData,
    userId: number,
    options: SendEmailOptions = {}
  ): Promise<string> {
    this.ensureInitialized();
    return await emailQueueService.addToQueue(emailData, userId, options);
  }

  /**
   * Send email directly without queue (for immediate sending)
   */
  async sendEmailDirect(
    emailData: EmailData,
    userId: number,
    providerId: string = 'auto'
  ): Promise<EmailSendResult> {
    this.ensureInitialized();
    const selectedProvider = await this.selectProvider(providerId, userId);
    
    if (!selectedProvider) {
      throw new Error('No available email provider');
    }

    console.log(`📧 Sending email via ${selectedProvider.name} (${selectedProvider.id})`);
    
    try {
      const result = await selectedProvider.send(emailData);
      
      if (result.success) {
        console.log(`✅ Email sent successfully via ${selectedProvider.name}: ${result.messageId}`);
        
        // Update provider stats
        const config = this.providerConfigs.get(selectedProvider.id);
        if (config) {
          config.dailySent++;
          config.healthStatus = 'healthy';
          config.lastHealthCheck = new Date();
        }
      } else {
        console.error(`❌ Email failed via ${selectedProvider.name}:`, result.error);
        
        // Try fallback provider if available and error is not retryable
        if (!result.error?.retryable) {
          const fallbackProvider = await this.selectFallbackProvider(selectedProvider.id, userId);
          if (fallbackProvider) {
            console.log(`🔄 Trying fallback provider: ${fallbackProvider.name}`);
            return await fallbackProvider.send(emailData);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`💥 Email provider error (${selectedProvider.name}):`, error);
      
      // Try fallback provider
      const fallbackProvider = await this.selectFallbackProvider(selectedProvider.id, userId);
      if (fallbackProvider) {
        console.log(`🔄 Trying fallback provider: ${fallbackProvider.name}`);
        return await fallbackProvider.send(emailData);
      }
      
      throw error;
    }
  }

  /**
   * Send bulk emails with batching and rate limiting
   */
  async sendBulkEmails(
    emails: { emailData: EmailData; userId: number }[],
    options: BulkEmailOptions = {}
  ): Promise<string[]> {
    const {
      batchSize = 50,
      delayBetweenBatches = 1000,
      priority = 'normal',
      suppressDuplicates = true
    } = options;

    const queueIds: string[] = [];
    const processedEmails = new Set<string>();

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      for (const { emailData, userId } of batch) {
        // Skip duplicates if requested
        if (suppressDuplicates) {
          const emailKey = `${userId}:${emailData.to.join(',')}:${emailData.subject}`;
          if (processedEmails.has(emailKey)) {
            continue;
          }
          processedEmails.add(emailKey);
        }

        const queueId = await emailQueueService.addToQueue(emailData, userId, {
          priority,
          ...options
        });
        queueIds.push(queueId);
      }

      // Delay between batches to avoid overwhelming the system
      if (i + batchSize < emails.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`📧 Queued ${queueIds.length} bulk emails in ${Math.ceil(emails.length / batchSize)} batches`);
    return queueIds;
  }

  /**
   * Select the best available provider
   */
  private async selectProvider(providerId: string, userId: number): Promise<IEmailProvider | null> {
    // If specific provider requested
    if (providerId !== 'auto') {
      const provider = this.providers.get(providerId);
      if (provider && this.isProviderAvailable(providerId)) {
        return provider;
      }
    }

    // Get user's custom SMTP settings
    const userProvider = await this.getUserSMTPProvider(userId);
    if (userProvider && this.isProviderAvailable(userProvider.id)) {
      return userProvider;
    }

    // Select best available provider by priority
    const availableProviders = Array.from(this.providerConfigs.values())
      .filter(config => 
        config.isActive && 
        this.isProviderAvailable(config.id) &&
        this.providers.has(config.id)
      )
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length > 0) {
      return this.providers.get(availableProviders[0].id) || null;
    }

    return null;
  }

  /**
   * Select fallback provider (different from the failed one)
   */
  private async selectFallbackProvider(
    failedProviderId: string, 
    userId: number
  ): Promise<IEmailProvider | null> {
    const availableProviders = Array.from(this.providerConfigs.values())
      .filter(config => 
        config.id !== failedProviderId &&
        config.isActive && 
        this.isProviderAvailable(config.id) &&
        this.providers.has(config.id)
      )
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length > 0) {
      return this.providers.get(availableProviders[0].id) || null;
    }

    return null;
  }

  /**
   * Check if provider is available (not rate limited, healthy)
   */
  private isProviderAvailable(providerId: string): boolean {
    const config = this.providerConfigs.get(providerId);
    if (!config) return false;

    // Check daily limits
    if (config.dailyLimit && config.dailySent >= config.dailyLimit) {
      return false;
    }

    // Check health status
    if (config.healthStatus === 'down') {
      return false;
    }

    return true;
  }

  /**
   * Get user's custom SMTP provider
   */
  private async getUserSMTPProvider(userId: number): Promise<IEmailProvider | null> {
    try {
      // This would fetch user's SMTP settings from database
      // For now, return null - will be implemented when we add user settings
      return null;
    } catch (error) {
      console.error('❌ Failed to get user SMTP settings:', error);
      return null;
    }
  }

  /**
   * Add or update email provider
   */
  addProvider(provider: IEmailProvider, config: EmailProvider): void {
    this.providers.set(provider.id, provider);
    this.providerConfigs.set(provider.id, config);
    console.log(`✅ Email provider added: ${provider.name} (${provider.id})`);
  }

  /**
   * Remove email provider
   */
  removeProvider(providerId: string): boolean {
    const removed = this.providers.delete(providerId) && this.providerConfigs.delete(providerId);
    if (removed) {
      console.log(`🗑️ Email provider removed: ${providerId}`);
    }
    return removed;
  }

  /**
   * Get all providers status
   */
  async getProvidersStatus(): Promise<Array<{
    id: string;
    name: string;
    isActive: boolean;
    healthStatus: string;
    dailySent: number;
    dailyLimit?: number;
    statistics: any;
  }>> {
    const status = [];

    for (const [id, config] of this.providerConfigs.entries()) {
      const provider = this.providers.get(id);
      const statistics = provider ? await provider.getStatistics() : null;

      status.push({
        id: config.id,
        name: config.name,
        isActive: config.isActive,
        healthStatus: config.healthStatus,
        dailySent: config.dailySent,
        dailyLimit: config.dailyLimit,
        statistics
      });
    }

    return status;
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing email provider health checks...');

    for (const [id, provider] of this.providers.entries()) {
      try {
        const healthCheck = await provider.healthCheck();
        const config = this.providerConfigs.get(id);
        
        if (config) {
          config.healthStatus = healthCheck.status;
          config.lastHealthCheck = healthCheck.lastChecked;
        }

        console.log(`🏥 ${provider.name}: ${healthCheck.status} (${healthCheck.responseTime}ms)`);
      } catch (error) {
        console.error(`❌ Health check failed for ${provider.name}:`, error);
        
        const config = this.providerConfigs.get(id);
        if (config) {
          config.healthStatus = 'down';
          config.lastHealthCheck = new Date();
        }
      }
    }
  }

  /**
   * Reset daily counters for all providers
   */
  resetDailyCounters(): void {
    for (const config of this.providerConfigs.values()) {
      config.dailySent = 0;
      config.lastResetDate = new Date();
    }

    for (const provider of this.providers.values()) {
      if ('resetDailyCounters' in provider) {
        (provider as any).resetDailyCounters();
      }
    }

    console.log('🔄 Daily counters reset for all email providers');
  }
}
