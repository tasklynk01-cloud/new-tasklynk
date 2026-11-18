import { NextRequest } from 'next/server';
import { freelancerAcceptOrder } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/freelancer/accept
 * 
 * Freelancer accepts an assigned order
 * 
 * Flow:
 * - Validates freelancer is the assigned freelancer
 * - Updates order status: assigned → in_progress
 * - Sets freelancer_accepted = true, freelancer_accepted_at = NOW()
 * - Clears freelancer_response_pending flag
 * - Notifies admin, manager, and client
 * - Logs to audit_logs
 * 
 * Auth: Requires freelancer role
 * 
 * Body: None required
 * 
 * Response:
 * {
 *   order: { ... updated order object },
 *   message: "Assignment accepted successfully"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return freelancerAcceptOrder(request, { params: await params });
}
