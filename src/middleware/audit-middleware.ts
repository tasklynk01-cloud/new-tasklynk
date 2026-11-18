// Audit logging middleware for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';
import { audit, extractAuditContext, AuditEventType, AuditSeverity } from '@/lib/audit-logger';
import { getRequestSession } from '@/lib/session';

export interface AuditMiddlewareOptions {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  description?: string;
  skipSuccessLog?: boolean;
  extractResourceId?: (request: NextRequest) => number | undefined;
  extractMetadata?: (request: NextRequest, response: NextResponse) => Record<string, any>;
}

export function withAuditLogging(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: AuditMiddlewareOptions
) {
  return async function auditedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const startTime = Date.now();
    const { ipAddress, userAgent } = extractAuditContext(request);
    
    let success = true;
    let errorMessage: string | undefined;
    let response: NextResponse | undefined;
    let user: any = null;

    try {
      // Get user session if available
      const session = getRequestSession(request);
      if (session) {
        user = { id: session.userId, email: session.email, role: session.role };
      }

      // Execute the handler
      response = await handler(request, ...args);

      // Check if response indicates an error
      if (response.status >= 400) {
        success = false;
        const responseData = await response.clone().json().catch(() => ({}));
        errorMessage = responseData.error || `HTTP ${response.status}`;
      }

      return response;

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );

      return response;

    } finally {
      // Only log if not a success that should be skipped
      if (!options.skipSuccessLog || !success) {
        const duration = Date.now() - startTime;
        const resourceId = options.extractResourceId?.(request);
        const metadata = {
          method: request.method,
          url: request.url,
          duration,
          statusCode: response?.status,
          ...(response ? (options.extractMetadata?.(request, response) || {}) : {})
        };

        // Log the audit event
        await audit.systemError(
          options.description || `API ${options.eventType} - ${request.method} ${request.url}`,
          errorMessage || '',
          user?.id,
          user?.email,
          {
            ...metadata,
            ipAddress,
            userAgent,
            resourceId
          }
        );
      }
    }
  };
}

// Specialized middleware for different types of API operations

export function withUserActionAudit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  eventType: AuditEventType,
  options: {
    description?: string;
    severity?: AuditSeverity;
    extractResourceId?: (request: NextRequest) => number | undefined;
  } = {}
) {
  return withAuditLogging(handler, {
    eventType,
    severity: options.severity || 'MEDIUM',
    description: options.description,
    extractResourceId: options.extractResourceId,
    extractMetadata: (request, response) => {
      const isSuccess = response.status >= 200 && response.status < 300;
      return {
        success: isSuccess,
        operation: eventType
      };
    }
  });
}

export function withDataChangeAudit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    resourceType: string;
    extractResourceId: (request: NextRequest) => number | undefined;
    extractOldValues?: (request: NextRequest) => Promise<Record<string, any> | undefined>;
    extractNewValues?: (request: NextRequest) => Promise<Record<string, any> | undefined>;
  }
) {
  return async function auditedDataHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    let oldValues: Record<string, any> | undefined;
    let newValues: Record<string, any> | undefined;

    try {
      // Extract old values before operation
      if (options.extractOldValues) {
        oldValues = await options.extractOldValues(request);
      }

      // Execute the handler
      const response = await handler(request, ...args);

      // Extract new values after operation
      if (options.extractNewValues && response.status >= 200 && response.status < 300) {
        newValues = await options.extractNewValues(request);
      }

      // Log data change audit
      const { ipAddress, userAgent } = extractAuditContext(request);
      const session = getRequestSession(request);
      const user = session ? { id: session.userId, email: session.email, role: session.role } : null;

      if (user) {
        await audit.settingsChanged(
          user.id,
          user.email,
          user.role,
          options.resourceType,
          oldValues,
          newValues
        );
      }

      return response;

    } catch (error) {
      throw error;
    }
  };
}

// Security event middleware
export function withSecurityAudit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    eventDescription: string;
    severity?: AuditSeverity;
    detectSuspiciousActivity?: (request: NextRequest) => boolean;
  }
) {
  return async function securityAuditedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const { ipAddress, userAgent } = extractAuditContext(request);
    
    try {
      // Check for suspicious activity
      const isSuspicious = options.detectSuspiciousActivity?.(request) || false;
      
      if (isSuspicious) {
        await audit.securityEvent(
          `Suspicious activity detected: ${options.eventDescription}`,
          'HIGH',
          undefined,
          undefined,
          { ipAddress, userAgent, url: request.url }
        );
      }

      // Execute handler
      const response = await handler(request, ...args);

      // Log security event if configured
      const session = getRequestSession(request);
      const user = session ? { id: session.userId, email: session.email, role: session.role } : null;

      await audit.securityEvent(
        options.eventDescription,
        options.severity || 'MEDIUM',
        user?.id,
        user?.email,
        {
          ipAddress,
          userAgent,
          method: request.method,
          url: request.url,
          statusCode: response.status,
          suspicious: isSuspicious
        }
      );

      return response;

    } catch (error) {
      // Log security error
      await audit.securityEvent(
        `Security audit failed: ${options.eventDescription}`,
        'HIGH',
        undefined,
        undefined,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          ipAddress,
          userAgent
        }
      );
      
      throw error;
    }
  };
}

// Performance monitoring middleware
export function withPerformanceAudit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    slowThresholdMs?: number;
    logAllRequests?: boolean;
  } = {}
) {
  const slowThreshold = options.slowThresholdMs || 5000; // 5 seconds

  return async function performanceAuditedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const startTime = Date.now();
    
    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;

      // Log if slow or if logging all requests
      if (duration > slowThreshold || options.logAllRequests) {
        const { ipAddress, userAgent } = extractAuditContext(request);
        const session = getRequestSession(request);
        const user = session ? { id: session.userId, email: session.email, role: session.role } : null;

        const severity: AuditSeverity = duration > slowThreshold ? 'HIGH' : 'LOW';
        const description = duration > slowThreshold 
          ? `Slow API request detected: ${request.method} ${request.url} (${duration}ms)`
          : `API request: ${request.method} ${request.url} (${duration}ms)`;

        await audit.systemError(
          description,
          '',
          user?.id,
          user?.email,
          {
            duration,
            threshold: slowThreshold,
            method: request.method,
            url: request.url,
            statusCode: response.status,
            ipAddress,
            userAgent
          }
        );
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      await audit.systemError(
        `API request failed: ${request.method} ${request.url} (${duration}ms)`,
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        undefined,
        {
          duration,
          method: request.method,
          url: request.url
        }
      );
      
      throw error;
    }
  };
}

