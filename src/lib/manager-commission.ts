/**
 * Manager Commission Preview Helper
 * 
 * Provides commission calculations for managers when viewing/assigning orders.
 * Uses authoritative rates from payment-calculations.ts
 */

import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { managerAssignFee, managerSubmitFee } from './payment-calculations';

export interface ManagerCommissionPreview {
  orderId: number;
  pages: number;
  assignmentFee: number;
  deliveryFee: number;
  totalPotentialEarnings: number;
  breakdown: {
    assignmentFeeDescription: string;
    deliveryFeeDescription: string;
  };
}

/**
 * Calculate commission preview for a manager considering an order
 * 
 * @param orderId - The order ID to calculate commission for
 * @returns Commission breakdown or null if order not found
 */
export async function getManagerCommissionPreview(
  orderId: number
): Promise<ManagerCommissionPreview | null> {
  const [order] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, orderId))
    .limit(1);

  if (!order) return null;

  const pages = Math.max(0, Number(order.pages || 0));
  // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
  const isSingleSpaced = Boolean((order as any).singleSpaced);
  const assignFee = managerAssignFee();
  const submitFee = managerSubmitFee(pages, isSingleSpaced);
  
  // Calculate effective pages for display
  const effectivePages = isSingleSpaced ? pages * 2 : pages;

  return {
    orderId,
    pages,
    assignmentFee: assignFee,
    deliveryFee: submitFee,
    totalPotentialEarnings: assignFee + submitFee,
    breakdown: {
      assignmentFeeDescription: `KSh ${assignFee} flat fee for assigning the order`,
      deliveryFeeDescription: effectivePages > 0
        ? `KSh 10 base + KSh 5 × ${Math.max(effectivePages - 1, 0)} extra pages = KSh ${submitFee}${isSingleSpaced ? ' (single-spaced: 2x pages)' : ''}`
        : 'KSh 0 (no pages specified)',
    },
  };
}

/**
 * Calculate commission preview for multiple orders (batch)
 * Useful for showing manager's potential earnings across assignment queue
 * 
 * @param orderIds - Array of order IDs
 * @returns Map of orderId → commission preview
 */
export async function getManagerCommissionBatch(
  orderIds: number[]
): Promise<Map<number, ManagerCommissionPreview>> {
  const result = new Map<number, ManagerCommissionPreview>();
  if (orderIds.length === 0) return result;

  // Actually fetch all orders at once with singleSpaced field
  const allOrders = await db
    .select({ id: jobs.id, pages: jobs.pages, singleSpaced: jobs.singleSpaced })
    .from(jobs);

  const orderMap = new Map<number, { pages: number; singleSpaced: boolean }>();
  for (const order of allOrders) {
    orderMap.set(order.id, { 
      pages: Math.max(0, Number(order.pages || 0)),
      singleSpaced: Boolean(order.singleSpaced)
    });
  }

  for (const orderId of orderIds) {
    const orderData = orderMap.get(orderId);
    if (!orderData) continue;

    const { pages, singleSpaced } = orderData;
    const assignFee = managerAssignFee();
    // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
    const submitFee = managerSubmitFee(pages, singleSpaced);
    const effectivePages = singleSpaced ? pages * 2 : pages;

    result.set(orderId, {
      orderId,
      pages,
      assignmentFee: assignFee,
      deliveryFee: submitFee,
      totalPotentialEarnings: assignFee + submitFee,
      breakdown: {
        assignmentFeeDescription: `KSh ${assignFee} flat fee for assigning the order`,
        deliveryFeeDescription: effectivePages > 0
          ? `KSh 10 base + KSh 5 × ${Math.max(effectivePages - 1, 0)} extra pages = KSh ${submitFee}${singleSpaced ? ' (single-spaced: 2x pages)' : ''}`
          : 'KSh 0 (no pages specified)',
      },
    });
  }

  return result;
}

/**
 * Get total pending commission for a manager
 * Includes orders they've assigned but not yet delivered, plus orders awaiting assignment
 * 
 * @param managerId - The manager's user ID
 * @returns Object with pendingAssignmentFees, pendingDeliveryFees, and total
 */
export async function getManagerPendingCommission(managerId: number): Promise<{
  pendingAssignmentFees: number;
  pendingDeliveryFees: number;
  totalPending: number;
  orderCount: number;
}> {
  // Find orders assigned by this manager that are still in progress
  // 🔴 CRITICAL: Include singleSpaced field for proper calculation
  const assignedOrders = await db
    .select({
      id: jobs.id,
      pages: jobs.pages,
      singleSpaced: jobs.singleSpaced,
      status: jobs.status,
      managerAssignedFee: jobs.managerAssignedFee,
      managerDeliveryFee: jobs.managerDeliveryFee,
    })
    .from(jobs)
    .where(eq(jobs.assignedById, managerId));

  let pendingAssignmentFees = 0;
  let pendingDeliveryFees = 0;
  let orderCount = 0;

  for (const order of assignedOrders) {
    // Skip if order is already completed/paid
    if (['completed', 'paid', 'cancelled'].includes(order.status || '')) continue;

    orderCount++;

    // Assignment fee is earned when manager assigns
    const assignFee = Number(order.managerAssignedFee || 0);
    if (assignFee > 0) {
      pendingAssignmentFees += assignFee;
    }

    // Delivery fee is earned when manager delivers - calculate potential
    // 🔴 CRITICAL: Pass singleSpaced for proper page calculation
    const pages = Math.max(0, Number(order.pages || 0));
    const potentialDeliveryFee = managerSubmitFee(pages, Boolean(order.singleSpaced));
    pendingDeliveryFees += potentialDeliveryFee;
  }

  return {
    pendingAssignmentFees,
    pendingDeliveryFees,
    totalPending: pendingAssignmentFees + pendingDeliveryFees,
    orderCount,
  };
}

