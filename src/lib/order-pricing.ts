import {
  calculateUrgentSurcharge,
  calculateWriterEarningsByCPPLevel,
  clientMinCPP,
  clientMinCPS,
  isTechnicalWorkType,
  isUrgentOrder,
} from '@/lib/payment-calculations';

export type ComputeOrderPricingInput = {
  workType: string;
  category?: string | null | undefined;
  isNonAcademic?: boolean | null | undefined;
  pages?: number | string | null | undefined;
  slides?: number | string | null | undefined;
  clientCpp?: number | string | null | undefined;
  amount?: number | string | null | undefined;
  deadline?: string | Date | null | undefined;
  singleSpaced?: boolean | null | undefined;
};

export type ComputeOrderPricingResult = {
  isSlidesOrder: boolean;
  isNonAcademic?: boolean;
  pages: number;
  slides: number;
  units: number;
  effectiveUnits: number;
  clientCpp: number;
  minimumClientCpp: number;
  baseClientTotal: number;
  urgentSurcharge: number;
  isUrgent: boolean;
  clientTotal: number;
  urgencyMultiplier: number;
  serviceType: 'writing_page' | 'technical_page' | 'slide' | 'non_academic';
  parsedDeadline: Date;
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value));
  return Number.isFinite(n) ? n : null;
}

