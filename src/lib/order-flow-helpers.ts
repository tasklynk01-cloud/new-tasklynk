/**
 * ORDER FLOW HELPERS
 * 
 * Centralized functions for managing order lifecycle, status transitions,
 * and financial calculations with atomic database operations.
 */

import { db } from '@/db';
import { jobs, users, payments, notifications, orderHistory, balances, managerEarnings, managers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  ORDER_STATUS,
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  type OrderStatus,
} from '@/db/schema-order-flow-updates';
import {
  managerAssignFee,
  managerSubmitFee,
  calculateWriterEarningsByCPPLevel,
  calculateManagerEarningsV2,
  clientMinCPP,
  clientMinCPS,
  isTechnicalWorkType,
} from '@/lib/payment-calculations';
import { getCPPLevelByOrderCount } from '@/lib/cpp-calculation';

// ========================================
// 📋 TYPE DEFINITIONS
// ========================================

export interface OrderStatusTransition {
  orderId: number;
  currentStatus: string;
  newStatus: string;
  actorId: number;
  actorRole: string;
  note?: string;
  metadata?: Record<string, any>;
}

export interface FinancialCalculation {
  clientAmount: number;
  freelancerAmount: number;
  managerAssignedFee: number;
  managerDeliveryFee: number;
  managerTotal: number;
  adminProfit: number;
  // 🆕 Manager payment traceability
  assignedByManagerId?: number | null;
  deliveredByManagerId?: number | null;
}

export interface ApprovalParams {
  orderId: number;
  clientId: number;
  actorId: number;
  pages: number;
  slides: number;
  workType: string;
  freelancerId: number;
  managerId: number | null;
  freelancerCompletedOrders: number;
  singleSpaced: boolean;
}

// ========================================
// 🛡️ STATUS TRANSITION VALIDATION
// ========================================

/**
 * Validate and execute order status transition
 * @throws Error if transition is invalid
 */
