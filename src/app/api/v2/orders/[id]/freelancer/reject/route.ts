import { NextRequest } from 'next/server';
import { freelancerRejectOrder } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/freelancer/reject
 * 
 * Freelancer rejects an assigned order
 * 
 * Flow:
 * - Validates freelancer is the assigned freelancer
 * - Updates order status: assigned → accepted (order needs reassignment)
 * - Clears assigned_freelancer_id
 * - Sets freelancer_rejected = true, freelancer_rejected_at = NOW()
 * - Clears freelancer_response_pending flag
 * - Notifies admin and manager (order needs new assignment)
 * - Logs to audit_logs
 * 
 * Auth: Requires freelancer role
 * 
 * Body:
 * {
 *   reason?: string  // Optional: reason for rejection
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order object },
 *   message: "Assignment rejected. Order returned to pool."
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return freelancerRejectOrder(request, { params: await params });
}
