import { NextRequest, NextResponse } from 'next/server';
import { recordLearnerVideoHeartbeat } from '@/lib/training-service';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, lessonId, videoId, currentPositionSeconds, durationSeconds } = body;

    if (!courseId || !lessonId || !videoId) {
      return NextResponse.json({ success: false, error: 'Missing required progress parameters' }, { status: 400 });
    }

    const result = await recordLearnerVideoHeartbeat({
      userId: user.id,
      courseId: Number(courseId),
      lessonId: Number(lessonId),
      videoId: Number(videoId),
      currentPositionSeconds: Number(currentPositionSeconds || 0),
      durationSeconds: Number(durationSeconds || 0),
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error('Error saving video progress heartbeat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save heartbeat' },
      { status: 500 }
    );
  }
}
