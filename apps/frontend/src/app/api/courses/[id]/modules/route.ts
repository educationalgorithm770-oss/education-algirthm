import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateModuleSchema = z.object({
  title: z.string().min(2, 'Module title is required').max(150),
  description: z.string().optional(),
});

export async function POST(
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
    const parsed = CreateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description } = parsed.data;

    const result = await execute(
      `INSERT INTO modules (course_id, title, description, sort_order, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [courseId, title, description ?? null]
    );

    return NextResponse.json({
      success: true,
      message: 'Module added successfully.',
      moduleId: result.insertId,
    }, { status: 201 });

  } catch (error) {
    console.error('[/api/courses/[id]/modules POST]', error);
    return NextResponse.json({ success: false, message: 'Failed to add module.' }, { status: 500 });
  }
}