export async function validateAndTransitionStatus(
  params: OrderStatusTransition,
  dbClient: any = db
): Promise<void> {
  const { orderId, currentStatus, newStatus, actorId, actorRole, note, metadata } = params;

  // Validate transition
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Allowed transitions from ${currentStatus}: ${VALID_STATUS_TRANSITIONS[currentStatus as OrderStatus].join(', ')}`
    );
  }

  // Update order status using provided client (tx or global db)
  await dbClient
    .update(jobs)
    .set({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(jobs.id, orderId));

  // Log to order history
  try {
    await dbClient.insert(orderHistory).values({
      jobId: orderId,
      action: `Status changed: ${currentStatus} → ${newStatus}`,
      oldStatus: currentStatus,
      newStatus: newStatus,
      actorId: actorId,
      notes: note || `Status transition by ${actorRole}`,
      createdAt: new Date().toISOString(),
    });
  } catch (historyError) {
    // Non-blocking: order_history table may not exist in all deployments
    console.warn(`[Order Flow] Failed to log to order_history: ${historyError instanceof Error ? historyError.message : String(historyError)}`);
  }

  // Note: audit_logs insert removed - orderHistory already captures the status transition
  // If audit logging is needed, use adminAuditLogs table with proper Drizzle insert

  console.log(`✅ Order ${orderId} status: ${currentStatus} → ${newStatus} by ${actorRole}`);
}

// ========================================
// 🧾 PAYMENT CONFIRMATION (ADMIN / AUTOMATION)
// ========================================
export async function confirmPaymentReceived(params: {
  orderId: number;
  paymentId: number;
  adminId: number;
  mpesaCode?: string;
  paystackReference?: string;
  actualPaymentAmount?: number; // 🆕 PARTIAL PAYMENT SUPPORT: If provided, uses this instead of order.amount
  partialPaymentReason?: string; // Required if actualPaymentAmount differs from expected
}): Promise<void> {
  const { orderId, paymentId, adminId, mpesaCode, paystackReference, actualPaymentAmount, partialPaymentReason } = params;
  const timestamp = new Date().toISOString();

  // Pre-fetch data outside transaction for validation
  const [order] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status === ORDER_STATUS.PAID) {
    throw new Error('Order payment already confirmed');
  }

  // Allow payment confirmation for orders in 'approved' or 'delivered' status
  // - 'approved': Standard POD flow - client approved work, now paying
  // - 'delivered': Alternative flow - client can pay before approving (POA clients or quick pay option)
  const allowedStatuses = [ORDER_STATUS.APPROVED, ORDER_STATUS.DELIVERED];
  if (!allowedStatuses.includes(order.status as any)) {
    throw new Error(`Order ${orderId} must be approved or delivered before confirming payment (current: ${order.status})`);
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) {
    throw new Error('Payment record not found');
  }

  if (payment.jobId !== orderId) {
    throw new Error('Payment record does not belong to this order');
  }

  // 🆕 PARTIAL PAYMENT HANDLING
  const expectedAmount = order.amount || 0;
  const receivedAmount = actualPaymentAmount ?? payment.amount ?? expectedAmount;
  const isPartialPayment = Math.abs(receivedAmount - expectedAmount) > 0.01;

  if (isPartialPayment && !partialPaymentReason) {
    throw new Error(
      `Partial payment detected (expected: ${expectedAmount}, received: ${receivedAmount}). ` +
      `'partialPaymentReason' is required for audit trail.`
    );
  }

  // Calculate pro-rated amounts if partial payment
  const paymentRatio = isPartialPayment && expectedAmount > 0 ? receivedAmount / expectedAmount : 1;
  let freelancerReservedAmount = order.freelancerEarnings || 0;

  if (isPartialPayment && expectedAmount > 0) {
    freelancerReservedAmount = Math.floor((order.freelancerEarnings || 0) * paymentRatio * 100) / 100;

    console.warn(
      `⚠️ Partial payment for order ${orderId}: ${receivedAmount}/${expectedAmount} KSh (${(paymentRatio * 100).toFixed(1)}%). ` +
      `Pro-rated: Freelancer ${freelancerReservedAmount} KSh`
    );
  }

  // Manager earnings are tracked per-manager (assignment vs delivery can be two
  // different managers) via the managerEarnings audit table, rather than as a
  // single total on order.managerId - see settlePaidOrder for why this matters.
  const managerEarningRows = await db
    .select({ managerId: managerEarnings.managerId, amount: managerEarnings.amount })
    .from(managerEarnings)
    .where(eq(managerEarnings.jobId, orderId));

  const managerReservedByManagerId = new Map<number, number>();
  for (const row of managerEarningRows) {
    const reserved = Math.floor(row.amount * paymentRatio * 100) / 100;
    managerReservedByManagerId.set(
      row.managerId,
      (managerReservedByManagerId.get(row.managerId) || 0) + reserved
    );
  }

  // Use Drizzle's transaction API for atomic operations
  await db.transaction(async (tx) => {
    // Update payment record
    await tx
      .update(payments)
      .set({
        status: 'completed',
        confirmedByAdmin: true,
        confirmedAt: timestamp,
        mpesaCode: mpesaCode || payment.mpesaCode,
        paystackReference: paystackReference || payment.paystackReference,
        amount: receivedAmount,
        updatedAt: timestamp,
      })
      .where(eq(payments.id, paymentId));

    // Update job status to PAID
    await tx
      .update(jobs)
      .set({
        status: ORDER_STATUS.PAID,
        paidAt: timestamp,
        paymentConfirmed: true,
        paidOrderConfirmedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(jobs.id, orderId));

    // Log to order history (non-blocking within transaction)
    try {
      await tx.insert(orderHistory).values({
        jobId: orderId,
        action: `Status changed: ${order.status} → ${ORDER_STATUS.PAID}`,
        oldStatus: order.status,
        newStatus: ORDER_STATUS.PAID,
        actorId: adminId,
        notes: isPartialPayment 
          ? `Partial payment confirmed (${receivedAmount}/${expectedAmount} KSh). Reason: ${partialPaymentReason}`
          : 'Payment confirmed by admin',
        createdAt: timestamp,
      });
    } catch (historyError) {
      console.warn(`[Order Flow] Failed to log to order_history: ${historyError instanceof Error ? historyError.message : String(historyError)}`);
    }

    // Update freelancer balance using upsert pattern
    if (order.assignedFreelancerId && freelancerReservedAmount > 0) {
      try {
        // First try to get existing balance
        const [existingBalance] = await tx
          .select()
          .from(balances)
          .where(eq(balances.userId, order.assignedFreelancerId))
          .limit(1);

        if (existingBalance) {
          // Update existing balance
          await tx
            .update(balances)
            .set({
              pendingBalance: Math.max(0, (existingBalance.pendingBalance || 0) - freelancerReservedAmount),
              reservedBalance: (existingBalance.reservedBalance || 0) + freelancerReservedAmount,
              updatedAt: timestamp,
            })
            .where(eq(balances.userId, order.assignedFreelancerId));
        } else {
          // Insert new balance record
          await tx.insert(balances).values({
            userId: order.assignedFreelancerId,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: freelancerReservedAmount,
            totalEarned: 0,
            totalWithdrawn: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      } catch (balanceError) {
        console.warn(`[Order Flow] Failed to update freelancer balance: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`);
      }
    }

    // Update each credited manager's balance using upsert pattern (assignment and
    // delivery fees may belong to two different managers - see managerReservedByManagerId above)
    for (const [managerId, managerReservedAmount] of managerReservedByManagerId.entries()) {
      if (!managerId || managerReservedAmount <= 0) continue;
      try {
        const [existingBalance] = await tx
          .select()
          .from(balances)
          .where(eq(balances.userId, managerId))
          .limit(1);

        if (existingBalance) {
          await tx
            .update(balances)
            .set({
              pendingBalance: Math.max(0, (existingBalance.pendingBalance || 0) - managerReservedAmount),
              reservedBalance: (existingBalance.reservedBalance || 0) + managerReservedAmount,
              updatedAt: timestamp,
            })
            .where(eq(balances.userId, managerId));
        } else {
          await tx.insert(balances).values({
            userId: managerId,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: managerReservedAmount,
            totalEarned: 0,
            totalWithdrawn: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      } catch (balanceError) {
        console.warn(`[Order Flow] Failed to update manager balance for manager ${managerId}: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`);
      }
    }

    // Create notifications for freelancer
    if (order.assignedFreelancerId) {
      await tx.insert(notifications).values({
        userId: order.assignedFreelancerId,
        jobId: orderId,
        type: isPartialPayment ? 'partial_payment_confirmed' : 'payment_confirmed',
        title: isPartialPayment ? 'Partial Payment Confirmed ⚠️' : 'Payment Confirmed! 💰',
        message: isPartialPayment
          ? `Partial payment received for order ${order.displayId}: KSh ${freelancerReservedAmount} (${((freelancerReservedAmount / (order.freelancerEarnings || 1)) * 100).toFixed(0)}% of expected). Reserved for payout.`
          : `Payment for order ${order.displayId} has been confirmed. Funds are now reserved and awaiting final settlement.`,
        read: false,
        createdAt: timestamp,
      });
    }

    // Create notifications for each credited manager
    for (const [managerId, managerReservedAmount] of managerReservedByManagerId.entries()) {
      await tx.insert(notifications).values({
        userId: managerId,
        jobId: orderId,
        type: isPartialPayment ? 'partial_payment_confirmed' : 'payment_confirmed',
        title: isPartialPayment ? 'Partial Payment Confirmed ⚠️' : 'Payment Confirmed! 💰',
        message: isPartialPayment
          ? `Partial payment received for order ${order.displayId}: KSh ${managerReservedAmount} (${(paymentRatio * 100).toFixed(0)}% of expected). Reserved for payout.`
          : `Payment for order ${order.displayId} has been confirmed. Your earnings are reserved and awaiting settlement.`,
        read: false,
        createdAt: timestamp,
      });
    }
  });

  // Create admin notifications outside transaction (non-critical)
  try {
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        jobId: orderId,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Order ${order.displayId} payment confirmed. Funds reserved for payout.`,
        read: false,
        createdAt: timestamp,
      });
    }
  } catch (notifError) {
    console.warn(`[Order Flow] Failed to create admin notifications: ${notifError instanceof Error ? notifError.message : String(notifError)}`);
  }

  console.log(`✅ Payment confirmed for order ${orderId}`);
}

