import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCategories,
  trainingCohorts,
  trainingModules,
  trainingLessons,
  trainingSessions,
  trainingVideos,
  trainingMaterials,
  trainingTrainers,
} from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const params = await props.params;
    const courseId = Number(params.id);

    const [course] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const categories = await db.select().from(trainingCategories).orderBy(trainingCategories.orderIndex);
    const trainers = await db.select().from(trainingTrainers).where(eq(trainingTrainers.isActive, true));
    const cohorts = await db.select().from(trainingCohorts).where(eq(trainingCohorts.courseId, courseId)).orderBy(asc(trainingCohorts.startDate));
    
    const modules = await db.select().from(trainingModules).where(eq(trainingModules.courseId, courseId)).orderBy(asc(trainingModules.orderIndex));
    const lessons = await db.select().from(trainingLessons).where(eq(trainingLessons.courseId, courseId)).orderBy(asc(trainingLessons.orderIndex));
    const sessions = await db.select().from(trainingSessions).where(eq(trainingSessions.courseId, courseId)).orderBy(asc(trainingSessions.sessionDate));
    const videos = await db.select().from(trainingVideos).where(eq(trainingVideos.courseId, courseId)).orderBy(asc(trainingVideos.orderIndex));
    const materials = await db.select().from(trainingMaterials).where(eq(trainingMaterials.courseId, courseId)).orderBy(asc(trainingMaterials.orderIndex));

    const modulesWithLessons = modules.map((m) => ({
      ...m,
      lessons: lessons
        .filter((l) => l.moduleId === m.id)
        .map((les) => ({
          ...les,
          videos: videos.filter((v) => v.lessonId === les.id),
          materials: materials.filter((mat) => mat.lessonId === les.id),
        })),
    }));

    return NextResponse.json({
      success: true,
      course,
      categories,
      trainers,
      cohorts,
      modules: modulesWithLessons,
      sessions,
    });
  } catch (error: any) {
    console.error('Error fetching admin course details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const params = await props.params;
    const courseId = Number(params.id);
    const body = await request.json();

    const [updated] = await db
      .update(trainingCourses)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trainingCourses.id, courseId))
      .returning();

    return NextResponse.json({ success: true, course: updated });
  } catch (error: any) {
    console.error('Error updating admin course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const params = await props.params;
    const courseId = Number(params.id);

    // Soft archive
    await db
      .update(trainingCourses)
      .set({ isArchived: true, isPublished: false, updatedAt: new Date().toISOString() })
      .where(eq(trainingCourses.id, courseId));

    return NextResponse.json({ success: true, message: 'Course archived successfully.' });
  } catch (error: any) {
    console.error('Error archiving course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
