import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  jobs,
  editorAssignments,
  editorProfiles,
  orderRevisions,
} from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { alias } from 'drizzle-orm/pg-core';

const clientUser = alias(users, 'editor_dashboard_client');
const writerUser = alias(users, 'editor_dashboard_writer');

/**
 * GET /api/editor/dashboard
 * Retrieves dashboard data for editor
 * Shows ALL orders in editing status (accessible to all editors)
 * Plus editor's assignment history from editorAssignments table
 * TIER 1 FIX: Editor role implementation - editors see all editing orders
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedEditorId = searchParams.get('editorId');

    let editorIdInt: number | null = null;
    if (authCheck.user.role === 'editor') {
      editorIdInt = authCheck.user.id;
      if (requestedEditorId && parseInt(requestedEditorId) !== authCheck.user.id) {
        return NextResponse.json(
          { error: 'Editors can only view their own dashboard' },
          { status: 403 }
        );
      }
    } else {
      if (!requestedEditorId) {
        return NextResponse.json(
          { error: 'editorId query parameter is required' },
          { status: 400 }
        );
      }
      const parsed = parseInt(requestedEditorId);
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: 'editorId must be a valid integer' },
          { status: 400 }
        );
      }
      editorIdInt = parsed;
    }

    if (editorIdInt === null) {
      return NextResponse.json(
        { error: 'Unable to resolve editor context' },
        { status: 400 }
      );
    }

    // Verify editor exists and has editor role
    const editorRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
        role: users.role,
        approved: users.approved,
        completedJobs: users.completedJobs,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.id, editorIdInt))
      .limit(1);

    const editor = editorRows[0];

    if (!editor || editor.role !== 'editor') {
      return NextResponse.json(
        { error: 'Not authorized: Editor access required' },
        { status: 403 }
      );
    }

    // Optional: load editor profile (fallback if table missing)
    let profile: Record<string, any> | null = null;
    try {
      const profileRows = await db
        .select({
          specialization: editorProfiles.specialization,
          yearsExperience: editorProfiles.yearsExperience,
          languages: editorProfiles.languages,
          qualifications: editorProfiles.qualifications,
          areasOfExpertise: editorProfiles.areasOfExpertise,
          averageEditsPerOrder: editorProfiles.averageEditsPerOrder,
          ordersTouched: editorProfiles.ordersTouched,
          clientSatisfactionRate: editorProfiles.clientSatisfactionRate,
        })
        .from(editorProfiles)
        .where(eq(editorProfiles.userId, editorIdInt))
        .limit(1);
      profile = profileRows[0] ?? null;
    } catch (profileError: any) {
      if (profileError instanceof Error && profileError.message.toLowerCase().includes('no such table')) {
        console.warn('[Editor Dashboard] editor_profiles table missing, skipping profile fetch');
      } else {
        throw profileError;
      }
    }

    // Editor statuses: pending_editing, editing_in_progress, awaiting_revision, awaiting_admin_review
    const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
    let editingRows: any[] = [];
    let editingColumnsExtended = true;

    try {
      editingRows = await db
        .select({
          id: jobs.id,
          displayId: jobs.displayId,
          orderNumber: jobs.orderNumber,
          title: jobs.title,
          pages: jobs.pages,
          slides: jobs.slides,
          status: jobs.status,
          editorStatus: jobs.editorStatus,
          deadline: jobs.deadline,
          actualDeadline: jobs.actualDeadline,
          freelancerDeadline: jobs.freelancerDeadline,
          amount: jobs.amount,
          editorNotes: jobs.editorNotes,
          editorRequestedRevision: jobs.editorRequestedRevision,
          editorRevisionNotes: jobs.editorRevisionNotes,
          editorAssignedAt: jobs.editorAssignedAt,
          editorStartedAt: jobs.editorStartedAt,
          updatedAt: jobs.updatedAt,
          createdAt: jobs.createdAt,
          // DO NOT expose client/freelancer names or emails per requirements
          assignedEditorId: jobs.assignedEditorId,
        })
        .from(jobs)
        .where(inArray(jobs.editorStatus, editorStatuses))
        .orderBy(desc(jobs.updatedAt));
    } catch (ordersError: any) {
      if (ordersError instanceof Error && ordersError.message.toLowerCase().includes('no such column')) {
        console.warn('[Editor Dashboard] jobs schema mismatch detected, falling back to minimal columns:', ordersError.message);
        editingColumnsExtended = false;
        editingRows = await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            orderNumber: jobs.orderNumber,
            title: jobs.title,
            pages: jobs.pages,
            slides: jobs.slides,
            status: jobs.status,
            editorStatus: jobs.editorStatus,
            deadline: jobs.deadline,
            amount: jobs.amount,
            updatedAt: jobs.updatedAt,
            createdAt: jobs.createdAt,
          })
          .from(jobs)
          .where(inArray(jobs.editorStatus, editorStatuses))
          .orderBy(desc(jobs.updatedAt));
      } else {
        throw ordersError;
      }
    }

    const now = Date.now();
    const toIsoOrNull = (value: unknown) => {
      if (!value || typeof value !== 'string') return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };

    const orders = editingRows.map((row) => {
      const deadline = toIsoOrNull(row.deadline);
      const actualDeadline = 'actualDeadline' in row ? toIsoOrNull((row as any).actualDeadline) : null;
      const freelancerDeadline = 'freelancerDeadline' in row ? toIsoOrNull((row as any).freelancerDeadline) : null;
      const editorRequestedRevision = editingColumnsExtended && 'editorRequestedRevision' in row
        ? Boolean(row.editorRequestedRevision)
        : false;
      const editorNotes = editingColumnsExtended && 'editorNotes' in row ? row.editorNotes : null;

      return {
        id: row.id,
        displayId: row.displayId || row.orderNumber,
        orderNumber: row.orderNumber,
        title: row.title || 'Untitled Order',
        pages: row.pages,
        slides: row.slides,
        status: row.status,
        editorStatus: editingColumnsExtended && 'editorStatus' in row ? row.editorStatus : 'not_assigned',
        deadline,
        actualDeadline,
        freelancerDeadline,
        amount: row.amount ?? 0,
        subject: null,
        updatedAt: row.updatedAt,
        createdAt: row.createdAt,
        editorNotes,
        editorRequestedRevision,
        editorRevisionNotes: editingColumnsExtended && 'editorRevisionNotes' in row ? row.editorRevisionNotes : null,
        editorAssignedAt: editingColumnsExtended && 'editorAssignedAt' in row ? row.editorAssignedAt : null,
        editorStartedAt: editingColumnsExtended && 'editorStartedAt' in row ? row.editorStartedAt : null,
        assignedEditorId: editingColumnsExtended && 'assignedEditorId' in row ? row.assignedEditorId : null,
        // DO NOT expose client/freelancer identity per requirements
        client: null,
        writer: null,
        isOverdue:
          deadline !== null && !Number.isNaN(Date.parse(deadline))
            ? Date.parse(deadline) < now
            : false,
      };
    });

    // Prepare pending review placeholders (compatibility with legacy UI expectations)
    const pendingReviews = orders.map((order) => ({
      assignment: {
        id: order.id,
        approvalStatus: 'pending',
        assignedAt: order.updatedAt || order.createdAt,
        reviewStartedAt: null,
        approvalReason: null,
        revisionsRequested: order.editorRequestedRevision,
        revisionNotes: null,
      },
      job: {
        id: order.id,
        displayId: order.displayId,
        orderNumber: order.orderNumber,
        title: order.title,
        status: order.status,
        deadline: order.deadline,
        amount: order.amount,
      },
      client: order.client,
    }));

    // Get editor's assignment history from editorAssignments table
    type EditorHistoryRow = {
      assignment: typeof editorAssignments.$inferSelect;
      job: {
        id: number;
        displayId: string;
        orderNumber: string;
        title: string;
        status: string;
        deadline: string | null;
      };
      client: {
        id: number;
        name: string;
        email: string;
      };
    };

    let editorHistory: EditorHistoryRow[] = [];
    try {
      editorHistory = await db.select({
        assignment: {
          id: editorAssignments.id,
          jobId: editorAssignments.jobId,
          editorId: editorAssignments.editorId,
          approvalStatus: editorAssignments.approvalStatus,
          assignedAt: editorAssignments.assignedAt,
          reviewStartedAt: editorAssignments.reviewStartedAt,
          approvalReason: editorAssignments.approvalReason,
          revisionsRequested: editorAssignments.revisionsRequested,
          revisionNotes: editorAssignments.revisionNotes,
          createdAt: editorAssignments.createdAt,
          updatedAt: editorAssignments.updatedAt,
        },
        job: {
          id: jobs.id,
          displayId: jobs.displayId,
          orderNumber: jobs.orderNumber,
          title: jobs.title,
          status: jobs.status,
          deadline: jobs.deadline,
        },
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
        .from(editorAssignments)
        .innerJoin(jobs, eq(editorAssignments.jobId, jobs.id))
        .innerJoin(users, eq(jobs.clientId, users.id))
        .where(eq(editorAssignments.editorId, editorIdInt))
        .orderBy(desc(editorAssignments.assignedAt));
    } catch (historyError: any) {
      if (historyError instanceof Error && historyError.message.toLowerCase().includes('no such table')) {
        console.warn('[Editor Dashboard] editor_assignments table missing, skipping history fetch');
        editorHistory = [];
      } else {
        throw historyError;
      }
    }

    // Separate by status
    const activeAssignments = editorHistory.filter((h) =>
      ['pending', 'reviewing'].includes(h.assignment.approvalStatus)
    );
    const inReview = activeAssignments.filter((h) => h.assignment.approvalStatus === 'reviewing');
    const completed = editorHistory.filter((h) =>
      ['approved', 'rejected'].includes(h.assignment.approvalStatus)
    );

    // Calculate stats
    const approved = completed.filter(c => c.assignment.approvalStatus === 'approved');
    const rejected = completed.filter(c => c.assignment.approvalStatus === 'rejected');
    const overdueOrders = orders.filter((order) => order.isOverdue);
    const flaggedOrders = orders.filter(
      (order) => order.editorRequestedRevision,
    );

    const turnaroundDurations = completed
      .map((entry) => {
        const start = entry.assignment.reviewStartedAt || entry.assignment.assignedAt;
        const end = entry.assignment.updatedAt || entry.assignment.reviewStartedAt || entry.assignment.assignedAt;
        if (!start || !end) {
          return null;
        }
        const startTime = Date.parse(start);
        const endTime = Date.parse(end);
        if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
          return null;
        }
        const hours = (endTime - startTime) / (1000 * 60 * 60);
        return hours;
      })
      .filter((value): value is number => value !== null);

    const averageTurnaroundHours = turnaroundDurations.length > 0
      ? parseFloat((turnaroundDurations.reduce((sum, value) => sum + value, 0) / turnaroundDurations.length).toFixed(1))
      : null;
    
    const stats = {
      pendingReviews: orders.length,
      inReview: inReview.length,
      approved: approved.length,
      rejected: rejected.length,
      completed: completed.length,
      totalReviewed: completed.length,
      approvalRate: completed.length > 0 
        ? parseFloat(((approved.length / completed.length) * 100).toFixed(1))
        : 0,
      activeAssignments: activeAssignments.length,
      queueOverdue: overdueOrders.length,
      revisionAlerts: flaggedOrders.length,
      averageTurnaroundHours,
    };

    const mapAssignment = (rows: EditorHistoryRow[]) =>
      rows.map((entry) => ({
        id: entry.assignment.id,
        jobId: entry.assignment.jobId,
        displayId: entry.job?.displayId || entry.job?.orderNumber || '',
        title: entry.job?.title || 'Untitled Order',
        status: entry.assignment.approvalStatus,
        assignedAt: entry.assignment.assignedAt,
        reviewStartedAt: entry.assignment.reviewStartedAt,
        updatedAt: entry.assignment.updatedAt,
        approvalReason: entry.assignment.approvalReason,
        revisionsRequested: Boolean(entry.assignment.revisionsRequested),
        revisionNotes: entry.assignment.revisionNotes,
        clientName: entry.client?.name || null,
        clientEmail: entry.client?.email || null,
        deadline: entry.job?.deadline || null,
      }));

    const recentApprovals = mapAssignment(
      completed
        .filter((entry) => entry.assignment.approvalStatus === 'approved')
        .slice(0, 10),
    );
    const recentRejections = mapAssignment(
      completed
        .filter((entry) => entry.assignment.approvalStatus === 'rejected')
        .slice(0, 10),
    );

    // Load outstanding revision requests for visibility
    let revisionRequests: Array<{
      id: number;
      orderId: number;
      revisionType: string;
      status: string;
      createdAt: string;
    }> = [];
    if (orders.length > 0) {
      try {
        revisionRequests = await db
          .select({
            id: orderRevisions.id,
            orderId: orderRevisions.orderId,
            revisionType: orderRevisions.revisionType,
            status: orderRevisions.status,
            createdAt: orderRevisions.createdAt,
          })
          .from(orderRevisions)
          .where(inArray(orderRevisions.orderId, orders.map((order) => order.id)))
          .orderBy(desc(orderRevisions.createdAt));
      } catch (revisionError: any) {
        if (revisionError instanceof Error && revisionError.message.toLowerCase().includes('no such table')) {
          console.warn('[Editor Dashboard] order_revisions table missing, skipping revision summary');
        } else {
          throw revisionError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      editor: {
        id: editor.id,
        name: editor.name,
        email: editor.email,
        displayId: editor.displayId,
        completedJobs: editor.completedJobs,
        balance: editor.balance,
      },
      profile,
      stats,
      orders,
      pendingReviews,
      inReview,
      completed,
      queue: {
        overdue: overdueOrders,
        flagged: flaggedOrders,
      },
      assignments: {
        active: mapAssignment(activeAssignments).slice(0, 15),
        recentApprovals,
        recentRejections,
      },
      revisions: revisionRequests,
    });

  } catch (error) {
    console.error('Editor dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor dashboard' },
      { status: 500 }
    );
  }
}

