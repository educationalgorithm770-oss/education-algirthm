import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const instructorId = Number(session.sub) || 1;
    const isAdmin = session.role === 'admin';

    // Fetch only assigned courses for this instructor
    let courses: RowDataPacket[] = [];
    if (isAdmin) {
      courses = await query<RowDataPacket[]>(
        'SELECT id, title, slug, description, level, duration, price, status FROM courses ORDER BY id ASC'
      );
    } else {
      courses = await query<RowDataPacket[]>(
        `SELECT c.id, c.title, c.slug, c.description, c.level, c.duration, c.price, c.status 
         FROM courses c
         INNER JOIN course_instructors ci ON ci.course_id = c.id
         WHERE ci.instructor_id = ?
         ORDER BY c.id ASC`,
        [instructorId]
      );

      // Fallback to course 1 if not explicitly linked
      if (courses.length === 0) {
        courses = await query<RowDataPacket[]>(
          'SELECT id, title, slug, description, level, duration, price, status FROM courses WHERE id = 1'
        );
      }
    }

    const courseIds = courses.map((c) => c.id);
    const courseIdList = courseIds.length > 0 ? courseIds.join(',') : '1';

    // Fetch modules with videos for assigned courses
    const modules = await query<RowDataPacket[]>(
      `SELECT id, course_id, title, description, sort_order 
       FROM modules 
       WHERE course_id IN (${courseIdList}) 
       ORDER BY sort_order ASC, id ASC`
    );

    const moduleIds = modules.map((m) => m.id);
    const moduleIdList = moduleIds.length > 0 ? moduleIds.join(',') : '0';

    const videos = await query<RowDataPacket[]>(
      `SELECT id, module_id, title, file_path, video_url, youtube_id, duration, sort_order 
       FROM videos 
       WHERE module_id IN (${moduleIdList}) 
       ORDER BY sort_order ASC, id ASC`
    );

    const courseTree = courses.map((course) => {
      const courseModules = modules
        .filter((m) => m.course_id === course.id)
        .map((mod) => ({
          id: `sec-${mod.id}`,
          rawId: mod.id,
          title: mod.title,
          description: mod.description,
          lessons: videos
            .filter((v) => v.module_id === mod.id)
            .map((vid) => ({
              id: `les-${vid.id}`,
              rawId: vid.id,
              title: vid.title,
              duration: vid.duration || '20 mins',
              videoUrl: vid.video_url || vid.file_path || 'https://youtube.com/watch?v=sample',
              type: 'video',
              isPublished: true,
            })),
        }));

      return {
        ...course,
        sections: courseModules,
      };
    });

    return NextResponse.json({
      success: true,
      courses: courseTree,
    });
  } catch (error: any) {
    console.error('API /api/instructor/courses GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, title, duration, videoUrl } = body;

    const rawModuleId = typeof moduleId === 'string' ? parseInt(moduleId.replace(/^sec-/, ''), 10) : Number(moduleId);
    if (!rawModuleId || !title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Module ID and lesson title are required.' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO videos (module_id, title, file_path, video_url, duration, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [rawModuleId, title.trim(), videoUrl?.trim() || 'https://youtube.com/watch?v=sample', videoUrl?.trim() || '', duration?.trim() || '20 mins']
    );

    return NextResponse.json({
      success: true,
      message: 'Lesson added to module.',
      lessonId: `les-${result.insertId}`,
    });
  } catch (error: any) {
    console.error('API /api/instructor/courses POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
