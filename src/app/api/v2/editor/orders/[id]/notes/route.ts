import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/editor/orders/[id]/notes
 * Add internal editor note to order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const orderId = parseInt(params.id);
    const editorId = authCheck.user.id;
    const editorName = authCheck.user.full_name || authCheck.user.email;

    const { note } = await request.json();

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Fetch current order
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify editor has access
    if (order.assignedEditorId !== editorId) {
      return NextResponse.json(
        { error: 'You do not have access to this order' },
        { status: 403 }
      );
    }

    // Parse existing notes
    let existingNotes = [];
    if (order.editorNotes) {
      try {
        existingNotes = JSON.parse(order.editorNotes);
      } catch (e) {
        console.error('Failed to parse existing notes:', e);
      }
    }

    // Add new note
    const newNote = {
      note: note.trim(),
      timestamp: new Date().toISOString(),
      editorId,
      editorName,
    };
    existingNotes.push(newNote);

    // Update order
    await db
      .update(jobs)
      .set({
        editorNotes: JSON.stringify(existingNotes),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    // TODO: Add audit logging when proper editor audit table is created

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    console.error('Error adding editor note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}
