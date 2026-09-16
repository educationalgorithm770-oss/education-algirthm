import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    // 1. Fetch all available courses
    const courses = await query<RowDataPacket[]>(
      'SELECT id, title, slug, price FROM courses ORDER BY id ASC'
    );

    // 2. Fetch instructors with their assigned courses and learner counts
    const instructors = await query<RowDataPacket[]>(
      `SELECT i.id, i.name, i.email, i.phone, i.title, i.bio, i.avatar_url, i.status, i.created_at,
              GROUP_CONCAT(DISTINCT c.id) AS assigned_course_ids,
              GROUP_CONCAT(DISTINCT c.title SEPARATOR '||') AS assigned_course_names,
              COUNT(DISTINCT ci.course_id) AS total_assigned_courses,
              (
                SELECT COUNT(DISTINCT e.id)
                FROM enrollments e
                INNER JOIN course_instructors ci2 ON ci2.course_id = e.course_id
                WHERE ci2.instructor_id = i.id AND (e.status = 'active' OR e.status = 'approved' OR e.status IS NULL)
              ) AS students_taught
       FROM instructors i
       LEFT JOIN course_instructors ci ON ci.instructor_id = i.id
       LEFT JOIN courses c ON c.id = ci.course_id
       GROUP BY i.id
       ORDER BY i.id ASC`
    );

    return NextResponse.json({
      success: true,
      courses,
      instructors: instructors.map((ins) => {
        const courseIds = ins.assigned_course_ids
          ? String(ins.assigned_course_ids).split(',').map((id) => Number(id))
          : [];
        const courseNames = ins.assigned_course_names
          ? String(ins.assigned_course_names).split('||').filter(Boolean)
          : [];

        return {
          id: `INS-${String(ins.id).padStart(2, '0')}`,
          rawId: ins.id,
          name: ins.name,
          avatar:
            ins.avatar_url ||
            ins.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase(),
          role: ins.title || 'Faculty Lead',
          email: ins.email || 'faculty@edualg.com',
          bio: ins.bio || '',
          assignedCourseIds: courseIds,
          assignedCourseNames: courseNames,
          assignedCourses: courseIds.length,
          studentsTaught: Number(ins.students_taught || 0),
          rating: 4.9,
          status: ins.status === 'inactive' ? 'on_leave' : 'active',
        };
      }),
    });
  } catch (error: any) {
    console.error('API /api/admin/instructors GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, bio, courseIds } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Faculty name and email are required.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await query<RowDataPacket[]>(
      'SELECT id FROM instructors WHERE LOWER(email) = ? LIMIT 1',
      [cleanEmail]
    );

    let instructorId: number;

    if (existing.length > 0) {
      instructorId = existing[0].id;
      await execute(
        `UPDATE instructors 
         SET name = ?, title = ?, bio = ?, password = ?, status = 'active'
         WHERE id = ?`,
        [name.trim(), role?.trim() || 'Faculty Lead', bio?.trim() || '', passwordHash, instructorId]
      );
    } else {
      const result = await execute(
        `INSERT INTO instructors (name, email, username, title, bio, status, password, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())`,
        [name.trim(), cleanEmail, cleanEmail, role?.trim() || 'Faculty Lead', bio?.trim() || '', passwordHash]
      );
      instructorId = result.insertId;
    }

    // Sync Course Assignments in course_instructors
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      await execute('DELETE FROM course_instructors WHERE instructor_id = ?', [instructorId]);
      for (const cId of courseIds) {
        if (Number(cId)) {
          await execute(
            'INSERT INTO course_instructors (instructor_id, course_id, assigned_at) VALUES (?, ?, NOW())',
            [instructorId, Number(cId)]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Faculty member "${name}" created successfully with assigned courses.`,
      instructorId,
    });
  } catch (error: any) {
    console.error('API /api/admin/instructors POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { rawId, name, email, password, role, bio, courseIds } = body;

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Faculty ID is required.' }, { status: 400 });
    }

    const instructorId = Number(rawId);
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // Build update fields
    if (password && password.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      await execute(
        `UPDATE instructors 
         SET name = ?, email = COALESCE(?, email), username = COALESCE(?, username), title = ?, bio = ?, password = ?
         WHERE id = ?`,
        [name?.trim(), cleanEmail, cleanEmail, role?.trim() || 'Faculty Lead', bio?.trim() || '', passwordHash, instructorId]
      );
    } else {
      await execute(
        `UPDATE instructors 
         SET name = ?, email = COALESCE(?, email), username = COALESCE(?, username), title = ?, bio = ?
         WHERE id = ?`,
        [name?.trim(), cleanEmail, cleanEmail, role?.trim() || 'Faculty Lead', bio?.trim() || '', instructorId]
      );
    }

    // Sync Course Assignments
    if (Array.isArray(courseIds)) {
      await execute('DELETE FROM course_instructors WHERE instructor_id = ?', [instructorId]);
      for (const cId of courseIds) {
        if (Number(cId)) {
          await execute(
            'INSERT INTO course_instructors (instructor_id, course_id, assigned_at) VALUES (?, ?, NOW())',
            [instructorId, Number(cId)]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Faculty profile and assigned courses updated successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/instructors PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Instructor ID is required.' }, { status: 400 });
    }

    const instructorId = Number(id);

    // Remove assignments and instructor
    await execute('DELETE FROM course_instructors WHERE instructor_id = ?', [instructorId]);
    await execute('DELETE FROM instructors WHERE id = ?', [instructorId]);

    return NextResponse.json({
      success: true,
      message: 'Faculty member removed successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/instructors DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { rawId, status } = body;

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Instructor ID is required.' }, { status: 400 });
    }

    const dbStatus = status === 'on_leave' ? 'inactive' : 'active';
    await execute(
      `UPDATE instructors SET status = ? WHERE id = ?`,
      [dbStatus, Number(rawId)]
    );

    return NextResponse.json({
      success: true,
      message: 'Instructor status updated in database.',
    });
  } catch (error: any) {
    console.error('API /api/admin/instructors PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
