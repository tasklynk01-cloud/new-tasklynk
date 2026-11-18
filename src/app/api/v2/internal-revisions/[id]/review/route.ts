import { NextRequest } from 'next/server';
import { reviewInternalRevision } from '@/lib/internal-revision-helpers';

/**
 * POST /api/v2/internal-revisions/[id]/review
 * 
 * Admin/Manager reviews freelancer's internal revision submission
 * 
 * Flow:
 * - Validates requester is admin or manager
 * - Action: 'accept'
 *   - Updates status: submitted → closed
 *   - Sets reviewed_at = NOW()
 *   - Clears jobs.has_open_internal_revision (if no other open revisions)
 *   - Order ready for delivery to client
 * - Action: 'request_more'
 *   - Updates status: submitted → open
 *   - Adds additional feedback/notes
 *   - Notifies freelancer
 * - Logs to audit_logs
 * 
 * Auth: Requires admin or manager role
 * 
 * Body:
 * {
 *   action: 'accept' | 'request_more',
 *   reviewNotes?: string,          // Optional: feedback notes
 *   additionalChanges?: string     // Required if action = 'request_more'
 * }
 * 
 * Response:
 * {
 *   revision: { ... updated internal_revisions record },
 *   order: { ... updated order if revision accepted },
 *   message: "Internal revision accepted" | "Additional changes requested"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return reviewInternalRevision(request, { params: await params });
}
