import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingCohorts } from '@/db/schema';
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
      cohortCode,
      name,
      startDate,
      endDate,
      registrationOpensAt,
      registrationClosesAt,
      capacity,
      trainerId,
      status,
    } = body;

    if (!courseId || !cohortCode || !name || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required cohort fields.' }, { status: 400 });
    }

    // Default 48h before start if registrationClosesAt not supplied
    let regCloses = registrationClosesAt;
    if (!regCloses) {
      const d = new Date(startDate);
      d.setHours(d.getHours() - 48);
      regCloses = d.toISOString();
    }

    const [cohort] = await db
      .insert(trainingCohorts)
      .values({
        courseId: Number(courseId),
        cohortCode: String(cohortCode).trim().toUpperCase(),
        name: String(name).trim(),
        startDate,
        endDate,
        registrationOpensAt: registrationOpensAt || new Date().toISOString(),
        registrationClosesAt: regCloses,
        capacity: capacity ? Number(capacity) : 50,
        enrolledCount: 0,
        trainerId: trainerId ? Number(trainerId) : null,
        status: status || 'registration_open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, cohort });
  } catch (error: any) {
    console.error('Error creating cohort:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Cohort ID required' }, { status: 400 });

    const [cohort] = await db
      .update(trainingCohorts)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trainingCohorts.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, cohort });
  } catch (error: any) {
    console.error('Error updating cohort:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
