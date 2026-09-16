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

    const submissions = await query<RowDataPacket[]>(
      `SELECT sub.id, sub.assignment_id, sub.student_id, sub.submission_text, sub.file_path,
              sub.status, sub.marks, sub.feedback, sub.submitted_at, sub.reviewed_at,
              a.title AS assignment_title, s.name AS student_name, s.email AS student_email
       FROM assignment_submissions sub
       LEFT JOIN assignments a ON sub.assignment_id = a.id
       LEFT JOIN students s ON sub.student_id = s.id
       ORDER BY sub.id DESC
       LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      submissions: submissions.map((sub) => ({
        id: `SUB-${String(sub.id).padStart(4, '0')}`,
        rawId: sub.id,
        assignmentTitle: sub.assignment_title || `Assignment #${sub.assignment_id}`,
        studentName: sub.student_name || sub.student_email || `Student #${sub.student_id}`,
        studentEmail: sub.student_email || 'student@edualg.com',
        submissionText: sub.submission_text || 'Source code submitted via terminal/git.',
        filePath: sub.file_path || '',
        status: sub.status || 'submitted',
        marks: sub.marks !== null ? Number(sub.marks) : null,
        feedback: sub.feedback || '',
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/assignments GET Error:', error);
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
    const { rawId, marks, feedback } = body;

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required.' }, { status: 400 });
    }

    const score = Number(marks) || 0;

    await execute(
      `UPDATE assignment_submissions 
       SET marks = ?, feedback = ?, status = 'graded', reviewed_at = NOW() 
       WHERE id = ?`,
      [score, feedback || 'Good work.', Number(rawId)]
    );

    return NextResponse.json({
      success: true,
      message: 'Grade and feedback saved successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/assignments POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
