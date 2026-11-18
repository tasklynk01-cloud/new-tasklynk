/**
 * Freelancer CPP Utilities
 * 
 * Helper functions to fetch freelancer's CPP level and calculate earnings
 * based on their current tier/completed orders count
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  calculateWriterEarningsByCPPLevel, 
  getFreelancerCPPRate
} from './payment-calculations';
import { getCPPLevelByOrderCount, getCurrentCPP, isWorkTypeTechnical } from './cpp-calculation';

/**
 * Get freelancer's completed orders count from database
 */
export async function getFreelancerCompletedOrders(freelancerId: number): Promise<number> {
  try {
    const [freelancer] = await db
      .select({ completedJobs: users.completedJobs })
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1);
    
    return freelancer?.completedJobs ?? 0;
  } catch (error) {
    console.error('Error fetching freelancer completed orders:', error);
    return 0;
  }
}

/**
 * Calculate freelancer earnings with their actual CPP tier
 */
export async function calculateFreelancerEarningsWithTier(
  freelancerId: number,
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined,
  singleSpaced: boolean = false
): Promise<number> {
  const completedOrders = await getFreelancerCompletedOrders(freelancerId);
  return calculateWriterEarningsByCPPLevel(pages, slides, workType, completedOrders, singleSpaced);
}

/**
 * Get freelancer's current CPP rate based on their tier
 */
export async function getFreelancerCurrentCPP(
  freelancerId: number,
  workType: string | null | undefined
): Promise<number> {
  const completedOrders = await getFreelancerCompletedOrders(freelancerId);
  const isTechnical = isWorkTypeTechnical(workType || '');
  return getCurrentCPP(completedOrders, isTechnical);
}

/**
 * Get freelancer's CPP level information
 */
export async function getFreelancerCPPLevel(freelancerId: number) {
  const completedOrders = await getFreelancerCompletedOrders(freelancerId);
  const cppLevel = getCPPLevelByOrderCount(completedOrders);
  
  return {
    completedOrders,
    level: cppLevel.level,
    levelName: cppLevel.levelName,
    cppNonTechnical: cppLevel.cppNonTechnical,
    cppTechnical: cppLevel.cppTechnical,
    description: cppLevel.description,
  };
}

/**
 * Client-side helper to calculate earnings with provided completed orders
 * (Use when you already have the freelancer's completed orders count)
 */
export function calculateEarningsWithCPPLevel(
  completedOrders: number,
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined,
  singleSpaced: boolean = false
): number {
  return calculateWriterEarningsByCPPLevel(pages, slides, workType, completedOrders, singleSpaced);
}

/**
 * Get CPP rate for display purposes (client-side)
 */
export function getCPPRateForDisplay(
  completedOrders: number,
  workType: string | null | undefined
): number {
  const isTechnical = isWorkTypeTechnical(workType || '');
  return getCurrentCPP(completedOrders, isTechnical);
}

