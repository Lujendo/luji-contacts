// Email settings interface for TypeScript
export interface EmailSettings {
  id?: number;
  user_id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  created_at?: Date;
  updated_at?: Date;
}

// Email settings form data interface
export interface EmailSettingsFormData {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
}

// Email settings update request interface
export interface UpdateEmailSettingsRequest {
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_pass?: string;
  from_email?: string;
  from_name?: string;
}
