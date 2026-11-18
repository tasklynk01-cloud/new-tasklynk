import { NextRequest } from 'next/server';
import { clientApproveOrder } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/approve
 * 
 * Client approves delivered work (CRITICAL FINANCIAL TRANSACTION)
 * 
 * Flow:
 * - Validates order is 'delivered' and not already invoiced
 * - Gets freelancer's completed orders count for CPP level
 * - Calculates all financial components:
 *   - Client amount: pages × clientCpp + slides × 150
 *   - Freelancer amount: CPP-level based payout
 *   - Manager assigned fee: 10 KES (flat)
 *   - Manager delivery fee: 10 + 5 × (pages - 1) KES
 *   - Admin profit: remainder
 * - ATOMIC TRANSACTION:
 *   - Updates jobs table with all amounts and is_invoiced = true
 *   - Updates balances table (freelancer + manager): pending_balance += amount
 *   - Creates payments record with status = 'pending'
 *   - Logs to audit_logs
 *   - Sends notifications
 * - Updates order status: delivered → approved
 * - Sets approved_at = NOW()
 * 
 * Auth: Requires client role
 * 
 * Body:
 * {
 *   rating?: number,         // Optional: 1-5 star rating
 *   feedback?: string        // Optional: client feedback
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order with financial breakdown },
 *   balances: {
 *     freelancer: { pending: number, total_earned: number },
 *     manager: { pending: number, total_earned: number }
 *   },
 *   message: "Order approved successfully. Balances updated."
 * }
 * 
 * Note: This is the ONLY place where financial balances are calculated and invoiced.
 * Double-invoicing is prevented by the is_invoiced flag.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return clientApproveOrder(request, { params: await params });
}