export function computeOrderPricing(input: ComputeOrderPricingInput): ComputeOrderPricingResult {
  const workType = String(input.workType || '').trim();
  if (!workType) {
    throw new Error('workType is required');
  }

  const isNonAcademic = Boolean(input.isNonAcademic) || Boolean(input.category && input.category !== 'academic');

  // Handle non-academic professional service orders
  if (isNonAcademic) {
    const amountProvided = toNumberOrNull(input.amount);
    if (amountProvided === null || amountProvided <= 0) {
      throw new Error('Please provide a valid budget or order amount greater than zero.');
    }
    const clientTotal = Math.round(amountProvided * 100) / 100;
    const parsedDeadline = input.deadline
      ? new Date(input.deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return {
      isSlidesOrder: false,
      isNonAcademic: true,
      pages: 0,
      slides: 0,
      units: 1,
      effectiveUnits: 1,
      clientCpp: clientTotal,
      minimumClientCpp: 240,
      baseClientTotal: clientTotal,
      urgentSurcharge: 0,
      isUrgent: false,
      clientTotal,
      urgencyMultiplier: 1,
      serviceType: 'non_academic',
      parsedDeadline,
    };
  }

  const pagesRaw = toNumberOrNull(input.pages);
  const slidesRaw = toNumberOrNull(input.slides);

  // jobs.pages/jobs.slides are integer columns - a fractional value here
  // (e.g. a word-count-derived 2.9 pages) would insert cleanly through
  // pricing math but fail at the database with "invalid input syntax for
  // type integer". Round up so partial pages/slides are never undercharged
  // and the value is always safe to store.
  const pages = Math.max(0, Math.ceil(pagesRaw || 0));
  const slides = Math.max(0, Math.ceil(slidesRaw || 0));
  const singleSpaced = Boolean(input.singleSpaced);

  // Slides-order detection: explicit "slides" OR provided slides with no pages
  const isSlidesOrder = workType.toLowerCase() === 'slides' || (slides > 0 && pages === 0);
  const units = isSlidesOrder ? slides : pages;

  // Pricing is based on EFFECTIVE pages for single-spaced orders.
  // Physical pages stay the same, but the payable units double.
  const pageMultiplier = !isSlidesOrder && singleSpaced ? 2 : 1;
  const effectiveUnits = units * pageMultiplier;

  if (!Number.isFinite(units) || units <= 0) {
    throw new Error('Please provide a valid number of pages or slides greater than zero.');
  }

  const clientCppProvided = toNumberOrNull(input.clientCpp);
  const amountProvided = toNumberOrNull(input.amount);

  // If only a total amount is provided, derive CPP/CPS from the physical units.
  // For single-spaced page-orders: total = cpp * pages * 2.
  const derivedCpp = amountProvided !== null && amountProvided > 0 ? amountProvided / effectiveUnits : null;
  const clientCpp = Math.round(Number((clientCppProvided ?? derivedCpp) || 0) * 100) / 100;

  if (!Number.isFinite(clientCpp) || clientCpp <= 0) {
    throw new Error('Client rate (CPP/CPS) is required.');
  }

  const minimumClientCpp = isSlidesOrder ? clientMinCPS() : clientMinCPP(workType);
  if (clientCpp < minimumClientCpp) {
    throw new Error(
      `Client rate must be at least KSh ${minimumClientCpp} per ${isSlidesOrder ? 'slide' : 'page'} for this order type.`
    );
  }

  const baseClientTotal = Math.round(clientCpp * effectiveUnits * 100) / 100;

  const parsedDeadline = input.deadline
    ? new Date(input.deadline)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const urgentSurcharge = calculateUrgentSurcharge(parsedDeadline, baseClientTotal);
  const isUrgent = isUrgentOrder(parsedDeadline);
  const clientTotal = Math.round((baseClientTotal + urgentSurcharge) * 100) / 100;
  const urgencyMultiplier = baseClientTotal > 0 ? clientTotal / baseClientTotal : 1;

  const serviceType: ComputeOrderPricingResult['serviceType'] = isSlidesOrder
    ? 'slide'
    : isTechnicalWorkType(workType)
      ? 'technical_page'
      : 'writing_page';

  return {
    isSlidesOrder,
    pages,
    slides,
    units,
    effectiveUnits,
    clientCpp,
    minimumClientCpp,
    baseClientTotal,
    urgentSurcharge,
    isUrgent,
    clientTotal,
    urgencyMultiplier,
    serviceType,
    parsedDeadline,
  };
}

/**
 * Check if work type is a slides-based order
 */
function isSlidesWorkType(workType: string | null | undefined): boolean {
  if (!workType) return false;
  const w = workType.toLowerCase();
  return w.includes('slide') || w.includes('presentation') || w.includes('powerpoint');
}

/**
 * Derive pages or slides from amount when missing
 * Uses clientCpp or minimum CPP/CPS to reverse-calculate
 * 
 * @param amount - Client total amount
 * @param workType - Work type for determining minimum CPP/CPS and whether slides
 * @param clientCpp - Client CPP/CPS rate (optional, uses minimum if not provided)
 * @param singleSpaced - Whether order is single-spaced (only applies to pages)
 * @returns Object with derived pages and slides
 */
export function deriveUnitsFromAmount(
  amount: number | null | undefined,
  workType: string | null | undefined,
  clientCpp: number | null | undefined,
  singleSpaced: boolean = false
): { pages: number; slides: number } {
  const amt = Number(amount || 0);
  if (amt <= 0) return { pages: 0, slides: 0 };
  
  // Check if this is a slides-based order
  if (isSlidesWorkType(workType)) {
    // Use provided clientCpp or fall back to minimum CPS (150)
    const cps = Number(clientCpp || 0) || clientMinCPS();
    const derivedSlides = Math.max(1, Math.round(amt / cps));
    return { pages: 0, slides: derivedSlides };
  }
  
  // Page-based order
  // Use provided clientCpp or fall back to minimum CPP
  const cpp = Number(clientCpp || 0) || clientMinCPP(workType);
  if (cpp <= 0) return { pages: 0, slides: 0 };
  
  // For single-spaced, client pays 2x per page
  const effectiveMultiplier = singleSpaced ? 2 : 1;
  const derivedPages = amt / (cpp * effectiveMultiplier);
  
  return { pages: Math.max(1, Math.round(derivedPages)), slides: 0 };
}

/**
 * Derive pages from amount when pages/slides are missing (backward compatibility)
 * Uses clientCpp or minimum CPP to reverse-calculate
 * 
 * @param amount - Client total amount
 * @param workType - Work type for determining minimum CPP
 * @param clientCpp - Client CPP rate (optional, uses minimum if not provided)
 * @param singleSpaced - Whether order is single-spaced
 * @returns Derived number of pages
 */
export function derivePagesFromAmount(
  amount: number | null | undefined,
  workType: string | null | undefined,
  clientCpp: number | null | undefined,
  singleSpaced: boolean = false
): number {
  const amt = Number(amount || 0);
  if (amt <= 0) return 0;
  
  // Use provided clientCpp or fall back to minimum
  const cpp = Number(clientCpp || 0) || clientMinCPP(workType);
  if (cpp <= 0) return 0;
  
  // For single-spaced, client pays 2x per page, so divide by 2 to get physical pages
  // Then the calculation will multiply back by 2 for effective pages
  const effectiveMultiplier = singleSpaced ? 2 : 1;
  const derivedPages = amt / (cpp * effectiveMultiplier);
  
  return Math.max(1, Math.round(derivedPages)); // At least 1 page
}

/**
 * Get the freelancer earnings for an order.
 * 
 * CRITICAL: This function provides a UNIFIED way to get freelancer earnings:
 * 1. PREFER stored `freelancerEarnings` from database (already calculated at assignment time)
 * 2. FALLBACK to recalculation only if not stored (for estimates or legacy orders)
 * 3. DERIVES pages from amount if pages/slides are missing
 * 
 * This ensures consistency across all pages displaying freelancer financial data.
 * 
 * @param order - Order object with freelancerEarnings, pages, slides, workType, amount, singleSpaced
 * @param completedJobs - Freelancer's completed jobs count (for fallback calculation)
 * @returns The freelancer earnings amount
 */
export function getFreelancerEarnings(
  order: {
    freelancerEarnings?: number | null;
    pages?: number | null;
    slides?: number | null;
    workType?: string | null;
    amount?: number | null;
    clientCpp?: number | null;
    singleSpaced?: boolean | null;
  },
  completedJobs: number = 0
): number {
  // PRIORITY 1: Use stored earnings from database (calculated at assignment time)
  if (order.freelancerEarnings !== null && order.freelancerEarnings !== undefined && order.freelancerEarnings > 0) {
    return Math.round(order.freelancerEarnings * 100) / 100;
  }

  // Get pages and slides, deriving from amount if not provided
  let pages = Number(order.pages || 0);
  let slides = Number(order.slides || 0);
  const singleSpaced = Boolean(order.singleSpaced);
  
  // If no pages/slides but we have amount, derive units from amount
  // This handles both page-based and slide-based orders
  if (pages === 0 && slides === 0 && Number(order.amount || 0) > 0) {
    const derivedUnits = deriveUnitsFromAmount(order.amount, order.workType, order.clientCpp, singleSpaced);
    pages = derivedUnits.pages;
    slides = derivedUnits.slides;
    console.log('[getFreelancerEarnings] Derived units from amount:', {
      amount: order.amount,
      workType: order.workType,
      clientCpp: order.clientCpp,
      singleSpaced,
      derivedPages: pages,
      derivedSlides: slides
    });
  }

  // PRIORITY 2: Calculate using CPP level system with singleSpaced support
  const calculated = calculateWriterEarningsByCPPLevel(
    pages,
    slides,
    order.workType,
    completedJobs,
    singleSpaced
  );
  return Math.round(calculated * 100) / 100;
}

/**
 * Calculate total earnings from an array of orders.
 * Uses getFreelancerEarnings for consistency.
 * 
 * @param orders - Array of orders
 * @param completedJobs - Freelancer's completed jobs count (for fallback)
 * @returns Total earnings sum
 */
export function getTotalFreelancerEarnings(
  orders: Array<{
    freelancerEarnings?: number | null;
    pages?: number | null;
    slides?: number | null;
    workType?: string | null;
    amount?: number | null;
    clientCpp?: number | null;
    singleSpaced?: boolean | null;
  }>,
  completedJobs: number = 0
): number {
  const total = orders.reduce((sum, order) => {
    return sum + getFreelancerEarnings(order, completedJobs);
  }, 0);
  return Math.round(total * 100) / 100;
}

