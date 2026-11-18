import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCategories,
  trainingCohorts,
  trainingTrainers,
  trainingModules,
  trainingSessions,
} from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');

    // 1. Fetch published courses
    const query = db
      .select({
        course: trainingCourses,
        category: trainingCategories,
        cohort: trainingCohorts,
        trainer: trainingTrainers,
      })
      .from(trainingCourses)
      .leftJoin(trainingCategories, eq(trainingCourses.categoryId, trainingCategories.id))
      .leftJoin(trainingCohorts, and(eq(trainingCohorts.courseId, trainingCourses.id), eq(trainingCohorts.status, 'registration_open')))
      .leftJoin(trainingTrainers, eq(trainingCohorts.trainerId, trainingTrainers.id))
      .where(and(eq(trainingCourses.isPublished, true), eq(trainingCourses.isArchived, false)));

    const rows = await query;

    // Group cohorts by course
    const courseMap = new Map<number, any>();

    for (const r of rows) {
      if (!courseMap.has(r.course.id)) {
        courseMap.set(r.course.id, {
          ...r.course,
          category: r.category,
          cohorts: [],
          trainer: r.trainer,
        });
      }
      if (r.cohort) {
        const item = courseMap.get(r.course.id);
        const cohort = r.cohort;
        if (item && !item.cohorts.some((c: any) => c.id === cohort.id)) {
          item.cohorts.push(cohort);
        }
      }
    }

    // Filter by category or search if provided
    let courses = Array.from(courseMap.values());
    if (categorySlug) {
      courses = courses.filter((c) => c.category?.slug === categorySlug);
    }
    if (search) {
      const q = search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.targetAudience.toLowerCase().includes(q)
      );
    }

    // Sort by id / order
    courses.sort((a, b) => a.id - b.id);

    // Fetch categories for filtering
    const categories = await db
      .select()
      .from(trainingCategories)
      .where(eq(trainingCategories.isActive, true))
      .orderBy(trainingCategories.orderIndex);

    return NextResponse.json({
      success: true,
      courses,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching training courses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
