# Immediate Email Infrastructure Implementation

## 🚀 **Phase 1: Enhanced Email Reliability (Week 1)**

### **1.1 Email Queue System Implementation**

```typescript
// src/types/email.ts
export interface EmailQueueItem {
  id: string;
  userId: number;
  priority: 'high' | 'normal' | 'low';
  scheduledAt: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
  };
  providerId: string;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailProvider {
  id: string;
  name: string;
  type: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
  isActive: boolean;
  priority: number;
  config: any;
  dailyLimit?: number;
  dailySent: number;
  lastResetDate: Date;
}
```

### **1.2 Enhanced Email Service**

```typescript
// src/services/EmailService.ts
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import Mailgun from 'mailgun.js';

export class EmailService {
  private providers: Map<string, EmailProvider> = new Map();
  private queue: EmailQueueItem[] = [];
  private isProcessing = false;

  constructor() {
    this.initializeProviders();
    this.startQueueProcessor();
  }

  async sendEmail(emailData: EmailData, userId: number): Promise<string> {
    const queueItem: EmailQueueItem = {
      id: generateId(),
      userId,
      priority: 'normal',
      scheduledAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      emailData,
      providerId: await this.selectProvider(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.addToQueue(queueItem);
    return queueItem.id;
  }

  private async selectProvider(userId: number): Promise<string> {
    const userSettings = await this.getUserEmailSettings(userId);
    
    // Priority order: User SMTP > SendGrid > Mailgun > Default SMTP
    if (userSettings?.smtp_host) {
      return 'user-smtp';
    }
    
    const activeProviders = Array.from(this.providers.values())
      .filter(p => p.isActive && !this.isProviderLimitReached(p))
      .sort((a, b) => a.priority - b.priority);
    
    return activeProviders[0]?.id || 'default-smtp';
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingItems = this.queue
        .filter(item => item.status === 'pending' && item.scheduledAt <= new Date())
        .sort((a, b) => this.getPriorityValue(a.priority) - this.getPriorityValue(b.priority));

      for (const item of pendingItems) {
        await this.processQueueItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processQueueItem(item: EmailQueueItem): Promise<void> {
    item.status = 'processing';
    item.updatedAt = new Date();

    try {
      const provider = this.providers.get(item.providerId);
      if (!provider) {
        throw new Error(`Provider ${item.providerId} not found`);
      }

      await this.sendWithProvider(item.emailData, provider);
      
      item.status = 'sent';
      item.sentAt = new Date();
      
      // Update provider stats
      provider.dailySent++;
      
      // Log success
      await this.logEmailSent(item);
      
    } catch (error) {
      item.retryCount++;
      item.errorMessage = error.message;
      
      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
        await this.logEmailFailed(item);
      } else {
        item.status = 'pending';
        item.scheduledAt = new Date(Date.now() + this.getRetryDelay(item.retryCount));
        
        // Try different provider on retry
        item.providerId = await this.selectAlternativeProvider(item.providerId, item.userId);
      }
    }
    
    item.updatedAt = new Date();
  }
}
```

### **1.3 Multiple Email Provider Support**

```typescript
// src/services/providers/SendGridProvider.ts
export class SendGridProvider implements IEmailProvider {
  constructor(private apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async send(emailData: EmailData): Promise<void> {
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    await sgMail.send(msg);
  }

  async verify(): Promise<boolean> {
    try {
      // Test API key validity
      await sgMail.send({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: { enable: true }
        }
      });
      return true;
    } catch {
      return false;
    }
  }
}

// src/services/providers/MailgunProvider.ts
export class MailgunProvider implements IEmailProvider {
  private mg: any;

  constructor(private apiKey: string, private domain: string) {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({ username: 'api', key: apiKey });
  }

  async send(emailData: EmailData): Promise<void> {
    await this.mg.messages.create(this.domain, {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });
  }
}
```

## 📊 **Phase 2: Email Analytics & Tracking (Week 2)**

### **2.1 Enhanced Email Model**

