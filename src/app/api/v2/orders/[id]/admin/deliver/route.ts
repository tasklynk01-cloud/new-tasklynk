import { NextRequest } from 'next/server';
import { deliverToClient } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/admin/deliver
 * 
 * Admin/Manager delivers completed work to client for review
 * 
 * Flow:
 * - Validates no open internal revisions (has_open_internal_revision = false)
 * - Calculates manager delivery fee: 10 + 5 × (pages - 1) KES
 * - Updates order status: editing → delivered
 * - Sets delivered_at = NOW()
 * - Updates manager_delivery_fee in jobs table
 * - Notifies client that work is ready for review
 * - Logs to audit_logs
 * 
 * Auth: Requires admin or manager role
 * 
 * Body:
 * {
 *   deliveryNotes?: string  // Optional: notes for client
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order object },
 *   managerDeliveryFee: number,
 *   message: "Work delivered to client. Awaiting approval."
 * }
 * 
 * Note: Client can now approve or request revision
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return deliverToClient(request, { params: await params });
}
