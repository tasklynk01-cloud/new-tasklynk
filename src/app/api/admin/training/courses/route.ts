import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCategories,
  trainingCohorts,
  trainingModules,
  trainingLessons,
  trainingSessions,
} from '@/db/schema';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const courses = await db
      .select({
        course: trainingCourses,
        category: trainingCategories,
      })
      .from(trainingCourses)
      .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
      .orderBy(asc(trainingCourses.id));

    // Get cohorts count, modules count, and enrolled count per course
    const enriched = await Promise.all(
      courses.map(async ({ course, category }) => {
        const cohortsRes = await db
          .select({ count: sql<number>`count(*)`, enrolled: sql<number>`coalesce(sum(enrolled_count), 0)` })
          .from(trainingCohorts)
          .where(eq(trainingCohorts.courseId, course.id));
        const modulesRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(trainingModules)
          .where(eq(trainingModules.courseId, course.id));
        const lessonsRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(trainingLessons)
          .where(eq(trainingLessons.courseId, course.id));
        const sessionsRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(trainingSessions)
          .where(eq(trainingSessions.courseId, course.id));

        return {
          ...course,
          category,
          cohortsCount: Number(cohortsRes[0]?.count || 0),
          totalEnrolled: Number(cohortsRes[0]?.enrolled || 0),
          modulesCount: Number(modulesRes[0]?.count || 0),
          lessonsCount: Number(lessonsRes[0]?.count || 0),
          sessionsCount: Number(sessionsRes[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({ success: true, courses: enriched });
  } catch (error: any) {
    console.error('Error fetching admin courses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const {
      title,
      slug,
      shortDescription,
      description,
      categoryId,
      level,
      durationDays,
      dailyDurationHours,
      targetAudience,
      learningOutcomes,
      standardPrice,
      earlyBirdPrice,
      promotionalPrice,
      isPublished,
      minCompletionPercentage,
      maxCapacity,
    } = body;

    if (!title || !slug || !description || !standardPrice) {
      return NextResponse.json(
        { success: false, error: 'Title, slug, description, and standard price are required.' },
        { status: 400 }
      );
    }

    const [newCourse] = await db
      .insert(trainingCourses)
      .values({
        title,
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        shortDescription: shortDescription || null,
        description,
        categoryId: categoryId ? Number(categoryId) : null,
        level: level || 'all_levels',
        durationDays: durationDays ? Number(durationDays) : 5,
        dailyDurationHours: dailyDurationHours || '2–3 hours',
        targetAudience: targetAudience || 'General audience',
        learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
        standardPrice: Number(standardPrice),
        earlyBirdPrice: earlyBirdPrice ? Number(earlyBirdPrice) : null,
        promotionalPrice: promotionalPrice ? Number(promotionalPrice) : null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        minCompletionPercentage: minCompletionPercentage ? Number(minCompletionPercentage) : 80,
        maxCapacity: maxCapacity ? Number(maxCapacity) : 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, course: newCourse });
  } catch (error: any) {
    console.error('Error creating admin course:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
