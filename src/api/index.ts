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
    page?: number;
    limit?: number;
  }): Promise<Contact[]> {
    try {
      const response = await api.get<ApiResponse<Contact[]>>('/contacts', { params });
      return extractData(response);
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

  async uploadProfileImage(contactId: number, file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      
      const response = await api.put<ApiResponse<FileUploadResponse>>(
        `/contacts/${contactId}/profile-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return extractData(response);
    } catch (error) {
      handleApiError(error);
    }
  },
};

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
