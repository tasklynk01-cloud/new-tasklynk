import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// POST - Acknowledge a memo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memoId, userId } = body;

    if (!memoId || !userId) {
      return NextResponse.json(
        { error: 'memoId and userId are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Fetch memo details for duplicate detection
    const memoResult = await db.execute(sql`SELECT title, content FROM memos WHERE id = ${memoId}`);

    if (memoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Memo not found' },
        { status: 404 }
      );
    }

    const memoRow = memoResult.rows[0] as unknown as { title?: unknown; content?: unknown };
    const memo = {
      title: typeof memoRow.title === 'string' ? memoRow.title : String(memoRow.title ?? ''),
      content: typeof memoRow.content === 'string' ? memoRow.content : String(memoRow.content ?? ''),
    };

    // Check if already acknowledged
    const existingRead = await db.execute(sql`SELECT id, acknowledged_at FROM memo_reads WHERE memo_id = ${memoId} AND user_id = ${userId}`);

    if (existingRead.rows.length > 0) {
      const read: any = existingRead.rows[0];
      if (read.acknowledged_at) {
        return NextResponse.json({ message: 'Already acknowledged' });
      }

      // Update existing read with acknowledgement
      await db.execute(sql`UPDATE memo_reads SET acknowledged_at = ${now} WHERE id = ${read.id}`);
    } else {
      // Create new memo read with acknowledgement
      await db.execute(sql`
          INSERT INTO memo_reads (memo_id, user_id, read_at, acknowledged_at)
          VALUES (${memoId}, ${userId}, ${now}, ${now})
        `);
    }

    // Automatically acknowledge duplicate memos with same title/content
    await db.execute(sql`
        INSERT INTO memo_reads (memo_id, user_id, read_at, acknowledged_at)
        SELECT m.id, ${userId}, ${now}, ${now}
        FROM memos m
        WHERE m.title = ${memo.title}
          AND m.content = ${memo.content}
          AND m.id != ${memoId}
          AND m.requires_acknowledgement = true
          AND NOT EXISTS (
            SELECT 1 FROM memo_reads mr
            WHERE mr.memo_id = m.id
              AND mr.user_id = ${userId}
          )
      `);

    return NextResponse.json({ message: 'Great! Memo acknowledged successfully.' });
  } catch (error) {
    console.error('Failed to acknowledge memo:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge memo' },
      { status: 500 }
    );
  }
}

