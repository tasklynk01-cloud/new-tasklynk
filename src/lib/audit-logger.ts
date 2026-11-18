import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export type AuditEventType = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTRATION'
  | 'USER_APPROVED'
  | 'USER_SUSPENDED'
  | 'USER_PROFILE_UPDATED'
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_ASSIGNED'
  | 'ORDER_SUBMITTED'
  | 'ORDER_APPROVED'
  | 'ORDER_CANCELLED'
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'MESSAGE_SENT'
  | 'BID_PLACED'
  | 'BID_ACCEPTED'
  | 'NOTIFICATION_SENT'
  | 'SETTINGS_CHANGED'
  | 'DATA_EXPORT'
  | 'SECURITY_EVENT'
  | 'SYSTEM_ERROR';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  eventType: AuditEventType;
  description: string;
  severity: AuditSeverity;
  resourceType?: string;
  resourceId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private queue: AuditLogEntry[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Set up periodic flushing
    setInterval(() => this.flush(), this.FLUSH_INTERVAL);

    // Flush on process exit
    process.on('SIGTERM', () => this.flush());
    process.on('SIGINT', () => this.flush());
  }

  async log(entry: AuditLogEntry): Promise<void> {
    // Add timestamp and validate entry
    const auditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      id: this.generateId()
    };

    // Add to queue
    this.queue.push(auditEntry);

    // Flush if queue is full or if it's a critical event
    if (this.queue.length >= this.BATCH_SIZE || entry.severity === 'CRITICAL') {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.BATCH_SIZE);

    try {
      await db.insert(auditLogs).values(
        batch.map(entry => ({
          userId: entry.userId || null,
          userEmail: entry.userEmail || null,
          userRole: entry.userRole || null,
          eventType: entry.eventType,
          description: entry.description,
          severity: entry.severity,
          resourceType: entry.resourceType || null,
          resourceId: entry.resourceId || null,
          oldValues: entry.oldValues ?? null,
          newValues: entry.newValues ?? null,
          metadata: entry.metadata ?? null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          sessionId: entry.sessionId || null,
          success: entry.success,
          errorMessage: entry.errorMessage || null,
          createdAt: new Date().toISOString()
        }))
      );

      console.log(`✅ Flushed ${batch.length} audit log entries`);

    } catch (error) {
      console.error('❌ Failed to flush audit logs:', error);
      
      // Re-add failed entries to queue for retry
      this.queue.unshift(...batch);
      
      // Limit queue size to prevent memory issues
      if (this.queue.length > 1000) {
        this.queue = this.queue.slice(0, 1000);
      }
    } finally {
      this.processing = false;
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

// Convenience functions for common audit events
export const audit = {
  // User events
  async userLogin(userId: number, userEmail: string, userRole: string, metadata?: Record<string, any>) {
    await auditLogger.log({
      userId,
      userEmail,
      userRole,
      eventType: 'USER_LOGIN',
      description: `User ${userEmail} logged in`,
      severity: 'LOW',
      success: true,
      metadata
    });
  },

  async userLogout(userId: number, userEmail: string, userRole: string, metadata?: Record<string, any>) {
    await auditLogger.log({
      userId,
      userEmail,
      userRole,
      eventType: 'USER_LOGOUT',
      description: `User ${userEmail} logged out`,
      severity: 'LOW',
      success: true,
      metadata
    });
  },

  async userRegistration(userEmail: string, userRole: string, success: boolean, errorMessage?: string) {
    await auditLogger.log({
      userEmail,
      userRole,
      eventType: 'USER_REGISTRATION',
      description: `User registration attempt for ${userEmail}`,
      severity: success ? 'LOW' : 'MEDIUM',
      success,
      errorMessage
    });
  },

  async userApproved(adminUserId: number, adminEmail: string, targetUserId: number, targetEmail: string) {
    await auditLogger.log({
      userId: adminUserId,
      userEmail: adminEmail,
      eventType: 'USER_APPROVED',
      description: `Admin ${adminEmail} approved user ${targetEmail}`,
      severity: 'MEDIUM',
      resourceType: 'user',
      resourceId: targetUserId,
      success: true
    });
  },

  async userSuspended(adminUserId: number, adminEmail: string, targetUserId: number, targetEmail: string, reason: string) {
    await auditLogger.log({
      userId: adminUserId,
      userEmail: adminEmail,
      eventType: 'USER_SUSPENDED',
      description: `Admin ${adminEmail} suspended user ${targetEmail}`,
      severity: 'HIGH',
      resourceType: 'user',
      resourceId: targetUserId,
      success: true,
      metadata: { reason }
    });
  },

  // Order events
  async orderCreated(userId: number, userEmail: string, orderId: number, orderData: Record<string, any>) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'ORDER_CREATED',
      description: `User ${userEmail} created order #${orderId}`,
      severity: 'LOW',
      resourceType: 'order',
      resourceId: orderId,
      newValues: orderData,
      success: true
    });
  },

  async orderStatusChanged(
    userId: number, 
    userEmail: string, 
    orderId: number, 
    oldStatus: string, 
    newStatus: string,
    reason?: string
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'ORDER_STATUS_CHANGED',
      description: `Order #${orderId} status changed from ${oldStatus} to ${newStatus}`,
      severity: 'MEDIUM',
      resourceType: 'order',
      resourceId: orderId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      success: true,
      metadata: reason ? { reason } : undefined
    });
  },

  async orderAssigned(
    managerId: number, 
    managerEmail: string, 
    orderId: number, 
    freelancerId: number, 
    freelancerEmail: string
  ) {
    await auditLogger.log({
      userId: managerId,
      userEmail: managerEmail,
      eventType: 'ORDER_ASSIGNED',
      description: `Manager ${managerEmail} assigned order #${orderId} to freelancer ${freelancerEmail}`,
      severity: 'MEDIUM',
      resourceType: 'order',
      resourceId: orderId,
      success: true,
      metadata: { freelancerId, freelancerEmail }
    });
  },

  // Payment events
  async paymentSubmitted(
    userId: number, 
    userEmail: string, 
    orderId: number, 
    amount: number, 
    method: string
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'PAYMENT_SUBMITTED',
      description: `User ${userEmail} submitted payment of KSh ${amount} for order #${orderId}`,
      severity: 'HIGH',
      resourceType: 'payment',
      resourceId: orderId,
      success: true,
      metadata: { amount, method }
    });
  },

  async paymentConfirmed(
    adminUserId: number, 
    adminEmail: string, 
    orderId: number, 
    amount: number
  ) {
    await auditLogger.log({
      userId: adminUserId,
      userEmail: adminEmail,
      eventType: 'PAYMENT_CONFIRMED',
      description: `Admin ${adminEmail} confirmed payment of KSh ${amount} for order #${orderId}`,
      severity: 'HIGH',
      resourceType: 'payment',
      resourceId: orderId,
      success: true,
      metadata: { amount }
    });
  },

  // File events
  async fileUploaded(
    userId: number, 
    userEmail: string, 
    fileName: string, 
    fileSize: number, 
    orderId?: number
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'FILE_UPLOADED',
      description: `User ${userEmail} uploaded file: ${fileName}`,
      severity: 'LOW',
      resourceType: 'file',
      resourceId: orderId,
      success: true,
      metadata: { fileName, fileSize, orderId }
    });
  },

  async fileDownloaded(
    userId: number, 
    userEmail: string, 
    fileName: string, 
    orderId?: number
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'FILE_DOWNLOADED',
      description: `User ${userEmail} downloaded file: ${fileName}`,
      severity: 'LOW',
      resourceType: 'file',
      resourceId: orderId,
      success: true,
      metadata: { fileName, orderId }
    });
  },

  // Security events
  async securityEvent(
    eventDescription: string, 
    severity: AuditSeverity = 'HIGH',
    userId?: number,
    userEmail?: string,
    metadata?: Record<string, any>
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'SECURITY_EVENT',
      description: eventDescription,
      severity,
      success: true,
      metadata
    });
  },

  // System events
  async systemError(
    errorDescription: string, 
    errorDetails: string,
    userId?: number,
    userEmail?: string,
    metadata?: Record<string, any>
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      eventType: 'SYSTEM_ERROR',
      description: errorDescription,
      severity: 'CRITICAL',
      success: false,
      errorMessage: errorDetails,
      metadata
    });
  },

  // Settings changes
  async settingsChanged(
    userId: number,
    userEmail: string,
    userRole: string,
    settingName: string,
    oldValue: any,
    newValue: any
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      userRole,
      eventType: 'SETTINGS_CHANGED',
      description: `User ${userEmail} changed setting: ${settingName}`,
      severity: 'MEDIUM',
      oldValues: { [settingName]: oldValue },
      newValues: { [settingName]: newValue },
      success: true
    });
  },

  // Data export
  async dataExport(
    userId: number,
    userEmail: string,
    userRole: string,
    exportType: string,
    recordCount: number
  ) {
    await auditLogger.log({
      userId,
      userEmail,
      userRole,
      eventType: 'DATA_EXPORT',
      description: `User ${userEmail} exported ${exportType} data (${recordCount} records)`,
      severity: 'HIGH',
      success: true,
      metadata: { exportType, recordCount }
    });
  }
};

// Middleware function to extract request context for audit logging
export function extractAuditContext(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

// Decorator for automatic audit logging of API endpoints
export function auditEndpoint(eventType: AuditEventType, severity: AuditSeverity = 'MEDIUM') {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      let success = true;
      let errorMessage: string | undefined;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        // Log the API call
        const duration = Date.now() - startTime;
        
        auditLogger.log({
          eventType,
          description: `API endpoint ${propertyName} executed`,
          severity,
          success,
          errorMessage,
          metadata: {
            endpoint: propertyName,
            duration,
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  };
}

export { auditLogger };

