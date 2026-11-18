import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingEnrollments,
  trainingBookings,
  trainingCourses,
  trainingCohorts,
  trainingCourseProgress,
  trainingCertificates,
  trainingResults,
  users,
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { issueCertificateForLearner } from '@/lib/training-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const enrollments = await db
      .select({
        enrollment: trainingEnrollments,
        user: users,
        course: trainingCourses,
        cohort: trainingCohorts,
        progress: trainingCourseProgress,
      })
      .from(trainingEnrollments)
      .innerJoin(users, eq(trainingEnrollments.userId, users.id))
      .innerJoin(trainingCourses, eq(trainingEnrollments.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingEnrollments.cohortId, trainingCohorts.id))
      .leftJoin(trainingCourseProgress, eq(trainingEnrollments.userId, trainingCourseProgress.userId))
      .orderBy(desc(trainingEnrollments.enrolledAt));

    const learners = await Promise.all(
      enrollments.map(async (row) => {
        const [cert] = await db
          .select()
          .from(trainingCertificates)
          .where(eq(trainingCertificates.enrollmentId, row.enrollment.id))
          .limit(1);

        const results = await db
          .select()
          .from(trainingResults)
          .where(eq(trainingResults.userId, row.user.id));

        return {
          id: row.enrollment.id,
          userId: row.user.id,
          name: row.user.name,
          email: row.user.email,
          phone: row.user.phone,
          courseTitle: row.course.title,
          courseSlug: row.course.slug,
          cohortName: row.cohort.name,
          enrolledAt: row.enrollment.enrolledAt,
          accessStatus: row.enrollment.accessStatus,
          progressPercentage: Number(row.progress?.progressPercentage || row.enrollment.progressPercentage || 0),
          completedLessons: row.progress?.completedLessonsCount || 0,
          totalLessons: row.progress?.totalLessonsCount || 0,
          isCompleted: row.progress?.isCompleted || false,
          isEligibleForCertificate: row.progress?.isEligibleForCertificate || false,
          certificate: cert || null,
          assessmentResultsCount: results.length,
        };
      })
    );

    return NextResponse.json({ success: true, learners });
  } catch (error: any) {
    console.error('Error fetching admin learners:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { action, userId, courseId, enrollmentId } = body;

    if (action === 'issue_certificate') {
      const cert = await issueCertificateForLearner({
        userId: Number(userId),
        courseId: Number(courseId),
        adminId: auth.user.id,
      });

      return NextResponse.json({ success: true, certificate: cert });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in learner admin action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
