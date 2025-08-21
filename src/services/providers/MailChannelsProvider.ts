import { BaseEmailProvider, EmailSendResult, ProviderLimits } from './IEmailProvider';
import { EmailData } from '../../types/email';

/**
 * MailChannels provider for Cloudflare Workers (native HTTP API)
 * Docs: https://github.com/mailchannels/mailchannels-api
 */
export class MailChannelsProvider extends BaseEmailProvider {
  readonly id = 'mailchannels';
  readonly name = 'MailChannels';

  constructor() {
    super();
    console.log('📧 MailChannels provider initialized');
  }

  async send(emailData: EmailData): Promise<EmailSendResult> {
    const start = Date.now();
    try {
      this.validateEmailData(emailData);

      const to = (emailData.to || []).map((e) => ({ email: e }));
      const cc = (emailData.cc || []).map((e) => ({ email: e }));
      const bcc = (emailData.bcc || []).map((e) => ({ email: e }));

      const body: any = {
        personalizations: [
          {
            to,
            ...(cc.length ? { cc } : {}),
            ...(bcc.length ? { bcc } : {})
          }
        ],
        from: {
          email: emailData.from,
          ...(emailData.fromName ? { name: emailData.fromName } : {})
        },
        subject: emailData.subject,
        content: [
          ...(emailData.text ? [{ type: 'text/plain', value: emailData.text }] : []),
          ...(emailData.html ? [{ type: 'text/html', value: emailData.html }] : [])
        ]
      };

      // Optional headers/tags could be mapped if needed

      const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const responseTime = Date.now() - start;

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        this.recordError({
          timestamp: new Date(),
          code: String(resp.status),
          message: `MailChannels error: ${resp.status} ${resp.statusText} ${text}`,
          retryable: resp.status >= 500
        });
        return {
          success: false,
          providerId: this.id,
          timestamp: new Date(),
          metadata: { responseTime },
          error: {
            code: String(resp.status),
            message: text || resp.statusText,
            retryable: resp.status >= 500
          }
        };
      }

      this.recordSuccess(responseTime);
      const messageId = resp.headers.get('x-message-id') || undefined;
      return {
        success: true,
        providerId: this.id,
        messageId,
        timestamp: new Date(),
        metadata: { responseTime }
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.recordError({ timestamp: new Date(), code: 'MAILCHANNELS_ERROR', message: msg, retryable: false });
      return {
        success: false,
        providerId: this.id,
        timestamp: new Date(),
        metadata: { responseTime },
        error: { code: 'MAILCHANNELS_ERROR', message: msg, retryable: false }
      };
    }
  }

  async verify(): Promise<boolean> {
    // No direct verification endpoint; assume healthy
    return true;
  }

  getLimits(): ProviderLimits {
    return {
      dailyLimit: 5000,
      hourlyLimit: 500,
      perSecondLimit: 25,
      maxRecipients: 100,
      maxAttachmentSize: 10 * 1024 * 1024,
      maxEmailSize: 25 * 1024 * 1024
    };
  }
}

