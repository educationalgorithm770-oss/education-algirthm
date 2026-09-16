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

    const announcements = await query<RowDataPacket[]>(
      `SELECT ta.id, ta.course_id, ta.instructor_id, ta.title, ta.content AS body, 
              ta.priority, ta.created_at, COALESCE(c.title, 'All My Students') AS targetCohort
       FROM track_announcements ta
       LEFT JOIN courses c ON ta.course_id = c.id
       ORDER BY ta.id DESC`
    );

    return NextResponse.json({
      success: true,
      announcements: announcements.map((ann) => ({
        id: `ANN-${ann.id}`,
        rawId: ann.id,
        title: ann.title,
        body: ann.body,
        targetCohort: ann.targetCohort,
        priority: ann.priority || 'normal',
        sentAt: new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sentTo: ann.targetCohort === 'All My Students' ? 2840 : 142,
      })),
    });
  } catch (error: any) {
    console.error('API /api/instructor/announcements GET Error:', error);
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
    const { title, body: content, courseId, priority } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and message body are required.' }, { status: 400 });
    }

    const instructorId = Number(session.sub) || 1;
    const cId = Number(courseId) || 1;

    const result = await execute(
      `INSERT INTO track_announcements (course_id, instructor_id, title, content, priority, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [cId, instructorId, title.trim(), content.trim(), priority === 'urgent' ? 'urgent' : 'normal']
    );

    return NextResponse.json({
      success: true,
      message: 'Announcement broadcasted to student cohort.',
      announcementId: `ANN-${result.insertId}`,
    });
  } catch (error: any) {
    console.error('API /api/instructor/announcements POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