// ========================================
// 💰 FINANCIAL CALCULATIONS
// ========================================

export function calculateOrderFinancials(params: {
  pages: number;
  slides: number;
  workType: string;
  clientCpp: number;
  freelancerCompletedOrders: number;
  singleSpaced: boolean;
  managerAssigned: boolean;
  orderDelivered: boolean;
  actualPaymentAmount?: number | null; // 🔴 NEW: Actual amount paid by client
  // 🆕 Role-based manager payment tracking
  assignedByRole?: string | null; // Role of user who assigned ('admin' or 'manager')
  assignedByUserId?: number | null; // User ID who assigned
  deliveredByRole?: string | null; // Role of user who delivered ('admin' or 'manager')
  deliveredByUserId?: number | null; // User ID who delivered
}): FinancialCalculation {
  const {
    pages,
    slides,
    workType,
    clientCpp,
    freelancerCompletedOrders,
    singleSpaced,
    managerAssigned,
    orderDelivered,
    actualPaymentAmount,
  } = params;

  // 🔴 CRITICAL: Auto-detect pages/slides to prevent zero amounts
  // If neither pages nor slides provided, assume minimum 1 page
  const detectedPages = pages || 0;
  const detectedSlides = slides || 0;
  
  if (detectedPages === 0 && detectedSlides === 0) {
    console.warn('[Financial Calculation] Zero pages and slides detected, assuming 1 page minimum');
  }

  // Calculate effective pages (doubled for single-spaced)
  // For slides-only orders, effectivePages is 0, not 1
  const isSlidesOnly = (detectedSlides > 0 && detectedPages === 0) || workType.toLowerCase() === 'slides';
  const pageMultiplier = singleSpaced ? 2 : 1;
  const effectivePages = isSlidesOnly ? 0 : (detectedPages || (detectedSlides > 0 ? 0 : 1)) * pageMultiplier;

  // 🔴 CRITICAL FIX: Use actual payment amount or established order amount if available, otherwise calculate from CPP
  const clientAmount = (actualPaymentAmount !== null && actualPaymentAmount !== undefined && actualPaymentAmount > 0)
    ? actualPaymentAmount  // Use actual/established order amount from client
    : (isSlidesOnly
        ? (detectedSlides * (clientCpp || 150))
        : (effectivePages * clientCpp + (detectedSlides || 0) * 150)); // Fallback to calculated amount

  // 🔴 CRITICAL: Calculate freelancer amount using CPP level system WITH single-spaced parameter
  // Pass original pages (not effectivePages) since the function handles the multiplication internally
  const freelancerAmount = calculateWriterEarningsByCPPLevel(
    detectedPages,
    detectedSlides,
    workType,
    freelancerCompletedOrders,
    singleSpaced  // 🔴 Pass single-spaced flag for proper CPP calculation
  );

  // Ensure freelancer amount is never zero
  if (freelancerAmount === 0) {
    console.error('[Financial Calculation] CRITICAL: Freelancer amount is zero!', {
      pages: detectedPages,
      slides: detectedSlides,
      singleSpaced,
      workType,
      freelancerCompletedOrders
    });
  }

  // 🆕 Calculate manager fees using ROLE-BASED logic
  // Only managers who assign/deliver get paid; admins never get manager fees
  let managerAssignedFee = 0;
  let managerDeliveryFee = 0;
  let assignedByManagerId: number | null = null;
  let deliveredByManagerId: number | null = null;
  
  // 🔴 CRITICAL FIX: Always use role-based calculation if role data exists
  // The old fallback causes admin actions to generate manager fees
  const hasRoleData = params.assignedByRole !== undefined || params.deliveredByRole !== undefined;
  
  if (hasRoleData) {
    // Use new role-based calculation with singleSpaced support
    const managerEarnings = calculateManagerEarningsV2({
      assignedByRole: params.assignedByRole || null,
      assignedByUserId: params.assignedByUserId || null,
      deliveredByRole: params.deliveredByRole || null,
      deliveredByUserId: params.deliveredByUserId || null,
      pages: pages,
      singleSpaced: singleSpaced, // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
    });
    managerAssignedFee = managerEarnings.assignmentFee;
    managerDeliveryFee = managerEarnings.deliveryFee;
    assignedByManagerId = managerEarnings.assignedByManagerId;
    deliveredByManagerId = managerEarnings.deliveredByManagerId;
    
    console.log('[Financial Calculation] Using role-based manager fees:', {
      assignedByRole: params.assignedByRole,
      assignedByUserId: params.assignedByUserId,
      assignedByManagerId,
      assignmentFee: managerAssignedFee,
      deliveredByRole: params.deliveredByRole,
      deliveredByUserId: params.deliveredByUserId,
      deliveredByManagerId,
      deliveryFee: managerDeliveryFee,
      totalManagerFees: managerAssignedFee + managerDeliveryFee,
    });
  } else {
    // Fallback to old logic ONLY when role data is not available
    // This ensures backward compatibility for orders processed before role tracking was added
    managerAssignedFee = managerAssigned ? managerAssignFee() : 0;
    managerDeliveryFee = orderDelivered ? managerSubmitFee(pages, singleSpaced) : 0;
    
    console.warn('[Financial Calculation] Using FALLBACK manager fees (no role data):', {
      managerAssigned,
      orderDelivered,
      assignmentFee: managerAssignedFee,
      deliveryFee: managerDeliveryFee,
    });
  }
  
  const managerTotal = managerAssignedFee + managerDeliveryFee;

  // 🔴 CRITICAL: Admin profit = actual payment - freelancer - manager fees
  // This ensures all calculations are based on actual payment amount
  const adminProfit = clientAmount - (freelancerAmount + managerTotal);

  return {
    clientAmount,
    freelancerAmount,
    managerAssignedFee,
    managerDeliveryFee,
    managerTotal,
    adminProfit,
    assignedByManagerId,
    deliveredByManagerId,
  };
}

