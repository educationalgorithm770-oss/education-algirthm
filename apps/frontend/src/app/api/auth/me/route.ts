import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// This route reads request.cookies — must not be statically rendered
export const dynamic = 'force-dynamic';

interface StudentRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { success: true, authenticated: false, user: null, message: 'Not authenticated' },
        { status: 200 }
      );
    }

    if (session.role === 'admin') {
      const adminRows = await query<RowDataPacket[]>(
        'SELECT id, username FROM admins WHERE id = ? LIMIT 1',
        [Number(session.sub)]
      );
      const admin = adminRows[0];
      return NextResponse.json({
        success: true,
        user: {
          id: admin ? admin.id : Number(session.sub),
          name: admin ? admin.username : session.name || 'Admin',
          email: admin ? admin.username : session.email || 'admin@edualg.com',
          role: 'admin',
          enrolledCourses: [],
          enrolledCourseIds: [],
        },
      });
    }

    if (session.role === 'instructor') {
      const instRows = await query<RowDataPacket[]>(
        'SELECT id, name, email, title, status FROM instructors WHERE id = ? LIMIT 1',
        [Number(session.sub)]
      );
      const inst = instRows[0];
      return NextResponse.json({
        success: true,
        user: {
          id: inst ? inst.id : Number(session.sub),
          name: inst ? inst.name : session.name || 'Instructor',
          email: inst ? inst.email : session.email || 'instructor@edualg.com',
          title: inst?.title || 'Faculty Member',
          role: 'instructor',
          enrolledCourses: [],
          enrolledCourseIds: [],
        },
      });
    }

    // Refresh student data from DB
    const rows = await query<StudentRow[]>(
      'SELECT id, name, email, phone, status, created_at FROM students WHERE id = ? LIMIT 1',
      [Number(session.sub)]
    );

    const student = rows[0];

    if (!student || student.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account not found or suspended.' },
        { status: 401 }
      );
    }

    // Fetch student's enrolled courses from MySQL
    const enrollmentRows = await query<RowDataPacket[]>(
      `SELECT DISTINCT e.course_id, e.course, c.title AS course_title
       FROM enrollments e
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE (e.student_id = ? OR LOWER(e.email) = LOWER(?))
         AND (e.payment_status IN ('paid', 'partial', 'scholarship', 'completed', 'waived'))
         AND (e.status = 'active' OR e.status = 'approved' OR e.status IS NULL)`,
      [student.id, student.email]
    );

    const enrolledCourses = Array.from(
      new Set(
        enrollmentRows
          .flatMap((r) => [r.course_title, r.course])
          .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim().length > 0))
      )
    );

    const enrolledCourseIds = Array.from(
      new Set(
        enrollmentRows
          .map((r) => r.course_id)
          .filter((id): id is number => typeof id === 'number')
      )
    );

    return NextResponse.json({
      success: true,
      user: {
        id:                student.id,
        name:              student.name,
        email:             student.email,
        phone:             student.phone,
        status:            student.status,
        created_at:        student.created_at,
        role:              session.role,
        enrolledCourses:   enrolledCourses,
        enrolledCourseIds: enrolledCourseIds,
      },
    });

  } catch (error: unknown) {
    console.error('[/api/auth/me]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
