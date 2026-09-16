import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type SqlParam = string | number | boolean | null | Buffer | Date | object;

const UpdateCourseSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().optional(),
  price: z.union([z.number(), z.string().transform((val) => parseFloat(val))]).pipe(z.number().min(0)).optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  level: z.string().optional(),
  duration: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const courseId = parseInt(params.id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = UpdateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates = parsed.data;
    const fields: string[] = [];
    const values: SqlParam[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price); }
    if (updates.level !== undefined) { fields.push('level = ?'); values.push(updates.level); }
    if (updates.duration !== undefined) { fields.push('duration = ?'); values.push(updates.duration); }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      if (updates.status === 'published') {
        fields.push('published_at = COALESCE(published_at, NOW())');
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update.' }, { status: 400 });
    }

    fields.push('updated_at = NOW()');
    values.push(courseId);

    await execute(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true, message: 'Course updated successfully.' });

  } catch (error) {
    console.error('[/api/courses/[id] PATCH]', error);
    return NextResponse.json({ success: false, message: 'Failed to update course.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const courseId = parseInt(params.id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    await execute('DELETE FROM courses WHERE id = ?', [courseId]);

    return NextResponse.json({ success: true, message: 'Course deleted successfully.' });

  } catch (error) {
    console.error('[/api/courses/[id] DELETE]', error);
    return NextResponse.json({ success: false, message: 'Failed to delete course.' }, { status: 500 });
  }
}
