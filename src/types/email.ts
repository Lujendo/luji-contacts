// Enhanced Email Types for Professional Infrastructure

export interface EmailQueueItem {
  id: string;
  userId: number;
  priority: 'high' | 'normal' | 'low';
  scheduledAt: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  emailData: EmailData;
  providerId: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveryStatus?: 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateVariables?: Record<string, any>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailProvider {
  id: string;
  name: string;
  type: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark' | 'resend';
  isActive: boolean;
  priority: number;
  config: SMTPConfig | SendGridConfig | MailgunConfig | SESConfig;
  dailyLimit?: number;
  dailySent: number;
  lastResetDate: Date;
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: Date;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
}

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: 'us' | 'eu';
}

export interface SESConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface EmailTemplate {
  id: string;
  userId: number;
  name: string;
  category: 'newsletter' | 'announcement' | 'personal' | 'marketing' | 'transactional';
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
  type: 'text' | 'number' | 'date' | 'contact_field' | 'url' | 'email';
  defaultValue?: string;
  required: boolean;
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface EmailAnalytics {
  userId: number;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  totalSent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

export interface EmailDeliveryLog {
  id: string;
  emailQueueId: string;
  userId: number;
  recipientEmail: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'unsubscribed';
  providerId: string;
  providerMessageId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  bounceReason?: string;
  complaintType?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface EmailCampaign {
  id: string;
  userId: number;
  name: string;
  type: 'one-time' | 'recurring' | 'drip' | 'triggered';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  templateId: string;
  targetGroups: number[];
  targetContacts: number[];
  schedule: CampaignSchedule;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  frequency?: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  timeOfDay?: string;
  timezone?: string;
}

export interface CampaignMetrics {
  totalRecipients: number;
  emailsSent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  complaintRate: number;
}

export interface EmailSettings {
  userId: number;
  defaultFromEmail: string;
  defaultFromName: string;
  replyToEmail?: string;
  trackOpens: boolean;
  trackClicks: boolean;
  includeUnsubscribe: boolean;
  unsubscribeUrl?: string;
  customFooter?: string;
  emailSignature?: string;
  bounceHandling: boolean;
  complaintHandling: boolean;
  suppressionList: boolean;
  dataRetentionDays: number;
  requireDoubleOptIn: boolean;
  gdprCompliant: boolean;
}

export interface EmailSuppressionList {
  id: string;
  userId: number;
  email: string;
  reason: 'bounce' | 'complaint' | 'unsubscribe' | 'manual';
  addedAt: Date;
  metadata?: Record<string, any>;
}

export interface EmailWebhook {
  id: string;
  userId: number;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Email sending options
export interface SendEmailOptions {
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  providerId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Bulk email sending options
export interface BulkEmailOptions extends SendEmailOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  suppressDuplicates?: boolean;
  respectSuppressionList?: boolean;
}

// Email validation result
export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

// Email provider health check result
export interface ProviderHealthCheck {
  providerId: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
}

// Email queue statistics
export interface QueueStatistics {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
  totalToday: number;
  averageProcessingTime: number;
  successRate: number;
}

// Email provider statistics
export interface ProviderStatistics {
  providerId: string;
  totalSent: number;
  successRate: number;
  averageResponseTime: number;
  dailySent: number;
  dailyLimit?: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
}
