import { NextRequest } from 'next/server';
import { freelancerSubmitWork } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/freelancer/submit
 * 
 * Freelancer submits completed work for admin/manager review
 * 
 * Flow:
 * - Validates freelancer is the assigned freelancer
 * - Updates order status: in_progress → editing
 * - Sets submitted_at = NOW(), final_submission_complete = true
 * - Notifies admin and manager for QC review
 * - Logs to audit_logs
 * 
 * Auth: Requires freelancer role
 * 
 * Body:
 * {
 *   notes?: string  // Optional: submission notes
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order object },
 *   message: "Work submitted successfully. Awaiting admin review."
 * }
 * 
 * Note: This transitions to 'editing' status where admin/manager can:
 * - Request internal revision (status stays 'editing')
 * - Deliver to client (status → 'delivered')
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return freelancerSubmitWork(request, { params: await params });
}