/**
 * Async version that fetches order data and calculates financials with actual payment amount
 */
export async function calculateOrderFinancialsFromOrderId(params: {
  orderId: number;
  pages: number;
  slides: number;
  workType: string;
  clientCpp: number;
  singleSpaced: boolean;
  freelancerId?: number | null;
  managerId?: number | null;
}): Promise<FinancialCalculation & {
  effectivePages: number;
  freelancerCompletedOrders: number;
  cppLevelName?: string;
}> {
  const { orderId, pages, slides, workType, clientCpp, singleSpaced, freelancerId, managerId } = params;

  // 🆕 Fetch order to get assignedById and deliveredById for role-based manager payments
  let assignedByRole: string | null = null;
  let assignedByUserId: number | null = null;
  let deliveredByRole: string | null = null;
  let deliveredByUserId: number | null = null;
  
  try {
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
    if (order) {
      // Get assigner role if assignedById exists
      if (order.assignedById) {
        const [assigner] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, order.assignedById))
          .limit(1);
        assignedByRole = assigner?.role || null;
        assignedByUserId = order.assignedById;
      }
      
      // Get deliverer role if deliveredById exists
      if (order.deliveredById) {
        const [deliverer] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, order.deliveredById))
          .limit(1);
        deliveredByRole = deliverer?.role || null;
        deliveredByUserId = order.deliveredById;
      }
    }
  } catch (roleError: any) {
    console.warn('[calculateOrderFinancialsFromOrderId] Error fetching role data:', roleError.message);
    // Continue without role data - will fall back to old calculation
  }

  // Get actual payment amount from payments table (with error handling)
  let actualPaymentAmount: number | null = null;
  try {
    const [latestPayment] = await db
      .select({ amount: payments.amount })
      .from(payments)
      .where(eq(payments.jobId, orderId))
      .orderBy(sql`${payments.createdAt} DESC`)
      .limit(1);
    
    actualPaymentAmount = latestPayment?.amount ? Number(latestPayment.amount) : null;
  } catch (paymentError: any) {
    console.warn('[calculateOrderFinancialsFromOrderId] Error fetching payment:', paymentError.message);
    // Continue with null payment amount - will fall back to calculated amount
  }

  // Get freelancer completed orders count for CPP level calculation
  let freelancerCompletedOrders = 0;
  let cppLevelName = 'N/A';
  
  if (freelancerId) {
    try {
      const [freelancer] = await db
        .select({ completedJobs: users.completedJobs })
        .from(users)
        .where(eq(users.id, freelancerId))
        .limit(1);
      
      freelancerCompletedOrders = freelancer?.completedJobs || 0;
      
      // Get CPP level name
      const isTechnical = isTechnicalWorkType(workType || '');
      const cppLevel = getCPPLevelByOrderCount(freelancerCompletedOrders);
      cppLevelName = cppLevel.levelName || 'N/A';
    } catch (freelancerError: any) {
      console.warn('[calculateOrderFinancialsFromOrderId] Error fetching freelancer data:', freelancerError.message);
      // Continue with 0 completed jobs
    }
  }

  const pageMultiplier = singleSpaced ? 2 : 1;
  const effectivePages = pages * pageMultiplier;

  // Calculate financials using actual payment amount and role-based manager fees
  const financials = calculateOrderFinancials({
    pages,
    slides,
    workType,
    clientCpp,
    freelancerCompletedOrders,
    singleSpaced,
    managerAssigned: !!managerId,
    orderDelivered: true, // Assume delivered for financial calculations
    actualPaymentAmount, // 🔴 Pass actual payment amount
    // 🆕 Pass role data for manager payment calculation
    assignedByRole,
    assignedByUserId,
    deliveredByRole,
    deliveredByUserId,
  });

  return {
    ...financials,
    effectivePages,
    freelancerCompletedOrders,
    cppLevelName,
  };
}

