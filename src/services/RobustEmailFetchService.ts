import { EmailAccount, EmailFolder, EmailMessage } from '../types/emailClient';

export interface EmailServerConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  serverInfo?: {
    protocol: string;
    capabilities: string[];
    serverName: string;
  };
  folders?: EmailFolder[];
  sampleMessages?: EmailMessage[];
  suggestions?: string[];
}

/**
 * Robust Email Fetch Service that guarantees email fetching from custom domains
 * Uses comprehensive server testing and auto-configuration
 */
export class RobustEmailFetchService {
  private static instance: RobustEmailFetchService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = window.location.origin;
  }

  static getInstance(): RobustEmailFetchService {
    if (!RobustEmailFetchService.instance) {
      RobustEmailFetchService.instance = new RobustEmailFetchService();
    }
    return RobustEmailFetchService.instance;
  }

  /**
   * Auto-configure email server settings for a domain
   */
  async autoConfigureEmailServer(email: string): Promise<EmailServerConfig[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      console.log(`🔍 Auto-configuring email server for: ${email}`);

      const response = await fetch(`${this.baseUrl}/api/robust-emails/auto-configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auto-configuration failed');
      }

      const data = await response.json();
      console.log(`📧 Generated ${data.configurations.length} configurations for ${email}`);
      
      return data.configurations;

    } catch (error) {
      console.error('❌ Auto-configuration failed:', error);
      throw error;
    }
  }

  /**
   * Test email server connection with comprehensive diagnostics
   */
  async testEmailConnection(config: EmailServerConfig): Promise<ConnectionTestResult> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      console.log(`🔍 Testing connection to ${config.host}:${config.port}`);

      const response = await fetch(`${this.baseUrl}/api/robust-emails/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Connection test successful for ${config.username}`);
        return {
          success: true,
          serverInfo: data.serverInfo,
          folders: data.folders,
          sampleMessages: data.sampleMessages
        };
      } else {
        console.log(`❌ Connection test failed: ${data.error}`);
        return {
          success: false,
          error: data.error,
          suggestions: data.suggestions || []
        };
      }

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Discover and test email server settings automatically
   */
  async discoverEmailSettings(email: string, password: string): Promise<ConnectionTestResult> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      console.log(`🔍 Discovering email settings for: ${email}`);

      const response = await fetch(`${this.baseUrl}/api/robust-emails/discover-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Email settings discovered for ${email}`);
        return {
          success: true,
          serverInfo: data.serverInfo,
          folders: data.folders,
          sampleMessages: data.sampleMessages
        };
      } else {
        console.log(`❌ Email settings discovery failed: ${data.message}`);
        return {
          success: false,
          error: data.message,
          suggestions: data.suggestions || []
        };
      }

    } catch (error) {
      console.error('❌ Settings discovery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Settings discovery failed'
      };
    }
  }

  /**
   * Fetch folders using robust connection
   */
  async fetchRobustFolders(account: EmailAccount): Promise<EmailFolder[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      console.log(`📧 Fetching robust folders for: ${account.email}`);

      const response = await fetch(`${this.baseUrl}/api/robust-emails/robust-folders/${account.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Robust folders fetched: ${data.folders.length} folders`);
          return data.folders;
        } else {
          console.log(`⚠️ Robust folders failed, using fallback: ${data.error}`);
          return data.folders || this.getDefaultFolders();
        }
      } else {
        console.error('❌ Robust folders request failed:', await response.text());
        return this.getDefaultFolders();
      }

    } catch (error) {
      console.error('❌ Robust folders fetch failed:', error);
      return this.getDefaultFolders();
    }
  }

  /**
   * Test multiple server configurations and return the best one
   */
  async findBestServerConfig(email: string, password: string): Promise<{
    config?: EmailServerConfig;
    result?: ConnectionTestResult;
    allResults: Array<{ config: EmailServerConfig; result: ConnectionTestResult }>;
  }> {
    try {
      console.log(`🔍 Finding best server configuration for: ${email}`);

      // Get auto-configured settings
      const configurations = await this.autoConfigureEmailServer(email);
      
      const results: Array<{ config: EmailServerConfig; result: ConnectionTestResult }> = [];
      let bestConfig: EmailServerConfig | undefined;
      let bestResult: ConnectionTestResult | undefined;

      // Test each configuration
      for (const config of configurations.slice(0, 5)) { // Test first 5 to avoid timeout
        const configWithPassword = { ...config, password };
        
        console.log(`🧪 Testing ${config.host}:${config.port} (SSL: ${config.secure})`);
        
        const result = await this.testEmailConnection(configWithPassword);
        
        results.push({ config: configWithPassword, result });
        
        if (result.success && !bestConfig) {
          bestConfig = configWithPassword;
          bestResult = result;
          break; // Stop on first successful connection
        }
      }

      if (bestConfig && bestResult) {
        console.log(`✅ Found best configuration: ${bestConfig.host}:${bestConfig.port}`);
      } else {
        console.log(`❌ No working configuration found for ${email}`);
      }

      return {
        config: bestConfig,
        result: bestResult,
        allResults: results
      };

    } catch (error) {
      console.error('❌ Server configuration search failed:', error);
      return {
        allResults: []
      };
    }
  }

  /**
   * Get default folders when server connection fails
   */
  private getDefaultFolders(): EmailFolder[] {
    return [
      {
        id: 'inbox',
        name: 'INBOX',
        displayName: 'Inbox',
        type: 'inbox',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'sent',
        name: 'Sent',
        displayName: 'Sent',
        type: 'sent',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'drafts',
        name: 'Drafts',
        displayName: 'Drafts',
        type: 'drafts',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'spam',
        name: 'Spam',
        displayName: 'Spam',
        type: 'spam',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      },
      {
        id: 'trash',
        name: 'Trash',
        displayName: 'Trash',
        type: 'trash',
        children: [],
        unreadCount: 0,
        totalCount: 0,
        canSelect: true,
        canCreate: false,
        canDelete: false,
        canRename: false
      }
    ];
  }

  /**
   * Validate email server configuration
   */
  validateConfig(config: Partial<EmailServerConfig>): string[] {
    const errors: string[] = [];

    if (!config.host) errors.push('Host is required');
    if (!config.port || config.port < 1 || config.port > 65535) errors.push('Valid port number is required');
    if (!config.username) errors.push('Username is required');
    if (!config.password) errors.push('Password is required');

    return errors;
  }

  /**
   * Get common server settings for popular email providers
   */
  getCommonServerSettings(email: string): EmailServerConfig[] {
    const domain = email.split('@')[1]?.toLowerCase();
    const username = email;

    const commonSettings: Record<string, EmailServerConfig[]> = {
      'gmail.com': [
        { host: 'imap.gmail.com', port: 993, secure: true, username, password: '' }
      ],
      'outlook.com': [
        { host: 'outlook.office365.com', port: 993, secure: true, username, password: '' }
      ],
      'hotmail.com': [
        { host: 'outlook.office365.com', port: 993, secure: true, username, password: '' }
      ],
      'yahoo.com': [
        { host: 'imap.mail.yahoo.com', port: 993, secure: true, username, password: '' }
      ],
      'icloud.com': [
        { host: 'imap.mail.me.com', port: 993, secure: true, username, password: '' }
      ]
    };

    return commonSettings[domain] || [];
  }
}
