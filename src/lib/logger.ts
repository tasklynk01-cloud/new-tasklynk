import winston from 'winston';
import path from 'path';

/**
 * 📊 STRUCTURED LOGGING WITH WINSTON
 * 
 * Provides centralized, structured logging throughout the application
 * 
 * LOG LEVELS (in order of priority):
 * - error: Error messages that need immediate attention
 * - warn: Warning messages about potential issues
 * - info: General informational messages
 * - http: HTTP request logs
 * - debug: Debug information (development only)
 * 
 * USAGE:
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId, email });
 * logger.error('Database error', { error: err.message, query });
 * logger.warn('Slow API response', { endpoint, duration });
 * logger.debug('Debug info', { data });
 */

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return 'info'; // Only info, warn, error in production
  } else if (env === 'test') {
    return 'error'; // Only errors in test
  } else {
    return 'debug'; // All logs in development
  }
};

// Custom format for console output (colorized and readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    
    // Format metadata nicely
    if (Object.keys(meta).length > 0) {
      // Remove winston internals from meta
      const cleanMeta = { ...meta };
      delete cleanMeta.timestamp;
      delete cleanMeta.level;
      delete cleanMeta.message;
      
      if (Object.keys(cleanMeta).length > 0) {
        metaString = '\n' + JSON.stringify(cleanMeta, null, 2);
      }
    }
    
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports (where logs are written)
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.json(),
  transports,
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: fileFormat,
          }),
        ]
      : []),
  ],
  
  rejectionHandlers: [
    new winston.transports.Console({ format: consoleFormat }),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: fileFormat,
          }),
        ]
      : []),
  ],
});

/**
 * Log API request
 * Use this at the start of API routes to track requests
 * 
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - API path
 * @param metadata - Additional context (userId, ip, etc.)
 */
export function logAPIRequest(method: string, path: string, metadata?: Record<string, any>) {
  logger.http('API Request', {
    method,
    path,
    ...metadata,
  });
}

/**
 * Log API response
 * Use this at the end of API routes to track responses
 * 
 * @param method - HTTP method
 * @param path - API path
 * @param statusCode - Response status code
 * @param duration - Request duration in ms
 * @param metadata - Additional context
 */
export function logAPIResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger[level]('API Response', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...metadata,
  });
  
  // Warn about slow responses
  if (duration > 1000) {
    logger.warn('Slow API response detected', {
      method,
      path,
      duration: `${duration}ms`,
    });
  }
}

/**
 * Log authentication event
 * 
 * @param event - Event type (login, logout, register, etc.)
 * @param success - Whether the event succeeded
 * @param metadata - Additional context (userId, email, ip, etc.)
 */
export function logAuthEvent(event: string, success: boolean, metadata?: Record<string, any>) {
  const level = success ? 'info' : 'warn';
  
  logger[level](`Auth: ${event}`, {
    success,
    event,
    ...metadata,
  });
}

/**
 * Log database operation
 * 
 * @param operation - Operation type (create, read, update, delete)
 * @param table - Database table name
 * @param success - Whether the operation succeeded
 * @param metadata - Additional context
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  success: boolean,
  metadata?: Record<string, any>
) {
  const level = success ? 'debug' : 'error';
  
  logger[level](`Database: ${operation}`, {
    operation,
    table,
    success,
    ...metadata,
  });
}

/**
 * Log security event
 * Use this for security-related events like rate limiting, failed auth, etc.
 * 
 * @param event - Security event description
 * @param severity - Event severity (low, medium, high, critical)
 * @param metadata - Additional context
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
) {
  const levelMap = {
    low: 'info',
    medium: 'warn',
    high: 'error',
    critical: 'error',
  };
  
  const level = levelMap[severity];

  const logFn = level === 'info' ? logger.info : level === 'warn' ? logger.warn : logger.error;
  
  logFn(`Security: ${event}`, {
    severity,
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log payment event
 * 
 * @param event - Payment event (initiated, completed, failed, refunded)
 * @param amount - Payment amount
 * @param metadata - Additional context
 */
export function logPaymentEvent(
  event: string,
  amount: number,
  metadata?: Record<string, any>
) {
  logger.info(`Payment: ${event}`, {
    event,
    amount,
    ...metadata,
  });
}

/**
 * Log email event
 * 
 * @param event - Email event (sent, failed, bounced)
 * @param recipient - Email recipient
 * @param metadata - Additional context
 */
export function logEmailEvent(
  event: string,
  recipient: string,
  metadata?: Record<string, any>
) {
  logger.info(`Email: ${event}`, {
    event,
    recipient,
    ...metadata,
  });
}

/**
 * Log file operation
 * 
 * @param operation - Operation type (upload, delete, move)
 * @param filename - File name
 * @param success - Whether the operation succeeded
 * @param metadata - Additional context
 */
export function logFileOperation(
  operation: string,
  filename: string,
  success: boolean,
  metadata?: Record<string, any>
) {
  const level = success ? 'info' : 'error';
  
  logger[level](`File: ${operation}`, {
    operation,
    filename,
    success,
    ...metadata,
  });
}

/**
 * Log performance metric
 * 
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Unit of measurement
 * @param metadata - Additional context
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  unit: string,
  metadata?: Record<string, any>
) {
  logger.debug(`Performance: ${metric}`, {
    metric,
    value,
    unit,
    ...metadata,
  });
}

/**
 * Create a child logger with default metadata
 * Useful for adding context to all logs from a specific module
 * 
 * @param defaultMeta - Default metadata to include in all logs
 * @returns Child logger instance
 */
export function createChildLogger(defaultMeta: Record<string, any>) {
  return logger.child(defaultMeta);
}

/**
 * Log startup information
 * Call this when the application starts
 */
export function logStartup() {
  logger.info('🚀 Application starting', {
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
  });
}

/**
 * Log shutdown information
 * Call this when the application is shutting down
 */
export function logShutdown(reason?: string) {
  logger.info('🛑 Application shutting down', {
    reason: reason || 'Normal shutdown',
    uptime: process.uptime(),
  });
}

// Export logger instance as default
export default logger;

