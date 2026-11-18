import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getRequestSessionEdge } from '@/lib/session-edge';

// GET - Fetch unread memos for current user
export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    const session = await getRequestSessionEdge(sessionCookie);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const userRole = session.role;

    // Fetch unread memos that target this user's role
    const result = await db.execute(sql`
        SELECT m.*
        FROM memos m
        WHERE (m.target_role = ${userRole} OR m.target_role = 'all')
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1
          FROM memo_reads mr
          WHERE mr.memo_id = m.id
          AND mr.user_id = ${userId}
          AND mr.acknowledged_at IS NOT NULL
        )
        ORDER BY
          CASE m.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          m.created_at DESC
      `);

    const memos = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      targetRole: row.target_role,
      priority: row.priority,
      requiresAcknowledgement: Boolean(row.requires_acknowledgement),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ memos });
  } catch (error) {
    console.error('Failed to fetch user memos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Mark memo as read/acknowledged
export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    const session = await getRequestSessionEdge(sessionCookie);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memoId } = body;

    if (!memoId) {
      return NextResponse.json(
        { error: 'memoId is required' },
        { status: 400 }
      );
    }

    const userId = session.userId;
    const now = new Date().toISOString();

    // Check if already read
    const existingRead = await db.execute(sql`SELECT id, acknowledged_at FROM memo_reads WHERE memo_id = ${memoId} AND user_id = ${userId}`);

    if (existingRead.rows.length > 0) {
      // Update acknowledged if not already set
      if (!existingRead.rows[0].acknowledged_at) {
        await db.execute(sql`UPDATE memo_reads SET acknowledged_at = ${now} WHERE memo_id = ${memoId} AND user_id = ${userId}`);
      }
    } else {
      // Insert new read record
      await db.execute(sql`
          INSERT INTO memo_reads (memo_id, user_id, read_at, acknowledged_at, created_at)
          VALUES (${memoId}, ${userId}, ${now}, ${now}, ${now})
        `);
    }

    return NextResponse.json({ message: 'Memo acknowledged successfully' });
  } catch (error) {
    console.error('Failed to acknowledge memo:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge memo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

