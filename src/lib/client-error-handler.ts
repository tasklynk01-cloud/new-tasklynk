/**
 * Client-side Error Utilities
 * Helpers for handling errors in React components
 */

import { useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Extract user-friendly error message
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'Something went wrong'
): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  if (error && typeof error === 'object' && 'error' in error) {
    return String(error.error)
  }

  return defaultMessage
}

/**
 * Format API error response
 */
export function formatApiError(response: any): string {
  if (response?.error) {
    return response.error
  }

  if (response?.message) {
    return response.message
  }

  if (typeof response === 'string') {
    return response
  }

  return 'An unexpected error occurred'
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context: Record<string, any> = {}
) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: extractErrorMessage(error),
      error,
      context,
      timestamp: new Date().toISOString(),
    })
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context })
    console.error(extractErrorMessage(error))
  }
}

/**
 * Hook: Show error toast
 */
export function useErrorToast() {
  return useCallback((error: unknown, title = 'Error') => {
    const message = extractErrorMessage(error)
    toast.error(message, {
      description: title !== 'Error' ? title : undefined,
      position: 'top-right',
      duration: 4000,
    })
  }, [])
}

/**
 * Hook: Handle async operation with error
 */
export function useAsyncHandler() {
  const showError = useErrorToast()

  return useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options: {
        onSuccess?: (data: T) => void | Promise<void>
        onError?: (error: unknown) => void
        errorMessage?: string
      } = {}
    ): Promise<T | null> => {
      try {
        const data = await fn()
        options.onSuccess?.(data)
        return data
      } catch (error) {
        logError(error, { operation: fn.name })
        showError(error, options.errorMessage)
        options.onError?.(error)
        return null
      }
    },
    [showError]
  )
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        )
        onRetry?.(attempt + 1, error)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Handle fetch errors
 */
export async function handleFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: unknown; status: number }> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }))
      return {
        data: null,
        error: error.error || error.message || response.statusText,
        status: response.status,
      }
    }

    const data = await response.json()
    return { data, error: null, status: response.status }
  } catch (error) {
    return {
      data: null,
      error: extractErrorMessage(error, 'Network error'),
      status: 0,
    }
  }
}

/**
 * Throw typed error
 */
export class ClientError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ClientError'
  }
}

/**
 * Usage Examples:
 * 
 * // In a component:
 * const showError = useErrorToast()
 * const handleAsync = useAsyncHandler()
 * 
 * const handleSubmit = async (data) => {
 *   await handleAsync(
 *     () => api.post('/users', data),
 *     {
 *       onSuccess: () => toast.success('User created'),
 *       errorMessage: 'Failed to create user'
 *     }
 *   )
 * }
 * 
 * // With retry:
 * await retryWithBackoff(() => api.get('/data'), {
 *   maxRetries: 3,
 *   onRetry: (attempt) => console.log(`Retry ${attempt}`)
 * })
 */

