// Type definitions for the application

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'subscriber';
  contact_limit?: number;
  is_email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  birthday?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  groups?: GroupSummary[];
}

export interface Group {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  contacts?: Contact[];
  contact_count?: number;
}

export interface GroupSummary {
  id: number;
  name: string;
}

export interface GroupContact {
  id: number;
  group_id: number;
  contact_id: number;
  created_at?: string;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_pass?: string;
  from_email?: string;
  from_name?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plan {
  id: number;
  name: string;
  features?: string; // JSON string
  price?: number;
  billing_cycle?: 'monthly' | 'yearly';
  contact_limit?: number;
  is_email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ImportPreview {
  fileName: string;
  headers: string[];
  sampleData: string[][];
  totalRows: number;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  errors?: string[];
}

export interface ExportFile {
  fileName: string;
  downloadUrl: string;
  createdAt: string;
  size?: number;
  type: 'CSV' | 'VCF';
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

export interface GroupsResponse {
  groups: Group[];
  total: number;
}

export interface ExportFilesResponse {
  files: ExportFile[];
  total: number;
}

// Form types
export interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  birthday: string;
  website: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  company: string;
  job_title: string;
  notes: string;
}

export interface GroupFormData {
  name: string;
  description: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Search and filter types
export interface ContactFilters {
  search?: string;
  sort?: 'first_name' | 'last_name' | 'email' | 'created_at' | 'company';
  direction?: 'asc' | 'desc';
  groupId?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Component prop types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

// Utility types
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es' | 'fr' | 'de';

// API error types
export interface ApiError {
  error: string;
  details?: string[];
  status?: number;
}
