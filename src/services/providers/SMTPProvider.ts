import { BaseEmailProvider, EmailSendResult, ProviderLimits } from './IEmailProvider';
import { EmailData, SMTPConfig } from '../../types/email';

/**
 * SMTP Email Provider for Cloudflare Workers
 * Note: Direct SMTP is not supported in Cloudflare Workers
 * This provider will use external email services as fallback
 */
export class SMTPProvider extends BaseEmailProvider {
  readonly id = 'smtp';
  readonly name = 'SMTP (External Service)';

  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    super();
    this.config = config;
    console.log(`📧 SMTP Provider initialized (external service mode): ${this.config.host}:${this.config.port}`);
  }

  /**
   * Send email via external SMTP service
   * Note: Cloudflare Workers doesn't support direct SMTP
   * This will return an error suggesting to use API-based providers
   */
  async send(emailData: EmailData): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      this.validateEmailData(emailData);

      // SMTP is not supported in Cloudflare Workers
      throw new Error('Direct SMTP is not supported in Cloudflare Workers. Please use SendGrid, Mailgun, or other API-based email providers.');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'SMTP not supported in Cloudflare Workers';

      this.recordError({
        timestamp: new Date(),
        code: 'SMTP_NOT_SUPPORTED',
        message: errorMessage,
        retryable: false
      });

      return {
        success: false,
        providerId: this.id,
        timestamp: new Date(),
        metadata: { responseTime },
        error: {
          code: 'SMTP_NOT_SUPPORTED',
          message: errorMessage,
          retryable: false
        }
      };
    }
  }

  /**
   * Verify SMTP connection
   * Note: Always returns false in Cloudflare Workers
   */
  async verify(): Promise<boolean> {
    console.log('❌ SMTP verification not supported in Cloudflare Workers');
    return false;
  }

  /**
   * Get SMTP provider limits
   */
  getLimits(): ProviderLimits {
    return {
      // SMTP typically doesn't have hard limits, but we set reasonable defaults
      dailyLimit: 10000,
      hourlyLimit: 1000,
      perSecondLimit: 10,
      maxRecipients: 100,
      maxAttachmentSize: 25 * 1024 * 1024, // 25MB
      maxEmailSize: 50 * 1024 * 1024 // 50MB
    };
  }

  /**
   * Build email headers for tracking and metadata
   */
  private buildHeaders(emailData: EmailData): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add custom headers for tracking
    if (emailData.trackOpens) {
      headers['X-Track-Opens'] = 'true';
    }

    if (emailData.trackClicks) {
      headers['X-Track-Clicks'] = 'true';
    }

    // Add tags as headers
    if (emailData.tags && emailData.tags.length > 0) {
      headers['X-Email-Tags'] = emailData.tags.join(',');
    }

    // Add metadata as headers
    if (emailData.metadata) {
      Object.entries(emailData.metadata).forEach(([key, value]) => {
        headers[`X-Metadata-${key}`] = String(value);
      });
    }

    // Add message ID for tracking
    headers['X-Email-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return headers;
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: any): string {
    if (error.code) {
      return error.code;
    }

    if (error.response) {
      return error.response.split(' ')[0] || 'SMTP_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'EAI_AGAIN'
    ];

    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }

    // Check SMTP response codes
    if (error.responseCode) {
      const code = parseInt(error.responseCode);
      // 4xx codes are typically temporary failures
      return code >= 400 && code < 500;
    }

    return false;
  }

  /**
   * Update SMTP configuration
   */
  updateConfig(config: SMTPConfig): void {
    this.config = config;
    
    // Close existing transporter
    if (this.transporter) {
      this.transporter.close();
    }
    
    // Initialize new transporter
    this.initializeTransporter();
  }

  /**
   * Close SMTP connections
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      console.log('📧 SMTP connections closed');
    }
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): {
    host: string;
    port: number;
    secure: boolean;
    user: string;
  } {
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.auth.user
    };
  }
}
