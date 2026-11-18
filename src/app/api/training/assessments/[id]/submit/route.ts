import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingAssessments,
  trainingResults,
  trainingSubmissions,
  trainingEnrollments,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { issueCertificateForLearner, recalculateLearnerCourseProgress } from '@/lib/training-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const assessmentId = Number(params.id);

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [assessment] = await db
      .select()
      .from(trainingAssessments)
      .where(eq(trainingAssessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 });
    }

    const body = await request.json();
    const { answers, practicalText, fileUrl, fileName } = body;

    let totalScore = 0;
    let earnedScore = 0;
    const questions = (assessment.questionsData as any[]) || [];

    if (questions.length > 0 && answers) {
      for (const q of questions) {
        const points = q.points || 10;
        totalScore += points;
        const selected = answers[q.id];
        if (selected !== undefined && Number(selected) === q.correctIndex) {
          earnedScore += points;
        }
      }
    } else {
      totalScore = 100;
      earnedScore = 100;
    }

    const percentage = totalScore > 0 ? Math.round((earnedScore / totalScore) * 10000) / 100 : 100;
    const passed = percentage >= assessment.passingScore;

    // Insert or update training_results
    const [existingResult] = await db
      .select()
      .from(trainingResults)
      .where(and(eq(trainingResults.assessmentId, assessmentId), eq(trainingResults.userId, user.id)))
      .limit(1);

    let resultRecord;
    if (existingResult) {
      [resultRecord] = await db
        .update(trainingResults)
        .set({
          score: earnedScore,
          totalScore,
          percentage,
          passed,
          answersData: answers || null,
          attemptNumber: existingResult.attemptNumber + 1,
          completedAt: new Date().toISOString(),
        })
        .where(eq(trainingResults.id, existingResult.id))
        .returning();
    } else {
      [resultRecord] = await db
        .insert(trainingResults)
        .values({
          assessmentId,
          userId: user.id,
          courseId: assessment.courseId,
          score: earnedScore,
          totalScore,
          percentage,
          passed,
          answersData: answers || null,
          attemptNumber: 1,
          completedAt: new Date().toISOString(),
        })
        .returning();
    }

    // If practical text or file submission was provided
    if (practicalText || fileUrl) {
      await db.insert(trainingSubmissions).values({
        assessmentId,
        courseId: assessment.courseId,
        userId: user.id,
        submissionText: practicalText || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        status: 'submitted',
        score: earnedScore,
        submittedAt: new Date().toISOString(),
      });
    }

    // Recalculate course progress
    await recalculateLearnerCourseProgress(user.id, assessment.courseId);

    // If passed and course is completed, check certificate
    let certificate = null;
    if (passed) {
      try {
        certificate = await issueCertificateForLearner({
          userId: user.id,
          courseId: assessment.courseId,
        });
      } catch (certErr: any) {
        // Learner may still have remaining lessons
      }
    }

    return NextResponse.json({
      success: true,
      passed,
      score: earnedScore,
      totalScore,
      percentage,
      passingScore: assessment.passingScore,
      certificate,
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
