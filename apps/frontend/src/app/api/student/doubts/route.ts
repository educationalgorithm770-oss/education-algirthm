import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const studentId = Number(session.sub) || 1;

    const doubts = await query<RowDataPacket[]>(
      `SELECT sd.id, sd.subject AS topic, sd.doubt_details AS questionText, 
              sd.code_snippet, sd.status, sd.faculty_reply AS answerText,
              sd.created_at, sd.updated_at, COALESCE(c.title, 'Masterclass') AS course_title
       FROM student_doubts sd
       LEFT JOIN courses c ON sd.course_id = c.id
       WHERE sd.student_id = ?
       ORDER BY sd.id DESC`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      doubts: doubts.map((d) => ({
        id: `D-${d.id}`,
        topic: d.topic || 'General Doubt',
        questionText: d.questionText,
        codeSnippet: d.code_snippet || '',
        course: d.course_title,
        submittedAt: d.created_at,
        status: d.status === 'resolved' ? 'resolved' : 'pending',
        answerText: d.answerText,
        answeredAt: d.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/student/doubts GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const studentId = Number(session.sub) || 1;
    const body = await request.json();
    const { topic, questionText, codeSnippet, courseId } = body;

    if (!topic || !questionText) {
      return NextResponse.json({ success: false, error: 'Topic and question details are required.' }, { status: 400 });
    }

    const cId = Number(courseId) || 1;

    const result = await execute(
      `INSERT INTO student_doubts (student_id, course_id, subject, doubt_details, code_snippet, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', NOW(), NOW())`,
      [studentId, cId, topic.trim(), questionText.trim(), codeSnippet?.trim() || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Doubt submitted successfully to faculty desk.',
      doubtId: `D-${result.insertId}`,
    });
  } catch (error: any) {
    console.error('API /api/student/doubts POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
