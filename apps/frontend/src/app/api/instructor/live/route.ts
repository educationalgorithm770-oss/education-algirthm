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

    let courseClause = '';
    let params: any[] = [];

    if (!isAdmin) {
      courseClause = `WHERE lc.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)`;
      params = [instructorId];
    }

    const liveRows = await query<RowDataPacket[]>(
      `SELECT lc.id, lc.course_id, lc.title, lc.instructor_name, lc.meet_link, 
              lc.scheduled_at, lc.duration_minutes, lc.status,
              COALESCE(c.title, 'General Track') AS course_title
       FROM live_classes lc
       LEFT JOIN courses c ON lc.course_id = c.id
       ${courseClause}
       ORDER BY lc.scheduled_at DESC`,
      params
    );

    return NextResponse.json({
      success: true,
      sessions: liveRows.map((l) => ({
        id: `L-${l.id}`,
        rawId: l.id,
        title: l.title,
        course: l.course_title,
        batch: 'Cohort 2026',
        date: l.scheduled_at ? new Date(l.scheduled_at).toLocaleDateString([], { dateStyle: 'medium' }) : 'Upcoming',
        time: l.scheduled_at ? new Date(l.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:00',
        scheduledAt: l.scheduled_at,
        platform: 'Live Studio',
        meetingUrl: l.meet_link,
        status: l.status || 'upcoming',
        enrolledStudents: 142,
      })),
    });
  } catch (error: any) {
    console.error('API /api/instructor/live GET Error:', error);
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
    const { title, date, time, meetingUrl, courseId } = body;

    if (!title || !date || !meetingUrl) {
      return NextResponse.json({ success: false, error: 'Title, date, and meeting URL are required.' }, { status: 400 });
    }

    const scheduledDateTime = `${date} ${time || '18:00'}:00`;
    const instructorName = session.name || 'Lead Faculty';
    const cId = Number(courseId) || 1;

    const result = await execute(
      `INSERT INTO live_classes (course_id, title, instructor_name, meet_link, scheduled_at, duration_minutes, status, created_at)
       VALUES (?, ?, ?, ?, ?, 60, 'upcoming', NOW())`,
      [cId, title.trim(), instructorName, meetingUrl.trim(), scheduledDateTime]
    );

    return NextResponse.json({
      success: true,
      message: 'Masterclass scheduled successfully.',
      sessionId: `L-${result.insertId}`,
    });
  } catch (error: any) {
    console.error('API /api/instructor/live POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
