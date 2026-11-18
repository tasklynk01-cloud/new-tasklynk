import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  statusCode?: number;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx errors, and specific 4xx errors
    if (!error.status) return true; // Network error
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
};

class ApiError extends Error {
  public status?: number;
  public code?: string;
  public isNetworkError: boolean;
  public isRetryable: boolean;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isNetworkError = !status;
    this.isRetryable = !status || status >= 500 || status === 408 || status === 429;
  }
}

/**
 * Enhanced fetch with automatic retry, error handling, and user feedback
 */
export async function resilientFetch<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<ApiResponse<T>> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Normalize headers (supports Headers/array/object)
      const headers = new Headers(options.headers);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      // Add auth token if available
      const token = localStorage.getItem('bearer_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }

        const error = new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );

        // Check if we should retry
        if (attempt < config.maxRetries && config.retryCondition(error)) {
          lastError = error;
          
          // Calculate delay with exponential backoff
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffFactor, attempt),
            config.maxDelay
          );

          console.warn(`API call failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`, {
            url,
            status: response.status,
            error: error.message
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // No more retries or not retryable
        throw error;
      }

      // Parse successful response
      const responseText = await response.text();
      let data: T;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', responseText);
        data = responseText as any;
      }

      return {
        success: true,
        data,
        statusCode: response.status
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Network errors or fetch failures
      if (!(error instanceof ApiError)) {
        const networkError = new ApiError(
          'Network error - please check your connection',
          undefined,
          'NETWORK_ERROR'
        );
        
        if (attempt < config.maxRetries) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffFactor, attempt),
            config.maxDelay
          );

          console.warn(`Network error (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`, {
            url,
            error: err.message
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        lastError = networkError;
      }

      // If it's the last attempt or not retryable, break
      if (attempt >= config.maxRetries || !(error instanceof ApiError) || !error.isRetryable) {
        break;
      }
    }
  }

  // All retries failed
  const finalError = lastError || new ApiError('Unknown error occurred');
  
  console.error('API call failed after all retries:', {
    url,
    attempts: config.maxRetries + 1,
    finalError: finalError.message,
    status: (finalError as ApiError).status
  });

  return {
    success: false,
    error: finalError.message,
    code: (finalError as ApiError).code,
    statusCode: (finalError as ApiError).status
  };
}

/**
 * Convenience methods for common HTTP operations
 */
export const apiClient = {
  async get<T = any>(url: string, config?: RetryConfig): Promise<ApiResponse<T>> {
    return resilientFetch<T>(url, { method: 'GET' }, config);
  },

  async post<T = any>(url: string, data?: any, config?: RetryConfig): Promise<ApiResponse<T>> {
    return resilientFetch<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, config);
  },

  async put<T = any>(url: string, data?: any, config?: RetryConfig): Promise<ApiResponse<T>> {
    return resilientFetch<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, config);
  },

  async patch<T = any>(url: string, data?: any, config?: RetryConfig): Promise<ApiResponse<T>> {
    return resilientFetch<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, config);
  },

  async delete<T = any>(url: string, config?: RetryConfig): Promise<ApiResponse<T>> {
    return resilientFetch<T>(url, { method: 'DELETE' }, config);
  }
};

/**
 * Higher-order function to add error handling to API calls
 */
export function withErrorHandling<TArgs extends any[], TReturn>(
  apiCall: (...args: TArgs) => Promise<ApiResponse<TReturn>>,
  options: {
    showToast?: boolean;
    toastTitle?: string;
    onError?: (error: string, code?: string) => void;
  } = {}
) {
  return async (...args: TArgs): Promise<TReturn | null> => {
    const { showToast = true, toastTitle = 'Error', onError } = options;

    try {
      const response = await apiCall(...args);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      }

      // Handle API error
      const errorMessage = response.error || 'An unknown error occurred';
      
      if (showToast) {
        toast.error(toastTitle, {
          description: errorMessage,
          duration: 5000,
        });
      }

      if (onError) {
        onError(errorMessage, response.code);
      }

      return null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      if (showToast) {
        toast.error(toastTitle, {
          description: errorMessage,
          duration: 5000,
        });
      }

      if (onError) {
        onError(errorMessage);
      }

      return null;
    }
  };
}

/**
 * React hook for managing API call states
 */
import { useState, useCallback } from 'react';

export function useApiCall<TData = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const execute = useCallback(async <T = TData>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: {
      showToast?: boolean;
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<T | null> => {
    const { showToast = true, onSuccess, onError } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (response.success && response.data !== undefined) {
        setData(response.data as any);
        onSuccess?.(response.data);
        return response.data;
      }

      const errorMessage = response.error || 'An unknown error occurred';
      setError(errorMessage);

      if (showToast) {
        toast.error('Request Failed', {
          description: errorMessage,
          duration: 5000,
        });
      }

      onError?.(errorMessage);
      return null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);

      if (showToast) {
        toast.error('Network Error', {
          description: errorMessage,
          duration: 5000,
        });
      }

      onError?.(errorMessage);
      return null;

    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
}