// ========================================
// 🎯 ORDER APPROVAL (TRANSACTIONAL)
// ========================================

/**
 * Handle client approval with atomic balance calculations
 * This is the CRITICAL financial transaction that must be atomic
 */
export async function processOrderApproval(params: ApprovalParams): Promise<void> {
  const {
    orderId,
    clientId,
    actorId,
    pages,
    slides,
    workType,
    freelancerId,
    managerId,
    freelancerCompletedOrders,
    singleSpaced,
  } = params;

  // Pre-fetch data outside transaction for validation
  const [order] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.isInvoiced) {
    throw new Error(`Order ${orderId} is already invoiced`);
  }

  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw new Error(`Order ${orderId} is not in delivered status (current: ${order.status})`);
  }

  const resolvedClientCpp = order.clientCpp ?? order.effectiveCpp ?? order.baseCpp;
  const normalizedClientCpp = Number(resolvedClientCpp);
  if (!Number.isFinite(normalizedClientCpp) || normalizedClientCpp <= 0) {
    throw new Error(`Order ${orderId} has invalid client CPP`);
  }

  const minimumClientCpp = order.workType === 'slides' ? clientMinCPS() : clientMinCPP(order.workType);
  const clientCpp = Math.max(normalizedClientCpp, minimumClientCpp);

  // 🆕 Fetch role data for role-based manager payment calculation
  let assignedByRole: string | null = null;
  let assignedByUserId: number | null = null;
  let deliveredByRole: string | null = null;
  let deliveredByUserId: number | null = null;

  if (order.assignedById) {
    const [assigner] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, order.assignedById))
      .limit(1);
    assignedByRole = assigner?.role || null;
    assignedByUserId = order.assignedById;
  }

  if (order.deliveredById) {
    const [deliverer] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, order.deliveredById))
      .limit(1);
    deliveredByRole = deliverer?.role || null;
    deliveredByUserId = order.deliveredById;
  }

  // 3. Calculate all financial components with role-based manager fees
  const financials = calculateOrderFinancials({
    pages,
    slides,
    workType,
    clientCpp,
    freelancerCompletedOrders,
    singleSpaced: singleSpaced || false,
    // 🔴 REMOVED: Don't pass old boolean flags - they trigger fallback logic
    managerAssigned: false, // Force fallback to skip when role data exists
    orderDelivered: false,  // Force fallback to skip when role data exists
    // ✅ Pass role-based tracking for accurate manager fee calculation
    assignedByRole,
    assignedByUserId,
    deliveredByRole,
    deliveredByUserId,
    actualPaymentAmount: Number(order.amount) || undefined,
  });

  const timestamp = new Date().toISOString();

  // Use Drizzle transaction for atomic operations
  await db.transaction(async (tx) => {
    // 4. Update order with financial data
    await tx
      .update(jobs)
      .set({
        statusTotalAmount: financials.clientAmount,
        freelancerEarnings: financials.freelancerAmount,
        managerEarnings: financials.managerTotal,
        adminProfit: financials.adminProfit,
        isInvoiced: true,
        approvedAt: timestamp,
        status: ORDER_STATUS.APPROVED,
        updatedAt: timestamp,
      })
      .where(eq(jobs.id, orderId));

    // 5. Update freelancer balance (upsert pattern)
    try {
      const [existingFreelancerBalance] = await tx
        .select()
        .from(balances)
        .where(eq(balances.userId, freelancerId))
        .limit(1);

      if (existingFreelancerBalance) {
        await tx
          .update(balances)
          .set({
            pendingBalance: (existingFreelancerBalance.pendingBalance || 0) + financials.freelancerAmount,
            totalEarned: (existingFreelancerBalance.totalEarned || 0) + financials.freelancerAmount,
            updatedAt: timestamp,
          })
          .where(eq(balances.userId, freelancerId));
      } else {
        await tx.insert(balances).values({
          userId: freelancerId,
          availableBalance: 0,
          pendingBalance: financials.freelancerAmount,
          reservedBalance: 0,
          totalEarned: financials.freelancerAmount,
          totalWithdrawn: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    } catch (balanceError) {
      console.warn(`[Order Flow] Failed to update freelancer balance: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`);
    }

    // 6. Update manager balances (if exists) - SEPARATE assignment and delivery tracking
    // 🔴 CRITICAL: Only managers earn from orders they assigned or delivered
    // Admin actions (assignedById/deliveredById with admin role) result in 0 earnings
    
    // Track assignment earnings separately
    if (financials.managerAssignedFee > 0 && assignedByUserId && assignedByRole === 'manager') {
      try {
        const [existingBalance] = await tx
          .select()
          .from(balances)
          .where(eq(balances.userId, assignedByUserId))
          .limit(1);

        if (existingBalance) {
          await tx
            .update(balances)
            .set({
              pendingBalance: (existingBalance.pendingBalance || 0) + financials.managerAssignedFee,
              assignmentBalance: (existingBalance.assignmentBalance || 0) + financials.managerAssignedFee,
              totalEarned: (existingBalance.totalEarned || 0) + financials.managerAssignedFee,
              updatedAt: timestamp,
            })
            .where(eq(balances.userId, assignedByUserId));
        } else {
          await tx.insert(balances).values({
            userId: assignedByUserId,
            availableBalance: 0,
            pendingBalance: financials.managerAssignedFee,
            reservedBalance: 0,
            assignmentBalance: financials.managerAssignedFee,
            deliveryBalance: 0,
            totalEarned: financials.managerAssignedFee,
            totalWithdrawn: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      } catch (balanceError) {
        console.warn(`[Order Flow] Failed to update manager assignment balance: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`);
      }
    }

    // Track delivery earnings separately
    if (financials.managerDeliveryFee > 0 && deliveredByUserId && deliveredByRole === 'manager') {
      try {
        const [existingBalance] = await tx
          .select()
          .from(balances)
          .where(eq(balances.userId, deliveredByUserId))
          .limit(1);

        if (existingBalance) {
          await tx
            .update(balances)
            .set({
              pendingBalance: (existingBalance.pendingBalance || 0) + financials.managerDeliveryFee,
              deliveryBalance: (existingBalance.deliveryBalance || 0) + financials.managerDeliveryFee,
              totalEarned: (existingBalance.totalEarned || 0) + financials.managerDeliveryFee,
              updatedAt: timestamp,
            })
            .where(eq(balances.userId, deliveredByUserId));
        } else {
          await tx.insert(balances).values({
            userId: deliveredByUserId,
            availableBalance: 0,
            pendingBalance: financials.managerDeliveryFee,
            reservedBalance: 0,
            assignmentBalance: 0,
            deliveryBalance: financials.managerDeliveryFee,
            totalEarned: financials.managerDeliveryFee,
            totalWithdrawn: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      } catch (balanceError) {
        console.warn(`[Order Flow] Failed to update manager delivery balance: ${balanceError instanceof Error ? balanceError.message : String(balanceError)}`);
      }
    }

    // 6b. Insert managerEarnings records for audit trail
    const managerEarningsRecords: typeof import('@/db/schema').managerEarnings.$inferInsert[] = [];
    
    if (financials.managerAssignedFee > 0 && assignedByUserId && assignedByRole === 'manager') {
      managerEarningsRecords.push({
        managerId: assignedByUserId,
        jobId: orderId,
        earningType: 'assignment',
        amount: financials.managerAssignedFee,
        createdAt: timestamp,
      });
    }
    
    if (financials.managerDeliveryFee > 0 && deliveredByUserId && deliveredByRole === 'manager') {
      managerEarningsRecords.push({
        managerId: deliveredByUserId,
        jobId: orderId,
        earningType: 'delivery',
        amount: financials.managerDeliveryFee,
        createdAt: timestamp,
      });
    }
    
    // Insert all manager earnings records
    if (managerEarningsRecords.length > 0) {
      try {
        const { managerEarnings } = await import('@/db/schema');
        for (const record of managerEarningsRecords) {
          await tx.insert(managerEarnings).values(record);
        }
      } catch (earningsError) {
        console.warn(`[Order Flow] Failed to insert manager earnings records: ${earningsError instanceof Error ? earningsError.message : String(earningsError)}`);
      }
    }

    // 7. Create payment record
    await tx.insert(payments).values({
      jobId: orderId,
      clientId: clientId,
      freelancerId: freelancerId,
      amount: financials.clientAmount,
      paymentMethod: 'pending' as const,
      status: 'pending' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // 8. Log to order history (non-blocking)
    try {
      await tx.insert(orderHistory).values({
        jobId: orderId,
        action: `Status changed: ${order.status} → ${ORDER_STATUS.APPROVED}`,
        oldStatus: order.status,
        newStatus: ORDER_STATUS.APPROVED,
        actorId: actorId,
        notes: 'Order approved by client - financial calculations completed',
        createdAt: timestamp,
      });
    } catch (historyError) {
      console.warn(`[Order Flow] Failed to log to order_history: ${historyError instanceof Error ? historyError.message : String(historyError)}`);
    }

    // 9. Create notifications
    // Notify freelancer
    await tx.insert(notifications).values({
      userId: freelancerId,
      jobId: orderId,
      type: 'order_approved',
      title: 'Order Approved! 🎉',
      message: `Your work on order ${order.displayId} has been approved by the client. Amount: KSh ${financials.freelancerAmount.toFixed(2)}`,
      read: false,
      createdAt: timestamp,
    });

    // Notify manager (if exists)
    if (managerId) {
      await tx.insert(notifications).values({
        userId: managerId,
        jobId: orderId,
        type: 'order_approved',
        title: 'Order Approved! 🎉',
        message: `Order ${order.displayId} has been approved. Your earnings: KSh ${financials.managerTotal.toFixed(2)}`,
        read: false,
        createdAt: timestamp,
      });
    }
  });

  // Notify admins outside transaction (non-critical)
  try {
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        jobId: orderId,
        type: 'order_approved',
        title: 'Order Approved',
        message: `Order ${order.displayId} approved by client. Admin profit: KSh ${financials.adminProfit.toFixed(2)}`,
        read: false,
        createdAt: timestamp,
      });
    }
  } catch (notifError) {
    console.warn(`[Order Flow] Failed to create admin notifications: ${notifError instanceof Error ? notifError.message : String(notifError)}`);
  }

  console.log(`✅ Order ${orderId} approved with financial calculations`);
}

// ========================================
// 🧾 PAYOUT SETTLEMENT (ADMIN / AUTOMATION)
// ========================================
export interface SettlementResult {
  orderId: number;
  freelancerReleased: number;
  managerReleased: number;
  completedAt: string;
}

export async function settlePaidOrder(params: {
  orderId: number;
  actorId: number;
  actorRole: string;
  note?: string;
}): Promise<SettlementResult> {
  const { orderId, actorId, actorRole, note } = params;
  const now = new Date().toISOString();

  // Pre-fetch order for validation
  const [order] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status !== ORDER_STATUS.PAID) {
    throw new Error(`Order ${orderId} must be in paid status before settlement (current: ${order.status})`);
  }

  const rawFreelancerAmount =
    (order as any).freelancerAmount ?? order.freelancerEarnings ?? 0;
  const freelancerPayout = Number(rawFreelancerAmount) || 0;

  // Manager payouts are split per-manager via the managerEarnings audit table
  // (assignment and delivery fees can belong to two different managers) rather
  // than dumping the job's cumulative managerEarnings total onto a single
  // order.managerId, which would pay the wrong manager whenever assignedById/
  // deliveredById differ from the client's primary managerId.
  const managerEarningRows = await db
    .select({ managerId: managerEarnings.managerId, amount: managerEarnings.amount })
    .from(managerEarnings)
    .where(eq(managerEarnings.jobId, orderId));

  const managerPayoutByManagerId = new Map<number, number>();
  for (const row of managerEarningRows) {
    managerPayoutByManagerId.set(
      row.managerId,
      (managerPayoutByManagerId.get(row.managerId) || 0) + row.amount
    );
  }
  const managerPayout = Array.from(managerPayoutByManagerId.values()).reduce((sum, v) => sum + v, 0);

  // Helper to ensure balance row exists
  const ensureBalanceRow = async (tx: any, userId: number) => {
    const [existing] = await tx
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .limit(1);
    
    if (!existing) {
      await tx.insert(balances).values({
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        reservedBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  // Use Drizzle transaction for atomic operations
  await db.transaction(async (tx) => {
    // Update freelancer balance: move reserved to available
    if (order.assignedFreelancerId && freelancerPayout > 0) {
      await ensureBalanceRow(tx, order.assignedFreelancerId);
      const [freelancerBalance] = await tx
        .select()
        .from(balances)
        .where(eq(balances.userId, order.assignedFreelancerId))
        .limit(1);

      if (freelancerBalance) {
        await tx
          .update(balances)
          .set({
            reservedBalance: Math.max(0, (freelancerBalance.reservedBalance || 0) - freelancerPayout),
            availableBalance: (freelancerBalance.availableBalance || 0) + freelancerPayout,
            updatedAt: now,
          })
          .where(eq(balances.userId, order.assignedFreelancerId));
      }
    }

    // Update each credited manager's balance: move reserved to available.
    // Also sync the managers table, since /api/v2/managers/[id]/balance (the
    // manager-facing balance display) reads managers.balance, not the unified
    // balances table - this keeps that display accurate at the point money
    // actually becomes available/withdrawable.
    for (const [managerId, payoutAmount] of managerPayoutByManagerId.entries()) {
      if (!managerId || payoutAmount <= 0) continue;

      await ensureBalanceRow(tx, managerId);
      const [managerBalance] = await tx
        .select()
        .from(balances)
        .where(eq(balances.userId, managerId))
        .limit(1);

      if (managerBalance) {
        await tx
          .update(balances)
          .set({
            reservedBalance: Math.max(0, (managerBalance.reservedBalance || 0) - payoutAmount),
            availableBalance: (managerBalance.availableBalance || 0) + payoutAmount,
            updatedAt: now,
          })
          .where(eq(balances.userId, managerId));
      }

      try {
        const [existingManager] = await tx
          .select()
          .from(managers)
          .where(eq(managers.userId, managerId))
          .limit(1);

        if (existingManager) {
          await tx
            .update(managers)
            .set({
              balance: (existingManager.balance || 0) + payoutAmount,
              totalEarnings: (existingManager.totalEarnings || 0) + payoutAmount,
              updatedAt: now,
            })
            .where(eq(managers.userId, managerId));
        } else {
          await tx.insert(managers).values({
            userId: managerId,
            phone: null,
            balance: payoutAmount,
            totalEarnings: payoutAmount,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (managerRowError) {
        console.warn(`[Order Flow] Failed to sync managers table for manager ${managerId}: ${managerRowError instanceof Error ? managerRowError.message : String(managerRowError)}`);
      }
    }

    // Update order status to COMPLETED
    await tx
      .update(jobs)
      .set({
        status: ORDER_STATUS.COMPLETED,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to order history (non-blocking)
    try {
      await tx.insert(orderHistory).values({
        jobId: orderId,
        action: `Status changed: ${order.status} → ${ORDER_STATUS.COMPLETED}`,
        oldStatus: order.status,
        newStatus: ORDER_STATUS.COMPLETED,
        actorId: actorId,
        notes: note || 'Reserved balances moved to available and order completed',
        createdAt: now,
      });
    } catch (historyError) {
      console.warn(`[Order Flow] Failed to log to order_history: ${historyError instanceof Error ? historyError.message : String(historyError)}`);
    }

    // Create notifications for freelancer
    if (order.assignedFreelancerId) {
      await tx.insert(notifications).values({
        userId: order.assignedFreelancerId,
        jobId: orderId,
        type: 'payout_available',
        title: 'Payout Ready',
        message: `Funds for order ${order.displayId} are now available for withdrawal.`,
        read: false,
        createdAt: now,
      });
    }

    // Create notifications for each credited manager
    for (const managerId of managerPayoutByManagerId.keys()) {
      await tx.insert(notifications).values({
        userId: managerId,
        jobId: orderId,
        type: 'payout_available',
        title: 'Manager Earnings Settled',
        message: `Earnings for order ${order.displayId} are now available in your wallet.`,
        read: false,
        createdAt: now,
      });
    }
  });

  console.log(`✅ Order ${orderId} settlement completed`);

  return {
    orderId,
    freelancerReleased: freelancerPayout,
    managerReleased: managerPayout,
    completedAt: now,
  };
}

// ========================================
// 📊 UTILITY FUNCTIONS
// ========================================

/**
 * Check if order can be transitioned to a new status
 */
export function canTransitionStatus(currentStatus: string, newStatus: string): boolean {
  return isValidStatusTransition(currentStatus, newStatus);
}

/**
 * Get allowed status transitions for current status
 */
export function getAllowedTransitions(currentStatus: string): string[] {
  if (!(currentStatus in VALID_STATUS_TRANSITIONS)) {
    return [];
  }
  return VALID_STATUS_TRANSITIONS[currentStatus as OrderStatus];
}

/**
 * Get client-facing status display
 * Hides internal workflow states from clients
 */
export function getClientFacingStatus(actualStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending Review',
    accepted: 'In Progress',
    assigned: 'In Progress',
    in_progress: 'In Progress',
    editing: 'In Progress',
    delivered: 'Under Review',
    approved: 'Approved',
    paid: 'Payment Confirmed',
    completed: 'Completed',
    revision: 'Revision Requested',
    cancelled: 'Cancelled',
  };

  return statusMap[actualStatus] || actualStatus;
}

export { ORDER_STATUS, VALID_STATUS_TRANSITIONS };

