import { BaseEmailProvider, EmailSendResult, ProviderLimits } from './IEmailProvider';
import { EmailData, MailgunConfig } from '../../types/email';

/**
 * Mailgun Email Provider for Cloudflare Workers
 * Professional email delivery service using fetch API
 */
export class MailgunProvider extends BaseEmailProvider {
  readonly id = 'mailgun';
  readonly name = 'Mailgun';

  private config: MailgunConfig;
  private readonly baseUrl: string;

  constructor(config: MailgunConfig) {
    super();
    this.config = config;
    
    // Set base URL based on region
    const region = config.region || 'us';
    this.baseUrl = region === 'eu' 
      ? 'https://api.eu.mailgun.net/v3'
      : 'https://api.mailgun.net/v3';
    
    console.log(`📧 Mailgun Provider initialized (${region} region)`);
  }

  /**
   * Send email via Mailgun using fetch API
   */
  async send(emailData: EmailData): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      this.validateEmailData(emailData);

      // Build form data for Mailgun API
      const formData = new FormData();
      
      // Basic email fields
      formData.append('from', emailData.fromName 
        ? `${emailData.fromName} <${emailData.from}>`
        : emailData.from
      );
      
      // Recipients
      emailData.to.forEach(email => formData.append('to', email));
      if (emailData.cc) {
        emailData.cc.forEach(email => formData.append('cc', email));
      }
      if (emailData.bcc) {
        emailData.bcc.forEach(email => formData.append('bcc', email));
      }
      
      formData.append('subject', emailData.subject);
      
      if (emailData.html) {
        formData.append('html', emailData.html);
      }
      if (emailData.text) {
        formData.append('text', emailData.text);
      }

      // Tracking settings
      if (emailData.trackOpens) {
        formData.append('o:tracking-opens', 'true');
      }
      if (emailData.trackClicks) {
        formData.append('o:tracking-clicks', 'true');
      }

      // Tags
      if (emailData.tags) {
        emailData.tags.forEach(tag => formData.append('o:tag', tag));
      }

      // Custom variables (metadata)
      if (emailData.metadata) {
        Object.entries(emailData.metadata).forEach(([key, value]) => {
          formData.append(`v:${key}`, String(value));
        });
      }

      // Attachments
      if (emailData.attachments) {
        emailData.attachments.forEach((attachment, index) => {
          const blob = new Blob([attachment.content], { type: attachment.contentType });
          formData.append('attachment', blob, attachment.filename);
        });
      }

      // Send via Mailgun API
      const response = await fetch(`${this.baseUrl}/${this.config.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        },
        body: formData
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        this.recordSuccess(responseTime);

        return {
          success: true,
          messageId: responseData.id || `mailgun-${Date.now()}`,
          providerId: this.id,
          timestamp: new Date(),
          metadata: {
            statusCode: response.status,
            message: responseData.message,
            responseTime
          }
        };
      } else {
        const errorMessage = responseData.message || `HTTP ${response.status}`;
        
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown Mailgun error';
      
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
   * Verify Mailgun API key and domain
   */
  async verify(): Promise<boolean> {
    try {
      // Test domain validation endpoint
      const response = await fetch(`${this.baseUrl}/${this.config.domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Mailgun verification failed:', error);
      return false;
    }
  }

  /**
   * Get Mailgun provider limits
   */
  getLimits(): ProviderLimits {
    return {
      // Mailgun limits vary by plan
      dailyLimit: 10000, // Adjust based on your plan
      hourlyLimit: 1000,
      perSecondLimit: 10,
      maxRecipients: 1000,
      maxAttachmentSize: 25 * 1024 * 1024, // 25MB
      maxEmailSize: 25 * 1024 * 1024 // 25MB
    };
  }

  /**
   * Determine if Mailgun error is retryable
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
   * Update Mailgun configuration
   */
  updateConfig(config: MailgunConfig): void {
    this.config = config;
    console.log(`📧 Mailgun configuration updated for domain: ${config.domain}`);
  }

  /**
   * Get domain info (masked for security)
   */
  getDomainInfo(): string {
    return this.config.domain;
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
