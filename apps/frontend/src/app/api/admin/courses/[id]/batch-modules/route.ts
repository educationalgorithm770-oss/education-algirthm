import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const courseId = parseInt(params.id, 10);
    if (isNaN(courseId) || courseId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid course ID.' }, { status: 400 });
    }

    const body = await request.json();
    const { modules } = body;

    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ success: false, error: 'No modules provided to import.' }, { status: 400 });
    }

    let insertedModules = 0;

    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const mod = modules[mIdx];
      const modTitle = String(mod.title || `Module ${mIdx + 1}`).trim().slice(0, 250);
      const modDesc = String(mod.description || '').trim();

      await execute(
        `INSERT INTO modules (course_id, title, description, sort_order, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [courseId, modTitle, modDesc, mIdx + 1]
      );

      insertedModules++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedModules} modules.`,
      insertedModules,
    });
  } catch (error: any) {
    console.error('API /api/admin/courses/[id]/batch-modules Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
