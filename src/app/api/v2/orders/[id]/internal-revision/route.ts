import { NextRequest } from 'next/server';
import { createInternalRevision, getInternalRevisions } from '@/lib/internal-revision-helpers';

/**
 * POST /api/v2/orders/[id]/internal-revision
 * 
 * Admin/Manager requests internal revision from freelancer (QC before client delivery)
 * 
 * Flow:
 * - Creates internal_revisions record with status = 'open'
 * - Sets jobs.has_open_internal_revision = true
 * - Increments jobs.internal_revision_count
 * - DOES NOT CHANGE order.status (stays 'editing')
 * - Notifies freelancer only (client never sees this)
 * - Logs to audit_logs
 * 
 * Auth: Requires admin or manager role
 * 
 * Body:
 * {
 *   assignedTo: number,        // Freelancer ID
 *   reason: string,            // Brief reason (e.g., "Fix citations")
 *   details?: string,          // Detailed instructions
 *   requestedChanges?: object  // Structured change requests
 * }
 * 
 * Response:
 * {
 *   revision: { ... internal_revisions record },
 *   message: "Internal revision requested from freelancer"
 * }
 * 
 * Key Point: Client never knows about internal revisions. Order appears "In Progress" to them.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createInternalRevision(request, { params: await params });
}

/**
 * GET /api/v2/orders/[id]/internal-revision
 * 
 * Get all internal revisions for a specific order
 * 
 * Query Params:
 * - userId: number (for role-based filtering)
 * - role: string ('freelancer' | 'manager' | 'admin')
 * 
 * Auth: Requires admin, manager, or freelancer role
 * 
 * Response:
 * {
 *   revisions: [
 *     {
 *       id: number,
 *       orderId: number,
 *       requestedBy: number,
 *       assignedTo: number,
 *       reason: string,
 *       details: string,
 *       status: 'open' | 'submitted' | 'closed',
 *       createdAt: string,
 *       submittedAt?: string,
 *       reviewedAt?: string
 *     }
 *   ]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return new Response(JSON.stringify({ error: 'Invalid order id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return getInternalRevisions(request, { orderId });
}
