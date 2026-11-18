/**
 * API Helper Utilities
 * 
 * Common utilities for API routes including CORS handling,
 * error responses, and authentication helpers.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Handle CORS preflight OPTIONS requests
 * Call this in your OPTIONS handler for all API routes
 */
export function handleOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Standardized error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

type ApiSuccessPayload<T> = ApiSuccessResponse<T> & Record<string, any>;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  status = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        message,
        code,
        ...(details && process.env.NODE_ENV === 'development' && { details }),
      },
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<any> {
  if (Array.isArray(data)) {
    return NextResponse.json(data, { status });
  }

  const isPlainObject = data !== null && typeof data === 'object' && !Array.isArray(data);

  if (isPlainObject) {
    const dataRecord = data as Record<string, any>;
    const { success: _legacySuccess, data: _legacyData, ...rest } = dataRecord;

    const payload: ApiSuccessPayload<T> = {
      success: true,
      data,
      ...rest,
    };

    return NextResponse.json<ApiSuccessPayload<T>>(payload, { status });
  }

  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
  };

  return NextResponse.json<ApiSuccessPayload<T>>(payload, { status });
}

/**
 * Extract bearer token from request headers
 */
export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  return getBearerToken(request) !== null;
}

/**
 * Database error handler - converts database errors to user-friendly messages
 */
export function handleDatabaseError(error: any): NextResponse<ApiErrorResponse> {
  const errorMessage = (error?.message || '').toLowerCase();
  let userMessage = 'Database operation failed';
  let code = 'DATABASE_ERROR';
  let status = 500;

  if (errorMessage.includes('unique constraint') || errorMessage.includes('already exists')) {
    userMessage = 'This record already exists';
    code = 'DUPLICATE_ENTRY';
    status = 409;
  } else if (errorMessage.includes('not null constraint')) {
    userMessage = 'Missing required information';
    code = 'MISSING_REQUIRED_FIELDS';
    status = 400;
  } else if (errorMessage.includes('foreign key constraint')) {
    userMessage = 'Invalid reference data';
    code = 'INVALID_REFERENCE';
    status = 400;
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    userMessage = 'Request timed out. Please try again';
    code = 'TIMEOUT_ERROR';
    status = 504;
  } else if (errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
    userMessage = 'Database connection failed. Please try again';
    code = 'DATABASE_CONNECTION_ERROR';
    status = 503;
  }

  // Log error for debugging
  console.error('[Database Error]', {
    code,
    message: error?.message,
    stack: error?.stack,
  });

  return createErrorResponse(userMessage, code, status, 
    process.env.NODE_ENV === 'development' ? { originalError: error?.message } : undefined
  );
}


