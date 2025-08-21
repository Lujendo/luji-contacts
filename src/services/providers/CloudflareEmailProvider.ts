/**
 * Cloudflare Email Provider using send_email binding
 * Uses Cloudflare's native email sending with MailChannels
 */

import { BaseEmailProvider, EmailSendResult, ProviderLimits } from './IEmailProvider';
import { EmailData } from '../../types/email';
import { createMimeMessage } from 'mimetext';
import { EmailMessage as CloudflareEmailMessage } from 'cloudflare:email';

export class CloudflareEmailProvider extends BaseEmailProvider {
  readonly id = 'cloudflare-email';
  readonly name = 'Cloudflare Email';
  private sendEmailBinding: any;

  constructor(sendEmailBinding?: any) {
    super();
    this.sendEmailBinding = sendEmailBinding;
    console.log('📧 Cloudflare Email provider initialized with send_email binding');
  }

  async send(emailData: EmailData): Promise<EmailSendResult> {
    const start = Date.now();
    try {
      this.validateEmailData(emailData);

      if (!this.sendEmailBinding) {
        throw new Error('send_email binding not available');
      }

      console.log('📧 Sending email via Cloudflare send_email binding:', {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from
      });

      // Create MIME message using mimetext
      const mimeMessage = createMimeMessage();
      
      // Set sender
      mimeMessage.setSender({
        name: emailData.fromName || emailData.from,
        addr: emailData.from
      });

      // Set primary recipient (send_email binding typically handles one recipient at a time)
      const primaryRecipient = emailData.to?.[0];
      if (!primaryRecipient) {
        throw new Error('No recipient specified');
      }

      mimeMessage.setRecipient(primaryRecipient);

      // Set CC recipients
      if (emailData.cc && emailData.cc.length > 0) {
        emailData.cc.forEach(recipient => {
          mimeMessage.setCc(recipient);
        });
      }

      // Set BCC recipients
      if (emailData.bcc && emailData.bcc.length > 0) {
        emailData.bcc.forEach(recipient => {
          mimeMessage.setBcc(recipient);
        });
      }

      // Set subject
      mimeMessage.setSubject(emailData.subject);

      // Add message content
      if (emailData.text) {
        mimeMessage.addMessage({
          contentType: 'text/plain',
          data: emailData.text
        });
      }

      if (emailData.html) {
        mimeMessage.addMessage({
          contentType: 'text/html',
          data: emailData.html
        });
      }

      // Add attachments if any
      if (emailData.attachments && emailData.attachments.length > 0) {
        emailData.attachments.forEach(attachment => {
          mimeMessage.addAttachment({
            filename: attachment.filename,
            contentType: attachment.contentType,
            data: attachment.content
          });
        });
      }

      // Create Cloudflare EmailMessage
      const cloudflareMessage = new CloudflareEmailMessage(
        emailData.from,
        primaryRecipient,
        mimeMessage.asRaw()
      );

      // Send via Cloudflare send_email binding
      await this.sendEmailBinding.send(cloudflareMessage);

      const responseTime = Date.now() - start;

      console.log('✅ Email sent successfully via Cloudflare send_email binding');
      
      return {
        success: true,
        providerId: this.id,
        timestamp: new Date(),
        metadata: { responseTime }
      };

    } catch (error) {
      const responseTime = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Cloudflare send_email binding error:', error);
      
      this.recordError({
        timestamp: new Date(),
        code: 'SEND_ERROR',
        message: errorMessage,
        retryable: false
      });

      return {
        success: false,
        providerId: this.id,
        timestamp: new Date(),
        metadata: { responseTime },
        error: {
          code: 'SEND_ERROR',
          message: errorMessage,
          retryable: false
        }
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test if send_email binding is available
      if (!this.sendEmailBinding) {
        console.error('send_email binding not available');
        return false;
      }
      
      console.log('Cloudflare send_email binding test: OK');
      return true;
    } catch (error) {
      console.error('Cloudflare send_email binding test failed:', error);
      return false;
    }
  }

  getLimits(): ProviderLimits {
    return {
      maxRecipientsPerEmail: 50,
      maxEmailsPerHour: 1000,
      maxEmailsPerDay: 10000,
      maxAttachmentSize: 25 * 1024 * 1024, // 25MB
      maxTotalAttachmentSize: 25 * 1024 * 1024 // 25MB
    };
  }

  getHealthStatus() {
    return {
      ...super.getHealthStatus(),
      bindingAvailable: !!this.sendEmailBinding
    };
  }
}
