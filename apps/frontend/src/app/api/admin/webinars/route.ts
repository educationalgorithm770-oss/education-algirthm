import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    // 1. Fetch all masterclasses
    const webinars = await query<RowDataPacket[]>(
      `SELECT 
        lc.id,
        lc.course_id,
        lc.title,
        lc.instructor_name,
        lc.meet_link,
        lc.scheduled_at,
        lc.duration_minutes,
        lc.status,
        lc.created_at,
        c.title AS course_title,
        c.slug AS course_slug,
        c.level AS course_level,
        i.title AS instructor_title
      FROM live_classes lc
      LEFT JOIN courses c ON lc.course_id = c.id
      LEFT JOIN instructors i ON CONVERT(lc.instructor_name USING utf8mb4) = CONVERT(i.name USING utf8mb4)
      ORDER BY 
        CASE 
          WHEN lc.status = 'live' THEN 1
          WHEN lc.status = 'upcoming' THEN 2
          ELSE 3
        END ASC,
        lc.scheduled_at ASC`
    );

    // 2. Fetch all attendee leads registered via webinars
    const attendees = await query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        email,
        phone,
        course_id,
        source,
        status,
        notes,
        created_at
      FROM crm_leads
      WHERE source = 'webinar_landing' OR notes LIKE '%webinar%' OR notes LIKE '%masterclass%'
      ORDER BY created_at DESC
      LIMIT 100`
    );

    // 3. Compute summary statistics
    const stats = {
      total: webinars.length,
      upcoming: webinars.filter((w) => w.status === 'upcoming').length,
      live: webinars.filter((w) => w.status === 'live').length,
      completed: webinars.filter((w) => w.status === 'completed').length,
      totalAttendees: attendees.length,
    };

    return NextResponse.json({
      success: true,
      webinars: webinars.map((w) => ({
        id: w.id,
        courseId: w.course_id,
        title: w.title,
        courseTitle: w.course_title || 'Enterprise Track',
        courseSlug: w.course_slug || 'general',
        instructor: w.instructor_name || 'Senior Faculty Lead',
        instructorTitle: w.instructor_title || 'Lead Architect',
        meetLink: w.meet_link,
        scheduledAt: w.scheduled_at,
        durationMinutes: w.duration_minutes || 60,
        status: w.status || 'upcoming',
        createdAt: w.created_at,
      })),
      attendees: attendees.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        status: a.status,
        notes: a.notes,
        createdAt: a.created_at,
      })),
      stats,
    });
  } catch (error: any) {
    console.error('API /api/admin/webinars GET Error:', error);
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
    const { title, courseId, instructorName, meetLink, scheduledAt, durationMinutes, status } = body;

    if (!title || !meetLink || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'Title, meeting link, and scheduled date/time are required.' }, { status: 400 });
    }

    const cId = Number(courseId) || 1;
    const dur = Number(durationMinutes) || 60;
    const instructor = instructorName?.trim() || 'Dr. Sarah Jenkins';
    const initialStatus = status || 'upcoming';

    const result = await execute(
      `INSERT INTO live_classes (course_id, title, instructor_name, meet_link, scheduled_at, duration_minutes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [cId, title.trim(), instructor, meetLink.trim(), scheduledAt, dur, initialStatus]
    );

    return NextResponse.json({
      success: true,
      message: 'Webinar masterclass scheduled successfully.',
      webinarId: result.insertId,
    });
  } catch (error: any) {
    console.error('API /api/admin/webinars POST Error:', error);
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
    const { id, title, courseId, instructorName, meetLink, scheduledAt, durationMinutes, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Webinar ID is required.' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
    if (courseId !== undefined) { updates.push('course_id = ?'); params.push(Number(courseId)); }
    if (instructorName !== undefined) { updates.push('instructor_name = ?'); params.push(instructorName.trim()); }
    if (meetLink !== undefined) { updates.push('meet_link = ?'); params.push(meetLink.trim()); }
    if (scheduledAt !== undefined) { updates.push('scheduled_at = ?'); params.push(scheduledAt); }
    if (durationMinutes !== undefined) { updates.push('duration_minutes = ?'); params.push(Number(durationMinutes)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields provided to update.' }, { status: 400 });
    }

    params.push(Number(id));
    await execute(`UPDATE live_classes SET ${updates.join(', ')} WHERE id = ?`, params);

    return NextResponse.json({
      success: true,
      message: 'Webinar masterclass updated successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/webinars PUT Error:', error);
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
      return NextResponse.json({ success: false, error: 'Webinar ID is required.' }, { status: 400 });
    }

    await execute(`DELETE FROM live_classes WHERE id = ?`, [Number(id)]);

    return NextResponse.json({
      success: true,
      message: 'Webinar masterclass removed successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/webinars DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
