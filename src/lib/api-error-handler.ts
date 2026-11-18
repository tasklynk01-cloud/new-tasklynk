/**
 * API Error Response Handler
 * Standardized error responses for all API endpoints
 */

import { NextResponse } from 'next/server'

export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'VALIDATION_ERROR'

export interface ApiErrorResponse {
  error: string
  code: ErrorCode
  status: number
  timestamp: string
  details?: Record<string, any>
}

class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Create standardized API error responses
 */
export const ApiErrorFactory = {
  notFound: (message = 'Resource not found') =>
    new ApiError('NOT_FOUND', 404, message),

  unauthorized: (message = 'Unauthorized access') =>
    new ApiError('UNAUTHORIZED', 401, message),

  forbidden: (message = 'Access forbidden') =>
    new ApiError('FORBIDDEN', 403, message),

  badRequest: (message = 'Bad request', details?: Record<string, any>) =>
    new ApiError('BAD_REQUEST', 400, message, details),

  conflict: (message = 'Resource conflict') =>
    new ApiError('CONFLICT', 409, message),

  validationError: (message = 'Validation failed', details?: Record<string, any>) =>
    new ApiError('VALIDATION_ERROR', 422, message, details),

  internalError: (message = 'Internal server error') =>
    new ApiError('INTERNAL_ERROR', 500, message),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    new ApiError('SERVICE_UNAVAILABLE', 503, message),
}

/**
 * Convert ApiError to NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString()

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.status,
        timestamp,
        ...(error.details && { details: error.details }),
      },
      { status: error.status }
    )
  }

  // Handle standard Error
  if (error instanceof Error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        status: 500,
        timestamp,
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  console.error('Unknown API Error:', error)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      status: 500,
      timestamp,
    },
    { status: 500 }
  )
}

/**
 * Validate request data with error handling
 */
export function validateRequest<T>(
  data: unknown,
  schema: (data: unknown) => T | null
): T {
  const validated = schema(data)
  if (!validated) {
    throw ApiErrorFactory.validationError('Invalid request data')
  }
  return validated
}

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}

/**
 * Usage Examples:
 * 
 * // In an API route:
 * export const POST = withErrorHandling(async (request: NextRequest) => {
 *   const data = await request.json()
 *   
 *   if (!data.email) {
 *     throw ApiErrorFactory.badRequest('Email is required')
 *   }
 *   
 *   const user = await db.users.findUnique({ where: { email: data.email } })
 *   if (!user) {
 *     throw ApiErrorFactory.notFound('User not found')
 *   }
 *   
 *   return NextResponse.json({ success: true, user })
 * })
 */

