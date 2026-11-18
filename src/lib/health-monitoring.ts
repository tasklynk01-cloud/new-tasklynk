/**
 * Connection Health Monitoring and Alerts
 * 
 * Gap #19: Set up connection health monitoring and alerts
 * 
 * Provides comprehensive health monitoring for database connections,
 * API endpoints, and system resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { withRetry } from '@/lib/db-retry';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheckItem;
    memory: HealthCheckItem;
    disk?: HealthCheckItem;
    api?: HealthCheckItem;
  };
  metrics?: {
    responseTime?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    uptime?: number;
  };
}

export interface HealthCheckItem {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  details?: any;
}

/**
 * Database health check
 */
async function checkDatabase(): Promise<HealthCheckItem> {
  const startTime = Date.now();
  
  try {
    const result = await withRetry(
      async () => {
        // Use Drizzle's sql template for raw queries
        return await db.execute(sql`SELECT 1 as health_check`);
      },
      { maxRetries: 2, initialDelay: 300 }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 1000) {
      return {
        status: 'warn',
        message: 'Database response time is slow',
        responseTime,
      };
    }
    
    return {
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
    };
  } catch (error: any) {
    return {
      status: 'fail',
      message: `Database connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Memory health check
 */
function checkMemory(): HealthCheckItem {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  if (heapUsagePercent > 90) {
    return {
      status: 'fail',
      message: `Memory usage critical: ${heapUsagePercent.toFixed(1)}%`,
      details: {
        heapUsed: `${heapUsedMB.toFixed(2)} MB`,
        heapTotal: `${heapTotalMB.toFixed(2)} MB`,
        usagePercent: heapUsagePercent.toFixed(1),
      },
    };
  }
  
  if (heapUsagePercent > 75) {
    return {
      status: 'warn',
      message: `Memory usage high: ${heapUsagePercent.toFixed(1)}%`,
      details: {
        heapUsed: `${heapUsedMB.toFixed(2)} MB`,
        heapTotal: `${heapTotalMB.toFixed(2)} MB`,
        usagePercent: heapUsagePercent.toFixed(1),
      },
    };
  }
  
  return {
    status: 'pass',
    message: `Memory usage normal: ${heapUsagePercent.toFixed(1)}%`,
    details: {
      heapUsed: `${heapUsedMB.toFixed(2)} MB`,
      heapTotal: `${heapTotalMB.toFixed(2)} MB`,
      usagePercent: heapUsagePercent.toFixed(1),
    },
  };
}

/**
 * Overall health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const [databaseCheck, memoryCheck] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
  ]);
  
  const responseTime = Date.now() - startTime;
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (databaseCheck.status === 'fail' || memoryCheck.status === 'fail') {
    status = 'unhealthy';
  } else if (databaseCheck.status === 'warn' || memoryCheck.status === 'warn') {
    status = 'degraded';
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseCheck,
      memory: memoryCheck,
    },
    metrics: {
      responseTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
  };
}

/**
 * Create health check endpoint handler
 */
export function createHealthCheckHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const health = await performHealthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      return NextResponse.json(health, { status: statusCode });
    } catch (error: any) {
      return createErrorResponse(
        `Health check failed: ${error.message}`,
        'HEALTH_CHECK_FAILED',
        500
      );
    }
  };
}

/**
 * Create detailed health check endpoint
 */
export function createDetailedHealthCheckHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const health = await performHealthCheck();
      
      // Add additional checks
      const checks = {
        ...health.checks,
        environment: {
          status: 'pass' as const,
          message: `Node.js ${process.version}`,
          details: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV,
          },
        },
      };
      
      const detailedHealth = {
        ...health,
        checks,
      };
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      return NextResponse.json(detailedHealth, { status: statusCode });
    } catch (error: any) {
      return createErrorResponse(
        `Health check failed: ${error.message}`,
        'HEALTH_CHECK_FAILED',
        500
      );
    }
  };
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  enabled: boolean;
  webhook?: string;
  email?: string;
  threshold?: {
    responseTime?: number; // ms
    memoryUsage?: number; // percentage
    errorRate?: number; // percentage
  };
}

/**
 * Send alert (placeholder - integrate with your alerting system)
 */
export async function sendAlert(
  message: string,
  severity: 'critical' | 'warning' | 'info',
  config?: AlertConfig
): Promise<void> {
  if (!config?.enabled) return;
  
  // TODO: Integrate with alerting service (PagerDuty, Slack, email, etc.)
  console.error(`[ALERT ${severity.toUpperCase()}] ${message}`);
  
  // Example: Send to webhook
  if (config.webhook) {
    try {
      await fetch(config.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          severity,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }
}


