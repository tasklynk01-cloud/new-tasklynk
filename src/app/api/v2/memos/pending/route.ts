import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET - Check for pending memos that require acknowledgement
export async function GET(request: NextRequest) {
  // Require authentication
  const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer', 'editor']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user's role
    const userResult = await db.execute(sql`SELECT role FROM users WHERE id = ${userId}`);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = (userResult.rows[0] as any).role;

    // Find the oldest unread memo that requires acknowledgement
    const result = await db.execute(sql`
        SELECT m.*
        FROM memos m
        WHERE m.requires_acknowledgement = true
        AND (m.target_role = ${userRole} OR m.target_role = 'all')
        AND (m.expires_at IS NULL OR m.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1 FROM memo_reads mr
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
            ELSE 5
          END,
          m.created_at ASC
        LIMIT 1
      `);

    if (result.rows.length === 0) {
      return NextResponse.json({ memo: null });
    }

    const row: any = result.rows[0];
    const memo = {
      id: row.id,
      title: row.title,
      content: row.content,
      targetRole: row.target_role,
      priority: row.priority,
      requiresAcknowledgement: Boolean(row.requires_acknowledgement),
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };

    return NextResponse.json({ memo });
  } catch (error) {
    console.error('Failed to check pending memos:', error);
    return NextResponse.json(
      { error: 'Failed to check pending memos' },
      { status: 500 }
    );
  }
}

