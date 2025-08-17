import { BaseEmailProvider, EmailSendResult, ProviderLimits } from './IEmailProvider';
import { EmailData, SendGridConfig } from '../../types/email';

/**
 * SendGrid Email Provider for Cloudflare Workers
 * Professional email delivery service with high deliverability
 * Uses fetch API for Cloudflare Workers compatibility
 */
export class SendGridProvider extends BaseEmailProvider {
  readonly id = 'sendgrid';
  readonly name = 'SendGrid';

  private config: SendGridConfig;
  private readonly SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

  constructor(config: SendGridConfig) {
    super();
    this.config = config;
    console.log('📧 SendGrid Provider initialized (Cloudflare Workers mode)');
  }

  /**
   * Send email via SendGrid using fetch API
   */
  async send(emailData: EmailData): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      this.validateEmailData(emailData);

      // Build SendGrid API payload
      const payload = {
        personalizations: [{
          to: emailData.to.map(email => ({ email })),
          cc: emailData.cc?.map(email => ({ email })),
          bcc: emailData.bcc?.map(email => ({ email })),
          subject: emailData.subject,
          custom_args: emailData.metadata || {}
        }],
        from: {
          email: emailData.from,
          name: emailData.fromName || this.config.fromName
        },
        content: [
          ...(emailData.text ? [{ type: 'text/plain', value: emailData.text }] : []),
          ...(emailData.html ? [{ type: 'text/html', value: emailData.html }] : [])
        ],
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : btoa(String.fromCharCode(...new Uint8Array(att.content as ArrayBuffer))),
          type: att.contentType,
          disposition: att.disposition || 'attachment',
          content_id: att.contentId
        })),
        tracking_settings: {
          click_tracking: {
            enable: emailData.trackClicks || false
          },
          open_tracking: {
            enable: emailData.trackOpens || false
          }
        },
        categories: emailData.tags || []
      };

      // Send via SendGrid API
      const response = await fetch(this.SENDGRID_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.recordSuccess(responseTime);

        return {
          success: true,
          messageId: response.headers.get('x-message-id') || `sendgrid-${Date.now()}`,
          providerId: this.id,
          timestamp: new Date(),
          metadata: {
            statusCode: response.status,
            responseTime
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this.extractErrorMessage(errorData);

        this.recordError({
          timestamp: new Date(),
          code: `HTTP_${response.status}`,
          message: errorMessage,
          retryable: this.isRetryableError({ response: { status: response.status } })
        });

        return {
          success: false,
          providerId: this.id,
          timestamp: new Date(),
          metadata: { responseTime, statusCode: response.status },
          error: {
            code: `HTTP_${response.status}`,
            message: errorMessage,
            retryable: this.isRetryableError({ response: { status: response.status } })
          }
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown SendGrid error';

      this.recordError({
        timestamp: new Date(),
        code: 'NETWORK_ERROR',
        message: errorMessage,
        retryable: true
      });

      return {
        success: false,
        providerId: this.id,
        timestamp: new Date(),
        metadata: { responseTime },
        error: {
          code: 'NETWORK_ERROR',
          message: errorMessage,
          retryable: true
        }
      };
    }
  }

  /**
   * Verify SendGrid API key using fetch
   */
  async verify(): Promise<boolean> {
    try {
      // Test with sandbox mode to avoid sending actual email
      const testPayload = {
        personalizations: [{
          to: [{ email: 'test@example.com' }],
          subject: 'Test'
        }],
        from: {
          email: this.config.fromEmail || 'test@example.com'
        },
        content: [{
          type: 'text/plain',
          value: 'Test'
        }],
        mail_settings: {
          sandbox_mode: {
            enable: true
          }
        }
      };

      const response = await fetch(this.SENDGRID_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ SendGrid verification failed:', error);
      return false;
    }
  }

  /**
   * Get SendGrid provider limits
   */
  getLimits(): ProviderLimits {
    return {
      // SendGrid limits vary by plan
      dailyLimit: 100000, // Adjust based on your plan
      hourlyLimit: 10000,
      perSecondLimit: 100,
      maxRecipients: 1000,
      maxAttachmentSize: 30 * 1024 * 1024, // 30MB
      maxEmailSize: 30 * 1024 * 1024 // 30MB
    };
  }

  /**
   * Extract error message from SendGrid error
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.body?.errors) {
      return error.response.body.errors.map((e: any) => e.message).join(', ');
    }

    if (error.response?.body?.message) {
      return error.response.body.message;
    }

    if (error.message) {
      return error.message;
    }

    return 'Unknown SendGrid error';
  }

  /**
   * Get error code from SendGrid error
   */
  private getErrorCode(error: any): string {
    if (error.code) {
      return error.code;
    }

    if (error.response?.status) {
      return `HTTP_${error.response.status}`;
    }

    if (error.response?.body?.errors?.[0]?.field) {
      return `FIELD_${error.response.body.errors[0].field.toUpperCase()}`;
    }

    return 'SENDGRID_ERROR';
  }

  /**
   * Determine if SendGrid error is retryable
   */
  private isRetryableError(error: any): boolean {
    const status = error.response?.status;
    
    if (!status) {
      return true; // Network errors are typically retryable
    }

    // 5xx errors are server errors and retryable
    if (status >= 500) {
      return true;
    }

    // 429 is rate limiting, retryable
    if (status === 429) {
      return true;
    }

    // 4xx errors are typically client errors and not retryable
    return false;
  }

  /**
   * Update SendGrid configuration
   */
  updateConfig(config: SendGridConfig): void {
    this.config = config;
    this.initializeSendGrid();
  }

  /**
   * Get SendGrid statistics from API
   */
  async getSendGridStats(): Promise<any> {
    try {
      // This would require additional SendGrid API calls
      // For now, return local statistics
      return await this.getStatistics();
    } catch (error) {
      console.error('❌ Failed to get SendGrid stats:', error);
      return null;
    }
  }

  /**
   * Get API key info (masked for security)
   */
  getApiKeyInfo(): string {
    const key = this.config.apiKey;
    if (key.length > 8) {
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }
    return '****';
  }
}
