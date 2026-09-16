import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const BookmarkSchema = z.object({
  lessonId:   z.number().int().positive('Valid lesson ID is required'),
  courseId:   z.number().int().positive('Valid course ID is required'),
  bookmarked: z.boolean(),
  noteText:   z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = BookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { lessonId, courseId, bookmarked, noteText } = parsed.data;
    const studentId = Number(session.sub);

    if (bookmarked) {
      await execute(
        `INSERT INTO student_bookmarks (student_id, lesson_id, course_id, note_text, bookmarked_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE note_text = VALUES(note_text), bookmarked_at = NOW()`,
        [studentId, lessonId, courseId, noteText ?? null]
      );
    } else {
      await execute(
        `DELETE FROM student_bookmarks WHERE student_id = ? AND lesson_id = ?`,
        [studentId, lessonId]
      );
    }

    return NextResponse.json({ success: true, bookmarked, lessonId });

  } catch (error: unknown) {
    console.error('[/api/progress/bookmark]', error);
    return NextResponse.json({ success: false, message: 'Failed to update bookmark.' }, { status: 500 });
  }
}
