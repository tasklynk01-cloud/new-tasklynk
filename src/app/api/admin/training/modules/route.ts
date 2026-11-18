import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingModules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { courseId, title, description, dayNumber, orderIndex } = body;

    if (!courseId || !title) {
      return NextResponse.json({ success: false, error: 'Course ID and title are required.' }, { status: 400 });
    }

    const [module] = await db
      .insert(trainingModules)
      .values({
        courseId: Number(courseId),
        title,
        description: description || null,
        dayNumber: dayNumber ? Number(dayNumber) : null,
        orderIndex: orderIndex ? Number(orderIndex) : 0,
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, module });
  } catch (error: any) {
    console.error('Error creating module:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;

    const [updated] = await db
      .update(trainingModules)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(trainingModules.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, module: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
