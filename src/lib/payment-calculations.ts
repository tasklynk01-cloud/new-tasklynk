/**
 * Centralized payment calculation functions for TaskLynk
 *
 * OLD model (still used as fallback):
 * - Minimum client cost-per-page (CPP) = KSh 240 (validation handled server-side)
 * - Minimum client cost-per-slide (CPS) = KSh 150
 * - Writer CPP: legacy fallback now derives from CPP level system (Starter tier baseline)
 * - Writer CPS (slides): 100
 * - Manager earnings: 10 on assign; on submit 10 + 5 * (pages - 1)
 * - Admin profit = client payment - (writer payout + manager payouts)
 *
 * NEW CPP LEVEL SYSTEM (Primary):
 * - Freelancers progress through 5 tiers: Starter (150) → Rising (160) → Established (170) → Expert (180) → Master (200)
 * - Technical work adds +20 CPP bonus across all tiers
 * - Progress based on completed orders: 3 → 5 → 15 → 27 → ∞
 */

import { getCurrentCPP, isWorkTypeTechnical } from './cpp-calculation';

const TECHNICAL_KEYWORDS = [
  'excel',
  'spss',
  'stata',
  'r ',
  ' r',
  'python',
  'data analysis',
  'programming',
  'powerpoint',
  'presentation',
  'technical',
  'coding',
  'jasp',
  'jamovi'
];

export function isTechnicalWorkType(workType: string | null | undefined): boolean {
  if (!workType) return false;
  const t = workType.toLowerCase();
  return TECHNICAL_KEYWORDS.some((k) => t.includes(k));
}

/** Return writer CPP based on work type and completed orders (legacy helper) */
export function writerCPP(workType: string | null | undefined, completedOrders: number = 0): number {
  const isTechnical = isTechnicalWorkType(workType);
  return getCurrentCPP(completedOrders, isTechnical);
}

/** Writer compensation per slide */
export function writerPerSlide(): number {
  return 100;
}

/** Client minimum CPP - 240 for regular, 270 for technical */
export function clientMinCPP(workType?: string | null | undefined): number {
  return isTechnicalWorkType(workType) ? 270 : 240;
}

/** Client minimum CPS */
export function clientMinCPS(): number {
  return 150;
}

/** Calculate writer payout based on pages and work type CPP (legacy helper: pages only) */
export function calculateWriterPayout(
  pages: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0
): number {
  const p = Math.max(0, Number(pages || 0));
  return Math.round(p * writerCPP(workType, completedOrders) * 100) / 100;
}

/** Calculate writer payout including pages and slides */
export function calculateWriterEarnings(
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0,
  singleSpaced: boolean = false
): number {
  // Use the new CPP level system with single-spaced support
  return calculateWriterEarningsByCPPLevel(pages, slides, workType, completedOrders, singleSpaced);
}

/** Minimum client amount required by pages */
export function minRequiredClientAmount(pages: number | null | undefined, workType?: string | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  return p * clientMinCPP(workType);
}

/** Minimum client amount required by slides */
export function minRequiredClientSlideAmount(slides: number | null | undefined): number {
  const s = Math.max(0, Number(slides || 0));
  return s * clientMinCPS();
}

/** Manager earnings helpers */
export function managerAssignFee(): number {
  return 10;
}

/**
 * Calculate manager submit fee based on effective pages
 * @param pages Number of pages
 * @param singleSpaced If true, pages are doubled for calculation
 */
export function managerSubmitFee(pages: number | null | undefined, singleSpaced: boolean = false): number {
  const p = Math.max(0, Number(pages || 0));
  if (p <= 0) return 0;
  
  // 🔴 CRITICAL: For single-spaced orders, double the page count for manager fees too
  const pageMultiplier = singleSpaced ? 2 : 1;
  const effectivePages = p * pageMultiplier;
  
  return 10 + 5 * Math.max(effectivePages - 1, 0);
}

