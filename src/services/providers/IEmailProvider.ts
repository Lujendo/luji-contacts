import { EmailData, ProviderHealthCheck } from '../../types/email';

/**
 * Interface for all email providers
 */
export interface IEmailProvider {
  /**
   * Provider identifier
   */
  readonly id: string;

  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Send an email
   */
  send(emailData: EmailData): Promise<EmailSendResult>;

  /**
   * Verify provider configuration and connectivity
   */
  verify(): Promise<boolean>;

  /**
   * Check provider health status
   */
  healthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Get provider-specific sending limits
   */
  getLimits(): ProviderLimits;

  /**
   * Get provider statistics
   */
  getStatistics(): Promise<ProviderStatistics>;
}

/**
 * Result of email sending operation
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  providerId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/**
 * Provider sending limits
 */
export interface ProviderLimits {
  dailyLimit?: number;
  hourlyLimit?: number;
  perSecondLimit?: number;
  maxRecipients?: number;
  maxAttachmentSize?: number; // in bytes
  maxEmailSize?: number; // in bytes
}

/**
 * Provider statistics
 */
export interface ProviderStatistics {
  totalSent: number;
  successRate: number;
  averageResponseTime: number;
  lastUsed?: Date;
  dailySent: number;
  errors: {
    total: number;
    recent: ProviderError[];
  };
}

/**
 * Provider error information
 */
export interface ProviderError {
  timestamp: Date;
  code: string;
  message: string;
  retryable: boolean;
}

/**
 * Base email provider class
 */
export abstract class BaseEmailProvider implements IEmailProvider {
  protected statistics: ProviderStatistics = {
    totalSent: 0,
    successRate: 100,
    averageResponseTime: 0,
    dailySent: 0,
    errors: {
      total: 0,
      recent: []
    }
  };

  protected responseTimes: number[] = [];
  protected readonly MAX_RECENT_ERRORS = 10;

  abstract readonly id: string;
  abstract readonly name: string;

  abstract send(emailData: EmailData): Promise<EmailSendResult>;
  abstract verify(): Promise<boolean>;
  abstract getLimits(): ProviderLimits;

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.verify();
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.id,
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        providerId: this.id,
        status: 'down',
        responseTime,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider statistics
   */
  async getStatistics(): Promise<ProviderStatistics> {
    return { ...this.statistics };
  }

  /**
   * Record successful send
   */
  protected recordSuccess(responseTime: number): void {
    this.statistics.totalSent++;
    this.statistics.dailySent++;
    this.statistics.lastUsed = new Date();
    
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.updateAverageResponseTime();
    this.updateSuccessRate();
  }

  /**
   * Record failed send
   */
  protected recordError(error: ProviderError): void {
    this.statistics.errors.total++;
    this.statistics.errors.recent.push(error);
    
    if (this.statistics.errors.recent.length > this.MAX_RECENT_ERRORS) {
      this.statistics.errors.recent.shift();
    }
    
    this.updateSuccessRate();
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.statistics.averageResponseTime = sum / this.responseTimes.length;
    }
  }

  /**
   * Update success rate
   */
  private updateSuccessRate(): void {
    const totalAttempts = this.statistics.totalSent + this.statistics.errors.total;
    if (totalAttempts > 0) {
      this.statistics.successRate = (this.statistics.totalSent / totalAttempts) * 100;
    }
  }

  /**
   * Reset daily counters (should be called daily)
   */
  resetDailyCounters(): void {
    this.statistics.dailySent = 0;
  }

  /**
   * Validate email data before sending
   */
  protected validateEmailData(emailData: EmailData): void {
    if (!emailData.to || emailData.to.length === 0) {
      throw new Error('No recipients specified');
    }

    if (!emailData.subject || emailData.subject.trim() === '') {
      throw new Error('Subject is required');
    }

    if (!emailData.html && !emailData.text) {
      throw new Error('Email content (HTML or text) is required');
    }

    if (!emailData.from) {
      throw new Error('From address is required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of emailData.to) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid recipient email: ${email}`);
      }
    }

    if (emailData.cc) {
      for (const email of emailData.cc) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid CC email: ${email}`);
        }
      }
    }

    if (emailData.bcc) {
      for (const email of emailData.bcc) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid BCC email: ${email}`);
        }
      }
    }

    if (!emailRegex.test(emailData.from)) {
      throw new Error(`Invalid from email: ${emailData.from}`);
    }
  }

  /**
   * Check if provider has reached its limits
   */
  isLimitReached(): boolean {
    const limits = this.getLimits();
    
    if (limits.dailyLimit && this.statistics.dailySent >= limits.dailyLimit) {
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining capacity for today
   */
  getRemainingCapacity(): number | null {
    const limits = this.getLimits();
    
    if (limits.dailyLimit) {
      return Math.max(0, limits.dailyLimit - this.statistics.dailySent);
    }
    
    return null; // Unlimited
  }
}
