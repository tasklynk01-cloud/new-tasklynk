import { NextRequest } from 'next/server';
import { submitInternalRevision } from '@/lib/internal-revision-helpers';

/**
 * POST /api/v2/internal-revisions/[id]/submit
 * 
 * Freelancer submits work for an internal revision
 * 
 * Flow:
 * - Validates freelancer is the assigned freelancer
 * - Updates internal_revisions status: open → submitted
 * - Sets submitted_at = NOW()
 * - Order status remains unchanged (stays 'editing')
 * - Notifies requester (admin/manager)
 * - Logs to audit_logs
 * 
 * Auth: Requires freelancer role
 * 
 * Body:
 * {
 *   submissionNotes?: string  // Optional: notes about changes made
 * }
 * 
 * Response:
 * {
 *   revision: { ... updated internal_revisions record },
 *   message: "Internal revision submitted for review"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return submitInternalRevision(request, { params: await params });
}
