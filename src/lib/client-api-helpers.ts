/**
 * Client-side API Response Helpers
 * 
 * Safe error extraction from various API response formats
 */

/**
 * Safely extracts an error message from API responses
 * Handles both formats:
 * - { error: 'string message' }
 * - { error: { message: 'string', code: 'CODE' } }
 * - { success: false, error: { message, code } }
 * 
 * @param data - The API response data object
 * @param fallback - Fallback message if no error can be extracted
 * @returns A string error message safe to display
 */
export function extractErrorMessage(data: any, fallback = 'An error occurred'): string {
  if (!data) return fallback;
  
  // Handle error as direct string
  if (typeof data.error === 'string') {
    return data.error;
  }
  
  // Handle error as object with message property
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string') {
      return data.error.message;
    }
  }
  
  // Handle message field directly
  if (typeof data.message === 'string') {
    return data.message;
  }
  
  // Handle nested data.error.error (double wrapped)
  if (data.error?.error && typeof data.error.error === 'string') {
    return data.error.error;
  }
  
  return fallback;
}

/**
 * Safely extracts an error code from API responses
 * 
 * @param data - The API response data object
 * @param fallback - Fallback code if none found
 * @returns An error code string
 */
export function extractErrorCode(data: any, fallback = 'UNKNOWN_ERROR'): string {
  if (!data) return fallback;
  
  // Handle code at top level
  if (typeof data.code === 'string') {
    return data.code;
  }
  
  // Handle code nested in error object
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.code === 'string') {
      return data.error.code;
    }
  }
  
  return fallback;
}

/**
 * Combines error message and code extraction
 * 
 * @param data - The API response data object
 * @param defaultMessage - Default message if none found
 * @returns Object with message and code
 */
export function extractError(data: any, defaultMessage = 'An error occurred'): { message: string; code: string } {
  return {
    message: extractErrorMessage(data, defaultMessage),
    code: extractErrorCode(data),
  };
}

export type ApiEnvelope<T> = T | { success?: boolean; data?: T };

export function unwrapApiData<T>(payload: ApiEnvelope<T> | null | undefined): T | null {
  if (!payload) return null;

  if (typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
}

export function unwrapOrderList<T>(payload: unknown, key = 'orders'): T[] {
  const data = unwrapApiData<any>(payload as ApiEnvelope<any> | null | undefined);
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.[key])) return data[key] as T[];
  return [];
}

/**
 * A safe fetch wrapper for client-side API calls.
 * 
 * Solves "successful failure" scenarios where backend returns 200 OK but payload contains { error }.
 * It intercepts these responses and transforms them into 400 responses so standard `if (!response.ok)` handlers work correctly.
 * It also protects against empty string responses triggering JSON.parse errors in catch blocks.
 */

export async function safeApiFetch(url: string | URL | Request, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  try {
    const clone = response.clone();
    let data;
    try {
      data = await clone.json();
    } catch(e) {
      if (!response.ok) {
        const text = await response.clone().text();
        return new Response(JSON.stringify({ error: text || response.statusText }), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
         return new Response(JSON.stringify({ success: true }), {
           status: response.status,
           statusText: response.statusText,
           headers: response.headers
         });
      }
    }
    
    if (response.ok && (data?.success === false || data?.error)) {
      return new Response(JSON.stringify(data), {
        status: 400,
        statusText: "Business Logic Error",
        headers: response.headers
      });
    }
    
  } catch (error) {
  }
  
  return response;
}

