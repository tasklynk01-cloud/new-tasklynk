import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const {
      courseId,
      cohortId,
      lessonId,
      title,
      description,
      dayNumber,
      sessionDate,
      startTime,
      endTime,
      trainerId,
      meetingProvider,
      meetingUrl,
      meetingId,
      meetingPassword,
      recordingStatus,
      recordingUrl,
    } = body;

    if (!courseId || !cohortId || !title || !sessionDate) {
      return NextResponse.json({ success: false, error: 'Course, cohort, title, and session date are required.' }, { status: 400 });
    }

    const [session] = await db
      .insert(trainingSessions)
      .values({
        courseId: Number(courseId),
        cohortId: Number(cohortId),
        lessonId: lessonId ? Number(lessonId) : null,
        title,
        description: description || null,
        dayNumber: dayNumber ? Number(dayNumber) : null,
        sessionDate,
        startTime: startTime || '18:00',
        endTime: endTime || '20:30',
        trainerId: trainerId ? Number(trainerId) : null,
        meetingProvider: meetingProvider || 'manual',
        meetingUrl: meetingUrl || null,
        meetingId: meetingId || null,
        meetingPassword: meetingPassword || null,
        recordingStatus: recordingStatus || 'none',
        recordingUrl: recordingUrl || null,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });

    const [updated] = await db
      .update(trainingSessions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trainingSessions.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
