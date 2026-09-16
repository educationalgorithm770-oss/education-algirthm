import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute, query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

const ToggleSchema = z.object({
  lessonId:  z.number().int().positive('Valid lesson ID is required'),
  courseId:  z.number().int().positive('Valid course ID is required'),
  completed: z.boolean(),
});

interface CompletionRow extends RowDataPacket {
  id: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { lessonId, courseId, completed } = parsed.data;
    const studentId = Number(session.sub);

    // Verify student is actively enrolled in this course (unless admin/instructor)
    if (session.role !== 'admin' && session.role !== 'instructor') {
      const enrollments = await query<RowDataPacket[]>(
        `SELECT id FROM enrollments 
         WHERE student_id = ? AND (course_id = ? OR course = (SELECT title FROM courses WHERE id = ?))
           AND status IN ('active', 'ENROLLED', 'completed')
         LIMIT 1`,
        [studentId, courseId, courseId]
      );
      if (enrollments.length === 0) {
        return NextResponse.json({ success: false, message: 'Active course enrollment required.' }, { status: 403 });
      }
    }

    if (completed) {
      // Mark lesson as complete — INSERT IGNORE for idempotency
      await execute(
        `INSERT IGNORE INTO lesson_completions (student_id, item_type, item_id, completed_at)
         VALUES (?, 'video', ?, NOW())`,
        [studentId, lessonId]
      );
    } else {
      // Unmark lesson
      await execute(
        `DELETE FROM lesson_completions WHERE student_id = ? AND item_id = ? AND item_type = 'video'`,
        [studentId, lessonId]
      );
    }

    // Recalculate progress percentage for this course
    const progressRows = await query<({ total: number; done: number } & RowDataPacket)[]>(
      `SELECT
         (SELECT COUNT(*) FROM videos v
          JOIN modules m ON v.module_id = m.id
          WHERE m.course_id = ?) AS total,
         (SELECT COUNT(DISTINCT lc.item_id) FROM lesson_completions lc
          JOIN videos v2 ON lc.item_id = v2.id
          JOIN modules m2 ON v2.module_id = m2.id
          WHERE m2.course_id = ? AND lc.student_id = ?) AS done`,
      [courseId, courseId, studentId]
    );

    const { total, done } = progressRows[0] ?? { total: 0, done: 0 };
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return NextResponse.json({
      success:    true,
      completed,
      lessonId,
      progress:   { total, done, percentage },
    });

  } catch (error: unknown) {
    console.error('[/api/progress/toggle]', error);
    return NextResponse.json({ success: false, message: 'Failed to update progress.' }, { status: 500 });
  }
}