```sql
-- Enhanced email tracking tables
CREATE TABLE email_queue (
  id VARCHAR(36) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  priority ENUM('high', 'normal', 'low') DEFAULT 'normal',
  scheduled_at TIMESTAMP NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  email_data JSON NOT NULL,
  provider_id VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status_scheduled (status, scheduled_at),
  INDEX idx_user_status (user_id, status)
);

CREATE TABLE email_delivery_logs (
  id VARCHAR(36) PRIMARY KEY,
  email_queue_id VARCHAR(36),
  user_id INTEGER NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  status ENUM('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked') NOT NULL,
  provider_id VARCHAR(50),
  provider_message_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (email_queue_id) REFERENCES email_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_recipient_status (recipient_email, status)
);

CREATE TABLE email_providers (
  id VARCHAR(50) PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(100) NOT NULL,
  type ENUM('smtp', 'sendgrid', 'mailgun', 'ses', 'postmark') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  config JSON NOT NULL,
  daily_limit INTEGER,
  daily_sent INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_priority (priority)
);
```

### **2.2 Email Analytics API**

```typescript
// src/routes/emailAnalyticsRoutes.ts
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.id;
    
    const analytics = await EmailAnalyticsService.getOverview(userId, period);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/delivery-rates', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const userId = req.user.id;
    
    const deliveryRates = await EmailAnalyticsService.getDeliveryRates(userId, period);
    res.json(deliveryRates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// src/services/EmailAnalyticsService.ts
export class EmailAnalyticsService {
  static async getOverview(userId: number, period: string) {
    const dateRange = this.parsePeriod(period);
    
    const [totalSent, delivered, bounced, opened] = await Promise.all([
      this.getTotalSent(userId, dateRange),
      this.getDelivered(userId, dateRange),
      this.getBounced(userId, dateRange),
      this.getOpened(userId, dateRange)
    ]);

    return {
      totalSent,
      delivered,
      bounced,
      opened,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0
    };
  }
}
```

## 🎨 **Phase 3: Email Templates & Rich Editor (Week 3)**

### **3.1 Email Template System**

```typescript
// src/models/EmailTemplate.ts
export interface EmailTemplate {
  id: string;
  userId: number;
  name: string;
  category: 'newsletter' | 'announcement' | 'personal' | 'marketing';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  isPublic: boolean;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'contact_field';
  defaultValue?: string;
  required: boolean;
  description?: string;
}
```

### **3.2 Template Processing Service**

```typescript
// src/services/TemplateService.ts
export class TemplateService {
  static async processTemplate(
    template: EmailTemplate, 
    contact: Contact, 
    customVariables: Record<string, any> = {}
  ): Promise<{ subject: string; html: string; text: string }> {
    
    const variables = {
      ...this.getContactVariables(contact),
      ...customVariables,
      ...this.getSystemVariables()
    };

    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.htmlContent, variables),
      text: this.replaceVariables(template.textContent, variables)
    };
  }

  private static getContactVariables(contact: Contact): Record<string, any> {
    return {
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      company: contact.company || '',
      phone: contact.phone || '',
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    };
  }

  private static replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }
}
```

## 🔧 **Implementation Steps**

### **Week 1: Core Infrastructure**
1. **Day 1-2**: Implement email queue system
2. **Day 3-4**: Add SendGrid and Mailgun providers
3. **Day 5**: Enhanced error handling and retry logic

### **Week 2: Analytics & Tracking**
1. **Day 1-2**: Database schema updates
2. **Day 3-4**: Analytics service implementation
3. **Day 5**: Analytics dashboard frontend

### **Week 3: Templates & Editor**
1. **Day 1-2**: Template system backend
2. **Day 3-4**: Rich email editor integration
3. **Day 5**: Template management UI

### **Week 4: Testing & Polish**
1. **Day 1-2**: Comprehensive testing
2. **Day 3-4**: Performance optimization
3. **Day 5**: Documentation and deployment

## 📦 **Required Dependencies**

```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    "mailgun.js": "^8.2.2",
    "aws-sdk": "^2.1490.0",
    "postmark": "^3.0.19",
    "handlebars": "^4.7.8",
    "react-email-editor": "^1.7.9",
    "bull": "^4.11.4",
    "ioredis": "^5.3.2"
  }
}
```

This implementation plan provides a solid foundation for professional-grade email infrastructure while building on the existing system.
