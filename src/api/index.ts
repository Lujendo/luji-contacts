// Typed API service layer
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  ApiError,
  User,
  Contact,
  Group,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateContactRequest,
  UpdateContactRequest,
  CreateGroupRequest,
  UpdateGroupRequest,
  ContactsResponse,
  FileUploadResponse,
  BulkOperationResponse,
  ImportPreview,
  ImportResult,
} from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://luji-contacts.info-eac.workers.dev';

// Create axios instance with default configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createApiInstance();

// Helper function to extract data from API response
const extractData = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  return response.data.data as T;
};

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  if (error.response?.data) {
    const apiError: ApiError = error.response.data;
    throw new Error(apiError.error || apiError.message || 'API request failed');
  }
  throw new Error(error.message || 'Network error');
};

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/users/login', credentials);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/users/register', userData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await api.post<ApiResponse<{ valid: boolean; user?: User }>>('/users/verify-token', { token });
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/users/profile');
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>('/users/profile', userData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/users/password', { currentPassword, newPassword });
    } catch (error) {
      handleApiError(error);
    }
  },
};

// ============================================================================
// Contacts API
// ============================================================================

export const contactsApi = {
  async getContacts(params?: {
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: string;
    limit?: string;
    offset?: string;
  }): Promise<ApiResponse<Contact[]>> {
    try {
      const response = await api.get<ApiResponse<Contact[]>>('/contacts', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Legacy method for backward compatibility
  async getContactsLegacy(): Promise<Contact[]> {
    try {
      const response = await this.getContacts();
      return response.data || [];
    } catch (error) {
      handleApiError(error);
    }
  },

  async getContact(id: number): Promise<Contact> {
    try {
      const response = await api.get<ApiResponse<Contact>>(`/contacts/${id}`);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      const response = await api.post<ApiResponse<Contact>>('/contacts', contactData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async updateContact(id: number, contactData: UpdateContactRequest): Promise<Contact> {
    try {
      const response = await api.put<ApiResponse<Contact>>(`/contacts/${id}`, contactData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteContact(id: number): Promise<void> {
    try {
      await api.delete(`/contacts/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  async bulkDeleteContacts(contactIds: number[]): Promise<BulkOperationResponse> {
    try {
      const response = await api.post<ApiResponse<BulkOperationResponse>>('/contacts/bulk-delete', { contactIds });
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Group-related methods for contacts
  async getGroupContacts(groupId: number): Promise<Contact[]> {
    try {
      const response = await api.get<ApiResponse<Group>>(`/groups/${groupId}`);
      const group = extractData(response);
      return group.contacts || [];
    } catch (error) {
      handleApiError(error);
    }
  },

  async assignContactsToGroup(groupId: number, contactIds: number[]): Promise<BulkOperationResponse> {
    try {
      const response = await api.post<ApiResponse<BulkOperationResponse>>(
        `/groups/${groupId}/contacts/bulk`,
        { contactIds }
      );
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async removeContactsFromGroup(groupId: number, contactIds: number[]): Promise<BulkOperationResponse> {
    try {
      const response = await api.delete<ApiResponse<BulkOperationResponse>>(
        `/groups/${groupId}/contacts/bulk`,
        { data: { contactIds } }
      );
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async uploadProfileImage(
    contactId: number,
    file: File,
    onProgress?: (progress: number) => void,
    retries: number = 2
  ): Promise<FileUploadResponse> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Compress image if it's too large
        const processedFile = await compressImageIfNeeded(file);

        const formData = new FormData();
        formData.append('profile_image', processedFile);

        const response = await api.put<ApiResponse<FileUploadResponse>>(
          `/contacts/${contactId}/profile-image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for file uploads
            onUploadProgress: (progressEvent) => {
              if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
              }
            },
          }
        );
        return extractData(response);
      } catch (error) {
        // If this is the last attempt or it's not a network error, throw
        if (attempt === retries || !isRetryableError(error)) {
          handleApiError(error);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          if (onProgress) onProgress(0); // Reset progress for retry
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Upload failed after all retries');
  },
};

// Helper function to determine if an error is retryable
function isRetryableError(error: any): boolean {
  // Retry on network errors, timeouts, and 5xx server errors
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    error.code === 'NETWORK_ERROR' ||
    (error.response?.status >= 500 && error.response?.status < 600)
  );
}

// Helper function to compress images if needed
async function compressImageIfNeeded(file: File): Promise<File> {
    // If file is smaller than 1MB, return as-is
    if (file.size <= 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800x800)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };

      img.onerror = () => resolve(file); // Fallback to original
      img.src = URL.createObjectURL(file);
    });
}

// ============================================================================
// Groups API
// ============================================================================

export const groupsApi = {
  async getGroups(): Promise<Group[]> {
    try {
      const response = await api.get<ApiResponse<Group[]>>('/groups');
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getGroup(id: number): Promise<Group> {
    try {
      const response = await api.get<ApiResponse<Group>>(`/groups/${id}`);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    try {
      const response = await api.post<ApiResponse<Group>>('/groups', groupData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async updateGroup(id: number, groupData: UpdateGroupRequest): Promise<Group> {
    try {
      const response = await api.put<ApiResponse<Group>>(`/groups/${id}`, groupData);
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteGroup(id: number): Promise<void> {
    try {
      await api.delete(`/groups/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  async addContactsToGroup(groupId: number, contactIds: number[]): Promise<BulkOperationResponse> {
    try {
      const response = await api.post<ApiResponse<BulkOperationResponse>>(
        `/groups/${groupId}/contacts/bulk`,
        { contactIds }
      );
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },

  async removeContactsFromGroup(groupId: number, contactIds: number[]): Promise<BulkOperationResponse> {
    try {
      const response = await api.delete<ApiResponse<BulkOperationResponse>>(
        `/groups/${groupId}/contacts/bulk`,
        { data: { contactIds } }
      );
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },
};

// ============================================================================
// Export all APIs
// ============================================================================

export { api as default };
export type { ApiResponse, ApiError };
