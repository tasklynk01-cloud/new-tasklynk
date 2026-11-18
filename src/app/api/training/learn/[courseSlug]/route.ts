import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCohorts,
  trainingEnrollments,
  trainingModules,
  trainingLessons,
  trainingSessions,
  trainingVideos,
  trainingMaterials,
  trainingVideoProgress,
  trainingLessonProgress,
  trainingCourseProgress,
  trainingAssessments,
  trainingResults,
  trainingCertificates,
} from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const params = await props.params;
    const { courseSlug } = params;

    // 1. Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to access your course materials.' },
        { status: 401 }
      );
    }

    // 2. Fetch course
    const [course] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.slug, courseSlug))
      .limit(1);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found.' }, { status: 404 });
    }

    // 3. Verify learner enrollment (or allow admin full inspection)
    const isAdmin = user.role === 'admin';
    const [enrollment] = await db
      .select()
      .from(trainingEnrollments)
      .where(and(eq(trainingEnrollments.userId, user.id), eq(trainingEnrollments.courseId, course.id)))
      .limit(1);

    if (!enrollment && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access restricted. You must have a confirmed and paid enrolment to access this course.',
          needsEnrolment: true,
        },
        { status: 403 }
      );
    }

    if (enrollment && enrollment.accessStatus !== 'active' && !isAdmin) {
      return NextResponse.json(
        { success: false, error: `Your course access is ${enrollment.accessStatus}. Contact support.` },
        { status: 403 }
      );
    }

    const cohortId = enrollment?.cohortId;

    // 4. Fetch Modules & Lessons
    const modules = await db
      .select()
      .from(trainingModules)
      .where(and(eq(trainingModules.courseId, course.id), eq(trainingModules.isPublished, true)))
      .orderBy(asc(trainingModules.orderIndex));

    const lessons = await db
      .select()
      .from(trainingLessons)
      .where(eq(trainingLessons.courseId, course.id))
      .orderBy(asc(trainingLessons.orderIndex));

    const videos = await db
      .select()
      .from(trainingVideos)
      .where(eq(trainingVideos.courseId, course.id))
      .orderBy(asc(trainingVideos.orderIndex));

    const materials = await db
      .select()
      .from(trainingMaterials)
      .where(eq(trainingMaterials.courseId, course.id))
      .orderBy(asc(trainingMaterials.orderIndex));

    // 5. Fetch Learner's Progress Records
    const userVideoProgress = await db
      .select()
      .from(trainingVideoProgress)
      .where(and(eq(trainingVideoProgress.userId, user.id), eq(trainingVideoProgress.courseId, course.id)));

    const userLessonProgress = await db
      .select()
      .from(trainingLessonProgress)
      .where(and(eq(trainingLessonProgress.userId, user.id), eq(trainingLessonProgress.courseId, course.id)));

    const [userCourseProgress] = await db
      .select()
      .from(trainingCourseProgress)
      .where(and(eq(trainingCourseProgress.userId, user.id), eq(trainingCourseProgress.courseId, course.id)))
      .limit(1);

    const completedLessonIds = new Set(
      userLessonProgress.filter((p) => p.status === 'completed').map((p) => p.lessonId)
    );

    // 6. Progressive Lesson Delivery Logic
    const lessonsWithAccess = lessons.map((les) => {
      // Determine if locked
      let isLocked = false;
      let lockReason = '';

      if (!isAdmin) {
        if (!les.isReleased && !les.isFreePreview) {
          isLocked = true;
          lockReason = 'This lesson has not yet been released. Follow the cohort timetable.';
        } else if (les.prerequisiteLessonId && !completedLessonIds.has(les.prerequisiteLessonId)) {
          isLocked = true;
          lockReason = 'Complete the prerequisite lesson to unlock.';
        }
      }

      const lessonVideos = videos.filter((v) => v.lessonId === les.id);
      const lessonMaterials = materials.filter((m) => m.lessonId === les.id);
      const lessonProg = userLessonProgress.find((p) => p.lessonId === les.id);

      return {
        ...les,
        isLocked,
        lockReason,
        status: lessonProg?.status || 'not_started',
        // Hide protected video & content if locked
        content: isLocked ? null : les.content,
        videos: isLocked
          ? lessonVideos.map((v) => ({ id: v.id, title: v.title, durationSeconds: v.durationSeconds, isLocked: true }))
          : lessonVideos.map((v) => {
              const vp = userVideoProgress.find((p) => p.videoId === v.id);
              return {
                ...v,
                lastPositionSeconds: vp ? Number(vp.lastPositionSeconds) : 0,
                percentageWatched: vp ? Number(vp.percentageWatched) : 0,
                isCompleted: vp ? vp.isCompleted : false,
              };
            }),
        materials: isLocked ? [] : lessonMaterials,
      };
    });

    const modulesWithLessons = modules.map((m) => ({
      ...m,
      lessons: lessonsWithAccess.filter((l) => l.moduleId === m.id),
    }));

    // 7. Live Sessions with Meeting Links (visible to enrolled learners)
    const sessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.courseId, course.id))
      .orderBy(asc(trainingSessions.sessionDate));

    // 8. Assessments & Results
    const assessments = await db
      .select()
      .from(trainingAssessments)
      .where(eq(trainingAssessments.courseId, course.id))
      .orderBy(asc(trainingAssessments.orderIndex));

    const results = await db
      .select()
      .from(trainingResults)
      .where(and(eq(trainingResults.userId, user.id), eq(trainingResults.courseId, course.id)));

    // 9. Certificate
    const [certificate] = await db
      .select()
      .from(trainingCertificates)
      .where(and(eq(trainingCertificates.userId, user.id), eq(trainingCertificates.courseId, course.id)))
      .limit(1);

    return NextResponse.json({
      success: true,
      course,
      enrollment: enrollment || { accessStatus: 'admin_preview', progressPercentage: 100 },
      modules: modulesWithLessons,
      sessions,
      assessments: assessments.map((a) => {
        const res = results.find((r) => r.assessmentId === a.id);
        return {
          ...a,
          result: res || null,
        };
      }),
      progress: {
        percentage: Number(userCourseProgress?.progressPercentage || enrollment?.progressPercentage || 0),
        completedLessonsCount: userCourseProgress?.completedLessonsCount || 0,
        totalLessonsCount: userCourseProgress?.totalLessonsCount || lessons.length,
        isCompleted: userCourseProgress?.isCompleted || false,
        isEligibleForCertificate: userCourseProgress?.isEligibleForCertificate || false,
      },
      certificate: certificate || null,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error fetching learner course portal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
