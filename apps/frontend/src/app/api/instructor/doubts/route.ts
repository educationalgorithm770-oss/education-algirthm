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

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let filterClause = '';
    if (filter === 'pending') {
      filterClause = "WHERE sd.status = 'open' OR sd.status = 'in_review'";
    } else if (filter === 'resolved') {
      filterClause = "WHERE sd.status = 'resolved'";
    }

    const doubts = await query<RowDataPacket[]>(
      `SELECT sd.id, sd.student_id, sd.instructor_id, sd.subject AS topic, 
              sd.doubt_details AS questionText, sd.code_snippet, sd.status, 
              sd.faculty_reply AS answerText, sd.created_at, sd.updated_at,
              COALESCE(s.name, 'Student') AS student_name,
              COALESCE(s.email, '') AS student_email,
              COALESCE(c.title, 'General Track') AS course_title
       FROM student_doubts sd
       LEFT JOIN students s ON sd.student_id = s.id
       LEFT JOIN courses c ON sd.course_id = c.id
       ${filterClause}
       ORDER BY sd.id DESC`
    );

    return NextResponse.json({
      success: true,
      doubts: doubts.map((d) => ({
        id: `D-${d.id}`,
        rawId: d.id,
        studentName: d.student_name,
        avatar: d.student_name.slice(0, 2).toUpperCase(),
        course: d.course_title,
        topic: d.topic || 'General Doubt',
        questionText: d.questionText,
        codeSnippet: d.code_snippet,
        status: d.status === 'resolved' ? 'resolved' : 'pending',
        submittedAt: d.created_at,
        answerText: d.answerText,
        answeredAt: d.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/instructor/doubts GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized faculty session.' }, { status: 401 });
    }

    const body = await request.json();
    const { doubtId, answer } = body;

    const rawId = typeof doubtId === 'string' ? parseInt(doubtId.replace(/^D-/, ''), 10) : Number(doubtId);
    if (!rawId || !answer || typeof answer !== 'string' || answer.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Doubt ID and answer text are required.' }, { status: 400 });
    }

    const instructorId = Number(session.sub) || 1;

    await execute(
      `UPDATE student_doubts 
       SET faculty_reply = ?, status = 'resolved', instructor_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [answer.trim(), instructorId, rawId]
    );

    return NextResponse.json({
      success: true,
      message: 'Solution dispatched and doubt marked as resolved.',
    });
  } catch (error: any) {
    console.error('API /api/instructor/doubts PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
