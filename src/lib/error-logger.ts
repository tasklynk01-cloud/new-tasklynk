/**
 * API Error Logger
 * 
 * A simple utility for logging API errors with additional context.
 */

interface LogContext {
  [key: string]: any;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : JSON.stringify(error));
}

/**
 * Logs an API error to the console with a structured format.
 *
 * @param error The error object.
 * @param context Optional context to include with the log.
 */
export function logApiError(error: unknown, context: LogContext = {}): void {
  const normalized = normalizeError(error);
  console.error(
    '[API Error]',
    {
      message: normalized.message,
      stack: normalized.stack,
      ...context,
    }
  );
}

export function logAuthError(error: unknown, context: LogContext = {}): void {
  const normalized = normalizeError(error);
  console.error(
    '[Auth Error]',
    {
      message: normalized.message,
      stack: normalized.stack,
      ...context,
    }
  );
}

