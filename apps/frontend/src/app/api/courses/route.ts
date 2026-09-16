import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  level: string;
  duration: string;
  price: number;
  status: string;
}

interface ModuleRow extends RowDataPacket {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
}

interface VideoRow extends RowDataPacket {
  id: number;
  module_id: number;
  title: string;
  bunny_video_id: string | null;
  duration: string | null;
  sort_order: number;
}

// ── GET: Fetch all courses (for public catalog or admin dashboard) ───────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const showAll = request.nextUrl.searchParams.get('all') === 'true';

    // Only allow viewing draft/archived courses if explicitly requested in admin console with admin session
    // (or if explicit ?all=true query is provided by admin studio)
    const courses = showAll && (session?.role === 'admin' || process.env.NODE_ENV !== 'production')
      ? await query<CourseRow[]>('SELECT * FROM courses ORDER BY id ASC')
      : await query<CourseRow[]>("SELECT * FROM courses WHERE LOWER(status) = 'published' ORDER BY id ASC");

    if (courses.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    const courseIds = courses.map((c) => c.id);
    const modules = await query<ModuleRow[]>(
      `SELECT * FROM modules WHERE course_id IN (${courseIds.map(() => '?').join(',')}) ORDER BY sort_order ASC, id ASC`,
      courseIds
    );

    const moduleIds = modules.map((m) => m.id);
    const videos = moduleIds.length > 0
      ? await query<VideoRow[]>(
          `SELECT * FROM videos WHERE module_id IN (${moduleIds.map(() => '?').join(',')}) ORDER BY sort_order ASC, id ASC`,
          moduleIds
        )
      : [];

    // Group videos by module
    const videosByModule = new Map<number, VideoRow[]>();
    videos.forEach((v) => {
      const list = videosByModule.get(v.module_id) ?? [];
      list.push(v);
      videosByModule.set(v.module_id, list);
    });

    // Group modules by course
    const modulesByCourse = new Map<number, unknown[]>();
    modules.forEach((m) => {
      const list = modulesByCourse.get(m.course_id) ?? [];
      list.push({
        id: m.id,
        title: m.title,
        description: m.description,
        videos: videosByModule.get(m.id) ?? [],
      });
      modulesByCourse.set(m.course_id, list);
    });

    const fullCourses = courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug ?? c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: c.description,
      level: c.level,
      duration: c.duration,
      price: Number(c.price) || 0,
      status: c.status,
      modules: modulesByCourse.get(c.id) ?? [],
    }));

    return NextResponse.json({ success: true, courses: fullCourses });

  } catch (error) {
    console.error('[/api/courses GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses.' }, { status: 500 });
  }
}

// ── POST: Create new course (Admin only) ──────────────────────────────────────
const CreateCourseSchema = z.object({
  title: z.string().min(3, 'Title is required').max(150),
  description: z.string().optional(),
  level: z.string().default('Intermediate'),
  duration: z.string().default('12 Weeks'),
  price: z.union([z.number(), z.string().transform((val) => parseFloat(val))]).pipe(z.number().min(0)),
  status: z.enum(['published', 'draft', 'archived']).default('draft'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description, level, duration, price, status } = parsed.data;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await execute(
      `INSERT INTO courses (title, slug, description, level, duration, price, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, IF(? = 'published', NOW(), NULL), NOW(), NOW())`,
      [title, slug, description ?? null, level, duration, price, status, status]
    );

    return NextResponse.json({
      success: true,
      message: `Course "${title}" created successfully.`,
      courseId: result.insertId,
    }, { status: 201 });

  } catch (error) {
    console.error('[/api/courses POST]', error);
    return NextResponse.json({ success: false, message: 'Failed to create course.' }, { status: 500 });
  }
}
