import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// DELETE - Delete memo (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const memoId = params.id;

    // Delete memo (cascade will delete memo_reads)
    await db.execute(sql`DELETE FROM memos WHERE id = ${memoId}`);

    return NextResponse.json({ message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('Failed to delete memo:', error);
    return NextResponse.json(
      { error: 'Failed to delete memo' },
      { status: 500 }
    );
  }
}
