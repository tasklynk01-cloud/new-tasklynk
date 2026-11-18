/**
 * Document Access Control & Entitlement System
 * 
 * Manages access control for documents based on:
 * - Payment terms (POA vs POD)
 * - Payment status
 * - User roles
 * - Order status
 */

import { db } from '@/db';
import { users, payments, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type AccessLevel = 'full' | 'preview' | 'none';
export type PaymentTerms = 'poa' | 'pod';

export type AccessCheckResult = {
  hasAccess: boolean;
  accessLevel: AccessLevel;
  canDownload: boolean;
  canPreview: boolean;
  previewPercentage: number;
  reason: string;
  requiresPayment: boolean;
};

/**
 * Check if user has full access to a document
 */
export async function checkDocumentAccess(
  userId: number,
  orderId: number,
  userRole: string
): Promise<AccessCheckResult> {
  try {
    // Fetch order details
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return {
        hasAccess: false,
        accessLevel: 'none',
        canDownload: false,
        canPreview: false,
        previewPercentage: 0,
        reason: 'Order not found',
        requiresPayment: false,
      };
    }

    // Admin and manager always have full access
    if (userRole === 'admin' || userRole === 'manager') {
      return {
        hasAccess: true,
        accessLevel: 'full',
        canDownload: true,
        canPreview: true,
        previewPercentage: 100,
        reason: 'Admin/Manager full access',
        requiresPayment: false,
      };
    }

    // Freelancer has access to their own orders
    if (userRole === 'freelancer' && order.assignedFreelancerId === userId) {
      return {
        hasAccess: true,
        accessLevel: 'full',
        canDownload: true,
        canPreview: true,
        previewPercentage: 100,
        reason: 'Freelancer access to own work',
        requiresPayment: false,
      };
    }

    // Client access control
    if (userRole === 'client' || userRole === 'account_owner') {
      // Check if user is the order owner OR part of the same account/domain
      let hasOrderAccess = order.clientId === userId;

      // If not direct owner, check account/domain membership
      if (!hasOrderAccess) {
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const [orderClient] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.clientId))
          .limit(1);

        // Allow access if same account or same domain
        if (currentUser && orderClient) {
          if (currentUser.accountId && currentUser.accountId === orderClient.accountId) {
            hasOrderAccess = true;
          } else if (currentUser.domainId && currentUser.domainId === orderClient.domainId) {
            hasOrderAccess = true;
          }
        }
      }

      if (!hasOrderAccess) {
        return {
          hasAccess: false,
          accessLevel: 'none',
          canDownload: false,
          canPreview: false,
          previewPercentage: 0,
          reason: 'You do not have access to this order',
          requiresPayment: false,
        };
      }

      // Fetch client details for payment terms
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!client) {
        return {
          hasAccess: false,
          accessLevel: 'none',
          canDownload: false,
          canPreview: false,
          previewPercentage: 0,
          reason: 'Client not found',
          requiresPayment: false,
        };
      }

      const paymentTerms: PaymentTerms = (client.paymentTerms as PaymentTerms) || 'pod';

      // POA (Pay on Approval) - Full access immediately
      if (paymentTerms === 'poa') {
        return {
          hasAccess: true,
          accessLevel: 'full',
          canDownload: true,
          canPreview: true,
          previewPercentage: 100,
          reason: 'Pay on Approval (POA) - Full access granted',
          requiresPayment: false,
        };
      }

      // POD (Pay on Delivery) - Check payment status
      if (paymentTerms === 'pod') {
        const [payment] = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.jobId, orderId),
              eq(payments.status, 'completed')
            )
          )
          .limit(1);

        if (payment) {
          // Payment completed - full access
          return {
            hasAccess: true,
            accessLevel: 'full',
            canDownload: true,
            canPreview: true,
            previewPercentage: 100,
            reason: 'Payment completed - Full access granted',
            requiresPayment: false,
          };
        } else {
          // Payment pending - only allow preview, NOT download
          // This applies to ALL statuses including delivered, approved, etc.
          return {
            hasAccess: true,
            accessLevel: 'preview',
            canDownload: false,
            canPreview: true,
            previewPercentage: 40,
            reason: 'Pay on Delivery (POD) - Payment required for full access and downloads',
            requiresPayment: true,
          };
        }
      }
    }

    // Default - no access
    return {
      hasAccess: false,
      accessLevel: 'none',
      canDownload: false,
      canPreview: false,
      previewPercentage: 0,
      reason: 'Unauthorized access',
      requiresPayment: false,
    };
  } catch (error) {
    console.error('Failed to check document access:', error);
    return {
      hasAccess: false,
      accessLevel: 'none',
      canDownload: false,
      canPreview: false,
      previewPercentage: 0,
      reason: 'Error checking access',
      requiresPayment: false,
    };
  }
}

/**
 * Generate access token for document download
 * This token is used to verify download authorization
 */
export function generateAccessToken(
  userId: number,
  orderId: number,
  expiresIn: number = 3600 // 1 hour default
): string {
  const payload = {
    userId,
    orderId,
    type: 'document_access',
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  // In production, use JWT signing with secret
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify access token for document download
 */
export function verifyAccessToken(token: string): {
  valid: boolean;
  userId?: number;
  orderId?: number;
  error?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify token type
    if (payload.type !== 'document_access') {
      return { valid: false, error: 'Invalid token type' };
    }

    return {
      valid: true,
      userId: payload.userId,
      orderId: payload.orderId,
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Log document access attempt for audit trail
 */
export async function logDocumentAccess(
  userId: number,
  orderId: number,
  accessLevel: AccessLevel,
  action: 'preview' | 'download',
  success: boolean
): Promise<void> {
  try {
    // TODO: Implement audit logging to database
    console.log('Document access:', {
      userId,
      orderId,
      accessLevel,
      action,
      success,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log document access:', error);
  }
}

/**
 * Check if order is in a status that allows document access
 */
export function isOrderAccessible(orderStatus: string): boolean {
  const accessibleStatuses = [
    'delivered',
    'revision',
    'approved',
    'paid',
    'completed',
  ];
  return accessibleStatuses.includes(orderStatus);
}

/**
 * Get recommended preview percentage based on payment terms and status
 */
export function getPreviewPercentage(
  paymentTerms: PaymentTerms,
  isPaid: boolean
): number {
  if (paymentTerms === 'poa') {
    return 100; // Full access for POA
  }

  if (paymentTerms === 'pod') {
    return isPaid ? 100 : 40; // 40% for unpaid POD, 100% after payment
  }

  return 0; // No access by default
}

