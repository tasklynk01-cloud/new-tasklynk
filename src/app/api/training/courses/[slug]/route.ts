import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCategories,
  trainingCohorts,
  trainingTrainers,
  trainingModules,
  trainingLessons,
  trainingSessions,
} from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;

    const [course] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.slug, slug))
      .limit(1);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Category
    const [category] = course.categoryId
      ? await db.select().from(trainingCategories).where(eq(trainingCategories.id, course.categoryId)).limit(1)
      : [null];

    // Cohorts
    const cohorts = await db
      .select()
      .from(trainingCohorts)
      .where(eq(trainingCohorts.courseId, course.id))
      .orderBy(asc(trainingCohorts.startDate));

    // Trainer
    const trainerId = cohorts[0]?.trainerId;
    const [trainer] = trainerId
      ? await db.select().from(trainingTrainers).where(eq(trainingTrainers.id, trainerId)).limit(1)
      : [null];

    // Modules & Lessons
    const modules = await db
      .select()
      .from(trainingModules)
      .where(and(eq(trainingModules.courseId, course.id), eq(trainingModules.isPublished, true)))
      .orderBy(asc(trainingModules.orderIndex));

    const moduleIds = modules.map((m) => m.id);
    const lessons = moduleIds.length > 0
      ? await db
          .select({
            id: trainingLessons.id,
            moduleId: trainingLessons.moduleId,
            title: trainingLessons.title,
            slug: trainingLessons.slug,
            description: trainingLessons.description,
            orderIndex: trainingLessons.orderIndex,
            lessonType: trainingLessons.lessonType,
            durationMinutes: trainingLessons.durationMinutes,
            isFreePreview: trainingLessons.isFreePreview,
            isReleased: trainingLessons.isReleased,
          })
          .from(trainingLessons)
          .where(eq(trainingLessons.courseId, course.id))
          .orderBy(asc(trainingLessons.orderIndex))
      : [];

    // Attach lessons to modules
    const modulesWithLessons = modules.map((m) => ({
      ...m,
      lessons: lessons.filter((l) => l.moduleId === m.id),
    }));

    // Scheduled sessions
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.courseId, course.id))
      .orderBy(asc(trainingSessions.sessionDate));

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        category,
        cohorts,
        trainer,
        modules: modulesWithLessons,
        sessions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching course by slug:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
