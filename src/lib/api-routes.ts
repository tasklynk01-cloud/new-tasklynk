/**
 * API Routes Configuration
 * 
 * Centralized API endpoint definitions for consistent usage across the application.
 * All endpoints use v2 API routes for standardized responses and error handling.
 * 
 * Usage:
 * ```typescript
 * import { API_ROUTES } from '@/lib/api-routes';
 * const response = await fetch(API_ROUTES.orders.list({ clientId: userId }));
 * ```
 */

/**
 * Helper to build query string from parameters
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * V2 API Routes (Preferred - Standardized responses)
 */
export const API_ROUTES = {
  auth: {
    login: () => '/api/v2/auth/login',
    logout: () => '/api/v2/auth/logout',
    register: () => '/api/v2/auth/register',
    me: () => '/api/v2/auth/me',
    refresh: () => '/api/v2/auth/refresh',
  },
  
  orders: {
    list: (params?: { clientId?: number; freelancerId?: number; status?: string; accountId?: number }) => 
      `/api/v2/orders${buildQueryString(params)}`,
    create: () => '/api/v2/orders',
    get: (id: number | string) => `/api/v2/orders/${id}`,
    update: (id: number | string) => `/api/v2/orders/${id}`,
    delete: (id: number | string) => `/api/v2/orders/${id}`,
    updateStatus: (id: number | string) => `/api/v2/orders/${id}/status`,
    assign: (id: number | string) => `/api/v2/orders/${id}/assign`,
    files: (id: number | string) => `/api/v2/orders/${id}/files`,
    uploadBrief: (id: number | string) => `/api/v2/orders/${id}/upload/brief`,
    uploadFinal: (id: number | string) => `/api/v2/orders/${id}/upload/final`,
    uploadDraft: (id: number | string) => `/api/v2/orders/${id}/upload/draft`,
    uploadRevision: (id: number | string) => `/api/v2/orders/${id}/upload/revision`,
    uploadAdditional: (id: number | string) => `/api/v2/orders/${id}/upload/additional`,
    messages: (id: number | string, params?: { userRole?: string; limit?: number }) => 
      `/api/v2/orders/${id}/messages${buildQueryString(params)}`,
    attachments: (id: number | string) => `/api/v2/orders/${id}/attachments`,
  },
  
  users: {
    list: (params?: { role?: string; approved?: boolean; suspended?: boolean }) => 
      `/api/v2/users${buildQueryString(params)}`,
    get: (id: number | string) => `/api/v2/users/${id}`,
    profile: (id: number | string) => `/api/v2/users/${id}/profile`,
    update: (id: number | string) => `/api/v2/users/${id}`,
    delete: (id: number | string) => `/api/v2/users/${id}`,
    summary: (id: number | string) => `/api/v2/users/${id}/summary`,
    profilePicture: (id: number | string) => `/api/v2/users/${id}/profile`,
    approve: (id: number | string) => `/api/v2/users/${id}/approve`,
    suspend: (id: number | string) => `/api/v2/users/${id}/suspend`,
  },
  
  payments: {
    list: (params?: { userId?: number; orderId?: number; status?: string }) => 
      `/api/v2/payments${buildQueryString(params)}`,
    create: () => '/api/v2/payments',
    get: (id: number | string) => `/api/v2/payments/${id}`,
    verify: (id: number | string) => `/api/v2/payments/${id}/verify`,
    webhook: () => '/api/v2/payments/webhook',
  },
  
  notifications: {
    list: (params?: { userId?: number; read?: boolean }) => 
      `/api/v2/notifications${buildQueryString(params)}`,
    get: (id: number | string) => `/api/v2/notifications/${id}`,
    markRead: (id: number | string) => `/api/v2/notifications/${id}`,
    markAllRead: () => '/api/v2/notifications/read-all',
  },
  
  messages: {
    list: (params?: { userId?: number; orderId?: number }) => 
      `/api/v2/messages${buildQueryString(params)}`,
    create: () => '/api/v2/messages',
    get: (id: number | string) => `/api/v2/messages/${id}`,
  },
  
  health: {
    database: () => '/api/health/database',
    app: () => '/api/health',
  },
  
  admin: {
    dashboard: () => '/api/v2/admin/dashboard',
    stats: () => '/api/v2/admin/stats',
    settings: () => '/api/v2/admin/settings',
  },
} as const;

/**
 * Legacy V1 API Routes (Deprecated - Use V2 instead)
 * @deprecated Use API_ROUTES (v2) instead
 */
export const LEGACY_API_ROUTES = {
  jobs: {
    list: (params?: { clientId?: number; status?: string }) => 
      `/api/jobs${buildQueryString(params)}`,
    create: () => '/api/jobs',
    get: (id: number | string) => `/api/jobs/${id}`,
    updateStatus: (id: number | string) => `/api/jobs/${id}/status`,
    messages: (id: number | string, params?: { userRole?: string; limit?: number }) => 
      `/api/jobs/${id}/messages${buildQueryString(params)}`,
    attachments: (id: number | string) => `/api/jobs/${id}/attachments`,
  },
  users: {
    get: (id: number | string) => `/api/users/${id}`,
    summary: (id: number | string) => `/api/users/${id}/summary`,
    profilePicture: (id: number | string) => `/api/users/${id}/profile-picture`,
  },
} as const;

/**
 * Type-safe API response helpers
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isApiError<T>(response: ApiResponse<T> | ApiError): response is ApiError {
  return response.success === false;
}

