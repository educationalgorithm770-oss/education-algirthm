import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET: Instructor / Admin lists all student weekly target submissions
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json(
        { success: false, message: 'Admin or instructor authentication required.' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const weekParam = url.searchParams.get('week');
    const statusParam = url.searchParams.get('status');

    let sql = `
      SELECT 
        s.id,
        s.target_id,
        s.week_number,
        s.student_id,
        s.student_email,
        s.student_name,
        s.github_url,
        s.commit_sha,
        s.demo_url,
        s.notes,
        s.status,
        s.score,
        s.mentor_feedback,
        s.xp_awarded,
        s.submitted_at,
        s.reviewed_at,
        t.title as project_title,
        t.phase,
        t.difficulty,
        t.due_date,
        t.rubric
      FROM student_project_submissions s
      LEFT JOIN cohort_weekly_targets t ON s.week_number = t.week_number
      WHERE 1=1
    `;
    const params: any[] = [];

    if (weekParam) {
      sql += ` AND s.week_number = ?`;
      params.push(parseInt(weekParam, 10));
    }
    if (statusParam && statusParam !== 'ALL') {
      sql += ` AND s.status = ?`;
      params.push(statusParam);
    }

    sql += ` ORDER BY s.submitted_at DESC`;

    const submissions = await query<RowDataPacket[]>(sql, params);

    // Also get weekly target release states for cohort dispatcher overview
    const targets = await query<RowDataPacket[]>(
      `SELECT id, week_number, title, phase, difficulty, status, due_date, created_at FROM cohort_weekly_targets ORDER BY week_number ASC`
    );

    return NextResponse.json({
      success: true,
      submissions,
      targets
    });
  } catch (error: any) {
    console.error('GET /api/projects/review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve project review submissions.' },
      { status: 500 }
    );
  }
}

// POST: Instructor / Mentor submits evaluation & feedback
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json(
        { success: false, message: 'Admin or instructor authentication required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { submissionId, status, score, mentorFeedback, xpAwarded } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { success: false, message: 'Submission ID and review status are required.' },
        { status: 400 }
      );
    }

    const calculatedXp = status === 'APPROVED' ? (xpAwarded || 500) : 0;
    const numericScore = typeof score === 'number' ? Math.min(100, Math.max(0, score)) : null;

    await execute(
      `UPDATE student_project_submissions 
       SET status = ?, score = ?, mentor_feedback = ?, xp_awarded = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, numericScore, mentorFeedback || null, calculatedXp, submissionId]
    );

    // Fetch updated row
    const updated = await query<RowDataPacket[]>(
      `SELECT * FROM student_project_submissions WHERE id = ?`,
      [submissionId]
    );

    return NextResponse.json({
      success: true,
      message: `Submission #${submissionId} marked as ${status}. Student notified.`,
      submission: updated[0] || null
    });
  } catch (error: any) {
    console.error('POST /api/projects/review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit review. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
