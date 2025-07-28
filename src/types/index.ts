// Shared type definitions for the entire application
// Used by both frontend and backend for consistency

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  total?: number;
}

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  success: false;
}

// ============================================================================
// User Types
// ============================================================================

export type UserRole = 'admin' | 'user' | 'subscriber';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  contact_limit?: number;
  is_email_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  password?: string; // Only used server-side
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================================
// Contact Types
// ============================================================================

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
  // Frontend compatibility
  Groups?: GroupSummary[];
  groups?: GroupSummary[];
}

export interface CreateContactRequest {
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
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

// ============================================================================
// Group Types
// ============================================================================

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

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest extends Partial<CreateGroupRequest> {}

export interface GroupContact {
  id: number;
  group_id: number;
  contact_id: number;
  created_at?: string;
}

// ============================================================================
// Import/Export Types
// ============================================================================

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

export interface FieldMapping {
  [sourceField: string]: string;
}

// ============================================================================
// UI Component Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es' | 'fr' | 'de';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  search?: string;
  groups?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface ContactFormData extends CreateContactRequest {}

export interface GroupFormData extends CreateGroupRequest {}

export interface UserFormData {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadResponse {
  profile_image_url: string;
  contact?: Contact;
}

export interface BulkOperationResponse {
  addedCount?: number;
  removedCount?: number;
  deletedCount?: number;
  errors?: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ============================================================================
// Component Props Types
// ============================================================================

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

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type ContactEventHandler = (contact: Contact) => void;
export type GroupEventHandler = (group: Group) => void;
export type ErrorEventHandler = (error: Error | string) => void;
export type SuccessEventHandler = (message: string) => void;