/**
 * Calculate manager earnings based on WHO assigned and WHO delivered
 * 
 * Rules:
 * - Admin actions NEVER generate manager earnings
 * - Manager who assigns gets assignment fee (if they're a manager)
 * - Manager who delivers gets delivery fee (if they're a manager)
 * - Admins cannot earn management income
 * 
 * @param params.assignedByRole - Role of user who assigned ('admin' or 'manager')
 * @param params.assignedByUserId - User ID who assigned (null if no one)
 * @param params.deliveredByRole - Role of user who delivered ('admin' or 'manager')
 * @param params.deliveredByUserId - User ID who delivered (null if not delivered)
 * @param params.pages - Number of pages for delivery fee calculation
 * @param params.singleSpaced - Whether order is single-spaced (doubles page count)
 * @returns Object with assignmentFee, deliveryFee, assignerId, delivererId
 */
export function calculateManagerEarningsV2(params: {
  assignedByRole: string | null;
  assignedByUserId: number | null;
  deliveredByRole: string | null;
  deliveredByUserId: number | null;
  pages: number | null | undefined;
  singleSpaced?: boolean;
}): {
  assignmentFee: number;
  deliveryFee: number;
  assignedByManagerId: number | null;
  deliveredByManagerId: number | null;
} {
  let assignmentFee = 0;
  let deliveryFee = 0;
  let assignedByManagerId = null;
  let deliveredByManagerId = null;

  // Assignment Fee: Only if assigned BY a manager
  if (params.assignedByRole === 'manager' && params.assignedByUserId) {
    assignmentFee = managerAssignFee();
    assignedByManagerId = params.assignedByUserId;
  }
  // If admin assigned: NO assignment fee for anyone

  // Delivery Fee: Only if delivered BY a manager
  // 🔴 CRITICAL: Pass singleSpaced flag for proper page calculation
  if (params.deliveredByRole === 'manager' && params.deliveredByUserId) {
    deliveryFee = managerSubmitFee(params.pages, params.singleSpaced || false);
    deliveredByManagerId = params.deliveredByUserId;
  }
  // If admin delivered: NO delivery fee for anyone

  return {
    assignmentFee: Math.round(assignmentFee * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    assignedByManagerId,
    deliveredByManagerId,
  };
}

/**
 * @deprecated Use calculateManagerEarningsV2 for proper role-based manager earnings
 */
export function calculateManagerEarnings(params: { assigned: boolean; submitted: boolean; pages: number | null | undefined }): number {
  let total = 0;
  if (params.assigned) total += managerAssignFee();
  if (params.submitted) total += managerSubmitFee(params.pages);
  return Math.round(total * 100) / 100;
}

/**
 * Backward-compat: previously returned 70% of client payment.
 * Now returns 0 and callers should switch to calculateWriterPayout/calculateWriterEarnings.
 */
export function calculateFreelancerAmount(_clientPayment: number): number {
  return 0;
}

/**
 * NEW CPP LEVEL SYSTEM - Calculate writer payout based on CPP tier
 * @param pages Number of pages
 * @param workType Type of work (determines if technical)
 * @param completedOrders Number of orders the freelancer has completed (determines CPP level)
 * @param singleSpaced Whether the order is single-spaced (doubles effective pages)
 * @returns Calculated writer payout
 */
export function calculateWriterPayoutByCPPLevel(
  pages: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0,
  singleSpaced: boolean = false
): number {
  // Use the comprehensive earnings calculation with 0 slides
  return calculateWriterEarningsByCPPLevel(pages, 0, workType, completedOrders, singleSpaced);
}

/**
 * NEW CPP LEVEL SYSTEM - Calculate total writer earnings (pages + slides) based on CPP tier
 * @param pages Number of pages (will be auto-detected if not provided)
 * @param slides Number of slides (will be auto-detected if not provided)
 * @param workType Type of work (determines if technical)
 * @param completedOrders Number of orders the freelancer has completed (determines CPP level)
 * @param singleSpaced Whether the order is single-spaced (doubles effective pages)
 * @returns Calculated total writer earnings (minimum 150 KES for any valid order)
 */
export function calculateWriterEarningsByCPPLevel(
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0,
  singleSpaced: boolean = false
): number {
  // 🔴 AUTO-DETECT: If pages not provided but slides are, assume 0 pages
  // If slides not provided but pages are, assume 0 slides
  let p = Math.max(0, Number(pages || 0));
  let s = Math.max(0, Number(slides || 0));
  
  // 🔴 CRITICAL: For single-spaced orders, double the page count
  // Single-spaced = 2x content density = 2x payment
  const pageMultiplier = singleSpaced ? 2 : 1;
  const effectivePages = p * pageMultiplier;
  
  const isTechnical = isWorkTypeTechnical(workType || '');
  const cppRate = getCurrentCPP(completedOrders, isTechnical);
  
  // Calculate base amount using effective pages (doubled for single-spaced)
  let amount = effectivePages * cppRate + s * writerPerSlide();
  
  // 🔴 MINIMUM EARNINGS GUARANTEE: Only for zero-content orders
  // If pages and slides are both 0, assume minimum 1 page of work
  if (p === 0 && s === 0) {
    // Use minimum 1 page at Starter tier rate (150 for non-tech, 170 for tech)
    const minCPP = isTechnical ? 170 : 150;
    amount = minCPP;
    console.warn('[Payment Calculation] Zero pages/slides detected, applying minimum earnings:', minCPP);
  }
  // 🔴 REMOVED: Don't force minimum 150 for valid calculations
  // The old logic (amount > 0 && amount < 150) was causing multi-page orders to be stuck at 150
  
  console.log('[Payment Calculation] Writer earnings:', {
    pages: p,
    slides: s,
    singleSpaced,
    effectivePages,
    cppRate,
    isTechnical,
    amount: Math.round(amount * 100) / 100
  });
  
  return Math.round(amount * 100) / 100;
}

/**
 * Get current CPP rate for a freelancer (wrapper for easier use)
 */
export function getFreelancerCPPRate(
  workType: string | null | undefined,
  completedOrders: number = 0
): number {
  const isTechnical = isWorkTypeTechnical(workType || '');
  return getCurrentCPP(completedOrders, isTechnical);
}

/**
 * Calculate urgent order surcharge based on deadline
 * @param deadline - Order deadline date
 * @param baseAmount - Base order amount
 * @returns Surcharge amount (40-60 KES) or 0 if not urgent
 */
export function calculateUrgentSurcharge(deadline: string | Date | null | undefined, baseAmount: number): number {
  if (!deadline) return 0;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Urgent: less than 8 hours
  if (hoursUntilDeadline < 8 && hoursUntilDeadline > 0) {
    // Calculate surcharge: 40-60 KES based on urgency
    // More urgent = higher surcharge
    if (hoursUntilDeadline < 3) {
      return 60; // Very urgent (0-3 hours)
    } else if (hoursUntilDeadline < 5) {
      return 50; // Urgent (3-5 hours)
    } else {
      return 40; // Moderately urgent (5-8 hours)
    }
  }
  
  return 0; // Not urgent
}

/**
 * Check if order is urgent (deadline within 8 hours)
 * @param deadline - Order deadline date
 * @returns true if urgent, false otherwise
 */
export function isUrgentOrder(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilDeadline < 8 && hoursUntilDeadline > 0;
}

/**
 * Calculate total client amount including urgent surcharge
 * @param baseAmount - Base order amount
 * @param deadline - Order deadline date
 * @returns Total amount with surcharge if urgent
 */
export function calculateClientAmountWithSurcharge(
  baseAmount: number,
  deadline: string | Date | null | undefined
): number {
  const surcharge = calculateUrgentSurcharge(deadline, baseAmount);
  return Math.round((baseAmount + surcharge) * 100) / 100;
}

/**
 * Backward-compat: previously returned 30% of client payment.
 * Now returns 0 and callers should compute admin profit as
 * (client amount) - (writer payout + manager payouts).
 */
export function calculateAdminCommission(_clientPayment: number): number {
  return 0;
}

