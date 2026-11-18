import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { checkForNewAssignments } from '@/lib/assignment-notifications';

/**
 * GET /api/v2/freelancer/assignments/check
 * Check for new assignments for the authenticated freelancer
 */
export async function GET(request: NextRequest) {
  try {
    // Verify freelancer authentication
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    
    // Check for new assignments
    const newAssignments = await checkForNewAssignments(user.id);

    return NextResponse.json({ 
      success: true,
      assignments: newAssignments,
      hasNew: newAssignments.length > 0
    });

  } catch (error) {
    console.error('Error checking assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

