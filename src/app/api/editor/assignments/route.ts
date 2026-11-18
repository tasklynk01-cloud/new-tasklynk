import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments } from '@/db/schema';
import { SQL, and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

const EDITING_STATUSES = [
  'pending_editing',
  'editing_in_progress',
  'awaiting_revision',
  'awaiting_admin_review',
];

type AssignmentPayload = {
  assignment: {
    id: number;
    jobId: number;
    editorId: number | null;
    approvalStatus: string;
    assignedAt: string | null;
    reviewStartedAt: string | null;
    approvalReason: string | null;
    revisionsRequested: boolean;
    revisionNotes: string | null;
    updatedAt?: string | null;
  };
  job: {
    id: number;
    title: string | null;
    displayId: string | null;
    status: string | null;
    editorStatus: string | null;
    deadline: string | null;
    pages: number | null;
    slides: number | null;
    subject: string | null;
    instructions: string | null;
    description: string | null;
    academicLevel: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  client: { name: string | null; email: string | null } | null;
};

const sanitizeClient = (role: string, name: string | null, email: string | null) => {
  if (role === 'editor') {
    return null;
  }
  return {
    name,
    email,
  };
};

const buildCsv = (assignments: AssignmentPayload[]) => {
  const header = 'Order ID,Display ID,Title,Editor Status,Assignment Status,Pages,Deadline\n';
  const rows = assignments.map((assignment) => {
    const { job, assignment: details } = assignment;
    const values = [
      job.id?.toString() ?? '',
      job.displayId ?? '',
      (job.title ?? '').replace(/\n|\r/g, ' '),
      job.editorStatus ?? '',
      details.approvalStatus ?? '',
      job.pages?.toString() ?? '',
      job.deadline ?? '',
    ];
    return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(',');
  });
  return header + rows.join('\n');
};

/**
 * GET /api/editor/assignments
 * Retrieves assignments for editors (sanitized client data)
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'all').toLowerCase();
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const requestedEditorId = searchParams.get('editorId');

    let editorId: number | null = null;
    if (authCheck.user.role === 'editor') {
      editorId = authCheck.user.id;
      if (requestedEditorId && parseInt(requestedEditorId, 10) !== authCheck.user.id) {
        return NextResponse.json(
          { error: 'Editors can only request their own assignments' },
          { status: 403 },
        );
      }
    } else if (requestedEditorId) {
      const parsed = parseInt(requestedEditorId, 10);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json(
          { error: 'editorId must be a valid integer' },
          { status: 400 },
        );
      }
      editorId = parsed;
    }

    // Load live editing queue
    const baseCondition = inArray(jobs.editorStatus, EDITING_STATUSES);

    let accessCondition: SQL<unknown> | null = null;
    if (authCheck.user.role === 'editor') {
      accessCondition = or(
        eq(jobs.assignedEditorId, authCheck.user.id),
        isNull(jobs.assignedEditorId),
      ) ?? null;
    } else if (editorId !== null) {
      accessCondition = eq(jobs.assignedEditorId, editorId);
    }

    const whereCondition = accessCondition ? and(baseCondition, accessCondition) : baseCondition;

    const editingJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        displayId: jobs.displayId,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        deadline: jobs.deadline,
        pages: jobs.pages,
        slides: jobs.slides,
        instructions: jobs.instructions,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        assignedEditorId: jobs.assignedEditorId,
      })
      .from(jobs)
      .where(whereCondition)
      .orderBy(desc(jobs.updatedAt));

    const pendingAssignments: AssignmentPayload[] = editingJobs.map((job) => ({
      assignment: {
        id: job.id,
        jobId: job.id,
        editorId: job.assignedEditorId,
        approvalStatus: 'pending',
        assignedAt: job.updatedAt ?? job.createdAt,
        reviewStartedAt: null,
        approvalReason: null,
        revisionsRequested: false,
        revisionNotes: null,
      },
      job: {
        id: job.id,
        title: job.title,
        displayId: job.displayId,
        status: job.status,
        editorStatus: job.editorStatus,
        deadline: job.deadline,
        pages: job.pages,
        slides: job.slides,
        subject: null,
        instructions: job.instructions,
        description: null,
        academicLevel: null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      client: null,
    }));

    // Load assignment history (if table exists)
    type EditorHistoryRow = {
      assignment: typeof editorAssignments.$inferSelect;
      job: typeof jobs.$inferSelect;
      client: typeof users.$inferSelect | null;
    };

    let editorHistory: EditorHistoryRow[] = [];
    try {
      const historyConditions = editorId !== null
        ? eq(editorAssignments.editorId, editorId)
        : undefined;

      if (historyConditions) {
        editorHistory = await db
          .select({
            assignment: editorAssignments,
            job: jobs,
            client: users,
          })
          .from(editorAssignments)
          .innerJoin(jobs, eq(editorAssignments.jobId, jobs.id))
          .leftJoin(users, eq(jobs.clientId, users.id))
          .where(historyConditions)
          .orderBy(desc(editorAssignments.updatedAt));
      }
    } catch (historyError: any) {
      if (historyError instanceof Error && historyError.message.toLowerCase().includes('no such table')) {
        console.warn('[Editor Assignments] editor_assignments table missing, skipping history fetch');
        editorHistory = [];
      } else {
        throw historyError;
      }
    }

    const historicalAssignments: AssignmentPayload[] = editorHistory.map((entry) => ({
      assignment: {
        id: entry.assignment.id,
        jobId: entry.assignment.jobId,
        editorId: entry.assignment.editorId,
        approvalStatus: entry.assignment.approvalStatus,
        assignedAt: entry.assignment.assignedAt,
        reviewStartedAt: entry.assignment.reviewStartedAt,
        approvalReason: entry.assignment.approvalReason,
        revisionsRequested: Boolean(entry.assignment.revisionsRequested),
        revisionNotes: entry.assignment.revisionNotes,
        updatedAt: entry.assignment.updatedAt,
      },
      job: {
        id: entry.job.id,
        title: entry.job.title,
        displayId: entry.job.displayId,
        status: entry.job.status,
        editorStatus: entry.job.editorStatus,
        deadline: entry.job.deadline,
        pages: entry.job.pages,
        slides: entry.job.slides,
        subject: null,
        instructions: entry.job.instructions,
        description: null,
        academicLevel: null,
        createdAt: entry.job.createdAt,
        updatedAt: entry.job.updatedAt,
      },
      client: sanitizeClient(
        authCheck.user.role,
        entry.client?.name ?? null,
        entry.client?.email ?? null,
      ),
    }));

    // Combine and deduplicate (latest entry per job)
    const combined = [...pendingAssignments, ...historicalAssignments];
    const uniqueAssignments: AssignmentPayload[] = [];
    const seen = new Set<number>();

    for (const entry of combined) {
      if (!seen.has(entry.job.id)) {
        seen.add(entry.job.id);
        uniqueAssignments.push(entry);
      }
    }

    const filteredAssignments = statusFilter === 'all'
      ? uniqueAssignments
      : uniqueAssignments.filter((assignment) => assignment.assignment.approvalStatus === statusFilter);

    if (format === 'csv') {
      const csv = buildCsv(filteredAssignments);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="editor-assignments-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      assignments: filteredAssignments,
      totalCount: filteredAssignments.length,
    });
  } catch (error) {
    console.error('Editor assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 },
    );
  }
}

