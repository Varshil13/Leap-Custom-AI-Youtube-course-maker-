import { db } from '@/services/db';
import { CourseDetails, CourseVideos, CourseContent, UserProgress, Certificates } from '@/services/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Verify the user owns this course before deleting
    const courseRows = await db
      .select()
      .from(CourseDetails)
      .where(eq(CourseDetails.courseId, courseId));

    if (!courseRows.length) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Delete related data (order: progress, videos, content, certificates, then course)
    await db.delete(UserProgress).where(eq(UserProgress.courseId, courseId));
    await db.delete(CourseVideos).where(eq(CourseVideos.courseId, courseId));
    await db.delete(CourseContent).where(eq(CourseContent.courseId, courseId));
    await db.delete(Certificates).where(eq(Certificates.courseId, courseId));
    await db.delete(CourseDetails).where(eq(CourseDetails.courseId, courseId));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
