import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET - Fetch all memos (admin only)
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    // Fetch all memos with read statistics
    const memosResult = await db.execute(sql`
      SELECT
        m.*,
        COUNT(DISTINCT mr.id) as read_count,
        (
          SELECT COUNT(*)
          FROM users
          WHERE (m.target_role = 'all' OR role = m.target_role)
          AND approved = true
        ) as total_target_users
      FROM memos m
      LEFT JOIN memo_reads mr ON m.id = mr.memo_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);

    const memos = memosResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      targetRole: row.target_role,
      priority: row.priority,
      requiresAcknowledgement: Boolean(row.requires_acknowledgement),
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      readCount: Number(row.read_count || 0),
      totalTargetUsers: Number(row.total_target_users || 0),
    }));

    return NextResponse.json({ memos });
  } catch (error) {
    console.error('Failed to fetch memos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memos' },
      { status: 500 }
    );
  }
}

// POST - Create new memo (admin only)
export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { title, content, targetRoles, priority, requiresAcknowledgement, expiresAt } = body;

    if (!title || !content || !targetRoles || !Array.isArray(targetRoles) || targetRoles.length === 0) {
      return NextResponse.json(
        { error: 'title, content, and targetRoles (array) are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Insert memo for each selected role
    const memoIds: string[] = [];
    
    for (const targetRole of targetRoles) {
      const result = await db.execute(sql`
          INSERT INTO memos (
            title, content, target_role, priority,
            requires_acknowledgement, expires_at,
            created_by, created_at, updated_at
          ) VALUES (${title}, ${content}, ${targetRole}, ${priority || 'normal'}, ${requiresAcknowledgement ? 1 : 0}, ${expiresAt || null}, ${authCheck.user.id}, ${now}, ${now})
          RETURNING id
        `);
      memoIds.push((result.rows[0] as any)?.id?.toString() || '');
    }

    return NextResponse.json({
      message: 'Memo created successfully',
      memoIds,
      count: memoIds.length,
    });
  } catch (error) {
    console.error('Failed to create memo:', error);
    return NextResponse.json(
      { error: 'Failed to create memo' },
      { status: 500 }
    );
  }
}

