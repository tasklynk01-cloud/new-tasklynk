import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions, submissionFiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/freelancer/submissions
 * Get submissions for a specific job and writer
 * 
 * Auth: Requires freelancer role OR admin/manager viewing submissions
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    const writerId = request.nextUrl.searchParams.get('writerId');

    if (!jobId || !writerId) {
      return NextResponse.json(
        { error: 'Missing jobId or writerId' },
        { status: 400 }
      );
    }

    // Authenticate user - allow freelancer, admin, manager
    const authCheck = await requireRole(request, ['freelancer', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const authenticatedUser = authCheck.user;

    // Ensure freelancers can only view their own submissions
    if (authenticatedUser.role === 'freelancer' && authenticatedUser.id !== parseInt(writerId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot view other freelancer submissions' },
        { status: 403 }
      );
    }

    const allSubmissions = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.jobId, parseInt(jobId)),
          eq(submissions.writerId, parseInt(writerId))
        )
      );

    return NextResponse.json({ submissions: allSubmissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/freelancer/submissions
 * Create a new submission
 * 
 * Auth: Requires freelancer role
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - only freelancers can submit
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const authenticatedUser = authCheck.user;

    const body = await request.json();
    const {
      jobId,
      writerId,
      submissionType,
      content,
      wordCount,
      files,
    } = body;

    if (!jobId || !writerId || !submissionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure freelancers can only submit their own work
    if (authenticatedUser.id !== writerId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot submit work for other freelancers' },
        { status: 403 }
      );
    }

    // Create submission
    const newSubmission = await db
      .insert(submissions)
      .values({
        jobId,
        writerId,
        submissionType,
        content: content || '',
        wordCount: wordCount || 0,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Add files if provided
    if (files && files.length > 0 && newSubmission[0]) {
      const submissionId = newSubmission[0].id;
      for (const file of files) {
        await db.insert(submissionFiles).values({
          submissionId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          fileType: file.fileType,
          uploadedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission: newSubmission[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

