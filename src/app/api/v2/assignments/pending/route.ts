import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, freelancerOrderResponses } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/assignments/pending
 * Get pending assignments for the authenticated freelancer
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate as freelancer
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const freelancer = authCheck.user;

    // Find all jobs assigned to this freelancer with pending response (status is in_progress but not yet accepted)
    const assignedJobs = await db.select()
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancer.id),
          eq(jobs.status, 'in_progress'),
          eq(jobs.freelancerResponsePending, true)
        )
      );

    const jobIds = assignedJobs.map((job) => job.id);
    let respondedJobIds = new Set<number>();

    if (jobIds.length > 0) {
      const responses = await db.select({ jobId: freelancerOrderResponses.jobId })
        .from(freelancerOrderResponses)
        .where(
          and(
            eq(freelancerOrderResponses.freelancerId, freelancer.id),
            inArray(freelancerOrderResponses.jobId, jobIds)
          )
        );

      respondedJobIds = new Set(responses.map((response) => response.jobId));
    }

    const pendingAssignments = assignedJobs
      .filter((job) => !respondedJobIds.has(job.id))
      .map((job) => ({
        id: job.id,
        displayId: job.displayId,
        orderId: job.orderId,
        title: job.title,
        description: job.instructions,
        instructions: job.instructions,
        pages: job.pages,
        slides: job.slides,
        workType: job.workType,
        deadline: job.freelancerDeadline || job.deadline,
        freelancerDeadline: job.freelancerDeadline,
        assignedAt: job.assignedAt,
        clientId: job.clientId,
        freelancerEarnings: job.freelancerEarnings ?? null,
        freelancerResponsePending: Boolean(job.freelancerResponsePending),
      }));

    return NextResponse.json({
      success: true,
      pendingAssignments,
      count: pendingAssignments.length,
    });
  } catch (error) {
    console.error('Get pending assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending assignments' },
      { status: 500 }
    );
  }
}

