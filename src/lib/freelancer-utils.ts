// Freelancer utilities - extracted to avoid HMR issues

export const STATUS_MAP: Record<string, string[]> = {
  'on-hold': ['on_hold', 'on-hold'],
  'in-progress': ['in_progress'], // assigned removed - goes directly to in_progress
  'editing': ['editing'],
  'done': ['delivered'],
  'delivered': ['delivered'],
  'revision': ['revision'],
  'approved': ['approved'],
  'completed': ['completed'],
  'cancelled': ['cancelled', 'canceled'],
};

import { calculateWriterEarningsByCPPLevel, calculateWriterPayoutByCPPLevel } from '@/lib/payment-calculations';

/**
 * Calculate freelancer earnings based on CPP tier model
 * Uses freelancer's tier based on completed jobs count
 * Formula: pages * tier_rate + slides * 100
 * Note: Slides are always 100 KSh regardless of tier
 */
export const calculateFreelancerEarnings = (
  pages: number, 
  workType?: string, 
  slides?: number, 
  completedJobs?: number
): number => {
  return calculateWriterEarningsByCPPLevel(
    pages || 0,
    slides || 0,
    workType || 'general',
    completedJobs || 0
  );
};

/**
 * Calculate admin commission (now admin profit) = client amount - (writer payout + manager payouts)
 * Note: prefer computing in API using job.managerEarnings from DB. This helper is kept for compatibility.
 */
export const calculateAdminCommission = (
  clientAmount: number,
  pages = 0,
  workType?: string,
  managerTotal = 0,
  completedJobs: number = 0
): number => {
  const writer = calculateWriterPayoutByCPPLevel(pages, workType || '', completedJobs);
  const profit = clientAmount - (writer + managerTotal);
  return profit < 0 ? 0 : Math.round(profit * 100) / 100;
};

