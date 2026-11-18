import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, users, messages, jobs } from '@/db/schema';
import { eq, and, or, desc, sql, inArray, type SQL } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { alias } from 'drizzle-orm/pg-core';
import { canCreateConversationForJob, getAccessibleJobIdsForMessaging } from '@/lib/message-access';

const participant1 = alias(users, 'participant1');
const participant2 = alias(users, 'participant2');

/**
 * GET /api/v2/conversations
 * Get conversations for the current user with filtering and search
 * Query params:
 * - archived: 'true' or 'false' (default false)
 * - search: Search in participant names or message preview
 * - jobId: Filter by job ID
 * - page, limit: Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const currentUser = authCheck.user;
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived') === 'true';
    const includeAll = searchParams.get('all') === 'true';
    const search = searchParams.get('search');
    const jobId = searchParams.get('jobId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: SQL<unknown>[] = [eq(conversations.isArchived, archived)];

    if (includeAll && currentUser.role === 'admin') {
      // Admin can inspect all conversations.
    } else if (includeAll && currentUser.role === 'manager') {
      const scopedJobIds = await getAccessibleJobIdsForMessaging(currentUser);
      if (!scopedJobIds || scopedJobIds.length === 0) {
        return NextResponse.json({
          conversations: [],
          counts: { active: 0, archived: 0 },
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      whereConditions.push(inArray(conversations.jobId, scopedJobIds));
    } else {
      const participantScope = or(
        eq(conversations.participant1Id, currentUser.id),
        eq(conversations.participant2Id, currentUser.id)
      );

      if (participantScope) {
        whereConditions.push(participantScope);
      }
    }

    if (jobId) {
      whereConditions.push(eq(conversations.jobId, parseInt(jobId)));
    }

    const whereClause = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)!;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get conversations with participant info
    const convos = await db
      .select({
        id: conversations.id,
        jobId: conversations.jobId,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        lastMessageSenderId: conversations.lastMessageSenderId,
        lastMessagePreview: conversations.lastMessagePreview,
        isArchived: conversations.isArchived,
        archivedAt: conversations.archivedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        // Participant 1 info
        participant1Name: participant1.name,
        participant1Email: participant1.email,
        participant1Role: participant1.role,
        // Participant 2 info
        participant2Name: participant2.name,
        participant2Email: participant2.email,
        participant2Role: participant2.role,
        // Job info
        jobTitle: jobs.title,
        jobDisplayId: jobs.displayId,
      })
      .from(conversations)
      .leftJoin(participant1, eq(conversations.participant1Id, participant1.id))
      .leftJoin(participant2, eq(conversations.participant2Id, participant2.id))
      .leftJoin(jobs, eq(conversations.jobId, jobs.id))
      .where(whereClause)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Filter by search if provided (client-side since we need combined fields)
    let filteredConvos = convos;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConvos = convos.filter(c => 
        c.participant1Name?.toLowerCase().includes(searchLower) ||
        c.participant2Name?.toLowerCase().includes(searchLower) ||
        c.lastMessagePreview?.toLowerCase().includes(searchLower) ||
        c.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Transform to add 'otherParticipant' helper
    const conversationsWithMeta = filteredConvos.map(c => {
      const isCurrentUserP1 = c.participant1Id === currentUser.id;
      return {
        ...c,
        otherParticipant: {
          id: isCurrentUserP1 ? c.participant2Id : c.participant1Id,
          name: isCurrentUserP1 ? c.participant2Name : c.participant1Name,
          email: isCurrentUserP1 ? c.participant2Email : c.participant1Email,
          role: isCurrentUserP1 ? c.participant2Role : c.participant1Role,
        },
        unreadCount: 0, // TODO: Calculate unread count from messages
      };
    });

    // Get counts for sidebar
    const archivedCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(and(
        eq(conversations.isArchived, true),
        or(
          eq(conversations.participant1Id, currentUser.id),
          eq(conversations.participant2Id, currentUser.id)
        )
      ));

    const activeCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(and(
        eq(conversations.isArchived, false),
        or(
          eq(conversations.participant1Id, currentUser.id),
          eq(conversations.participant2Id, currentUser.id)
        )
      ));

    return NextResponse.json({
      conversations: conversationsWithMeta,
      counts: {
        active: activeCountResult[0]?.count || 0,
        archived: archivedCountResult[0]?.count || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/conversations
 * Create a new conversation or get existing one
 * Body: { participantId, jobId? }
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const currentUser = authCheck.user;
    const body = await request.json();
    const { participantId, jobId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    if (participantId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    const [participant] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, participantId))
      .limit(1);

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    if (!jobId && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'jobId is required when creating user conversations' },
        { status: 400 }
      );
    }

    if (jobId) {
      const allowed = await canCreateConversationForJob(currentUser, participantId, jobId);
      if (!allowed) {
        return NextResponse.json(
          { error: 'You cannot create a conversation with this participant for the selected job' },
          { status: 403 }
        );
      }
    }

    // Check if conversation already exists
    const existingConvo = await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            and(
              eq(conversations.participant1Id, currentUser.id),
              eq(conversations.participant2Id, participantId)
            ),
            and(
              eq(conversations.participant1Id, participantId),
              eq(conversations.participant2Id, currentUser.id)
            )
          ),
          jobId ? eq(conversations.jobId, jobId) : sql`1=1`
        )
      )
      .limit(1);

    if (existingConvo.length > 0) {
      // Return existing conversation
      return NextResponse.json({
        conversation: existingConvo[0],
        created: false,
      });
    }

    // Create new conversation
    const now = new Date().toISOString();
    const [newConvo] = await db.insert(conversations).values({
      participant1Id: currentUser.id,
      participant2Id: participantId,
      jobId: jobId || null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      conversation: newConvo,
      created: true,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

