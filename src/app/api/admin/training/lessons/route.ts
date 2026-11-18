import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingLessons, trainingVideos, trainingMaterials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const {
      moduleId,
      courseId,
      title,
      slug,
      description,
      content,
      lessonType,
      durationMinutes,
      isFreePreview,
      isReleased,
      releaseType,
      videoUrl,
      videoProvider,
    } = body;

    if (!moduleId || !courseId || !title) {
      return NextResponse.json({ success: false, error: 'Module ID, Course ID, and Title are required.' }, { status: 400 });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [lesson] = await db
      .insert(trainingLessons)
      .values({
        moduleId: Number(moduleId),
        courseId: Number(courseId),
        title,
        slug: generatedSlug,
        description: description || null,
        content: content || null,
        lessonType: lessonType || 'video',
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        isFreePreview: Boolean(isFreePreview),
        isReleased: isReleased !== undefined ? Boolean(isReleased) : true,
        releaseType: releaseType || 'immediate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // If video URL was provided, create training_videos record
    if (videoUrl) {
      const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
      let ytId = '';
      if (isYoutube) {
        const m = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (m) ytId = m[1];
      }

      await db.insert(trainingVideos).values({
        lessonId: lesson.id,
        courseId: Number(courseId),
        title,
        provider: videoProvider || (isYoutube ? 'youtube' : 'tasklynk_hosted'),
        videoUrl,
        externalVideoId: ytId || null,
        durationSeconds: (durationMinutes || 45) * 60,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, lesson });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, isReleased, ...updates } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Lesson ID required' }, { status: 400 });

    const [updated] = await db
      .update(trainingLessons)
      .set({
        ...updates,
        ...(isReleased !== undefined ? { isReleased: Boolean(isReleased) } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trainingLessons.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, lesson: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
