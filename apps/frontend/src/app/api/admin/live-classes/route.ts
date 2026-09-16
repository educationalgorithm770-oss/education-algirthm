import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Admin or instructor authentication required.' }, { status: 403 });
    }

    const classes = await query<RowDataPacket[]>(
      `SELECT lc.id, lc.title, lc.instructor_name, lc.meet_link, lc.scheduled_at, 
              lc.duration_minutes, lc.status, lc.course_id, c.title AS course_title
       FROM live_classes lc
       LEFT JOIN courses c ON lc.course_id = c.id
       ORDER BY lc.scheduled_at DESC`
    );

    return NextResponse.json({
      success: true,
      classes: classes.map((c) => ({
        id: c.id,
        courseId: c.course_id || 1,
        title: c.title,
        courseTitle: c.course_title || 'General Engineering Track',
        instructor: c.instructor_name || 'Faculty Lead',
        meetLink: c.meet_link,
        scheduledAt: c.scheduled_at,
        duration: `${c.duration_minutes || 60} mins`,
        status: c.status || 'upcoming',
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/live-classes GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Admin or instructor authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, courseId, instructorName, meetLink, scheduledAt, durationMinutes } = body;

    if (!title || !meetLink || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'Title, meeting link, and scheduled date/time are required.' }, { status: 400 });
    }

    const cId = Number(courseId) || 1;
    const dur = Number(durationMinutes) || 60;
    const instructor = instructorName?.trim() || 'Prof. Lead Faculty';

    const result = await execute(
      `INSERT INTO live_classes (course_id, title, instructor_name, meet_link, scheduled_at, duration_minutes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'upcoming', NOW())`,
      [cId, title.trim(), instructor, meetLink.trim(), scheduledAt, dur]
    );

    return NextResponse.json({
      success: true,
      message: 'Live session scheduled successfully.',
      classId: result.insertId,
    });
  } catch (error: any) {
    console.error('API /api/admin/live-classes POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Admin or instructor authentication required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Class ID is required.' }, { status: 400 });
    }

    await execute(`DELETE FROM live_classes WHERE id = ?`, [Number(id)]);

    return NextResponse.json({
      success: true,
      message: 'Live class removed.',
    });
  } catch (error: any) {
    console.error('API /api/admin/live-classes DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
