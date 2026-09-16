import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const { weekNumber, targetId, githubUrl, commitSha, demoUrl, notes, studentName, studentEmail } = body;

    const effectiveEmail = session?.email || studentEmail || 'student@education-algorithm.com';
    const effectiveName = session?.name || studentName || 'Java Full-Stack Student';
    const effectiveStudentId = session?.sub ? parseInt(session.sub, 10) : null;

    if (!weekNumber || !githubUrl) {
      return NextResponse.json(
        { success: false, message: 'Week number and GitHub repository URL are required.' },
        { status: 400 }
      );
    }

    // Ensure GitHub URL format
    if (!githubUrl.toLowerCase().includes('github.com')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid GitHub repository URL.' },
        { status: 400 }
      );
    }

    // Default or validated commit SHA
    const cleanCommitSha = commitSha && commitSha.trim().length >= 7 ? commitSha.trim() : 'HEAD-SNAPSHOT';

    // Verify if submission already exists for this week
    const existing = await query<RowDataPacket[]>(
      `SELECT id, status FROM student_project_submissions WHERE week_number = ? AND student_email = ?`,
      [weekNumber, effectiveEmail]
    );

    if (existing.length > 0) {
      // Update existing submission to SUBMITTED
      await execute(
        `UPDATE student_project_submissions 
         SET github_url = ?, commit_sha = ?, demo_url = ?, notes = ?, status = 'SUBMITTED', submitted_at = NOW()
         WHERE id = ?`,
        [githubUrl.trim(), cleanCommitSha, demoUrl?.trim() || null, notes?.trim() || null, existing[0].id]
      );

      return NextResponse.json({
        success: true,
        message: `Week ${weekNumber} project re-submitted successfully with commit SHA ${cleanCommitSha.slice(0, 7)}!`,
        submissionId: existing[0].id,
        status: 'SUBMITTED'
      });
    } else {
      // Create new submission
      const result: any = await execute(
        `INSERT INTO student_project_submissions 
         (target_id, week_number, student_id, student_email, student_name, github_url, commit_sha, demo_url, notes, status, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', NOW())`,
        [
          targetId || weekNumber,
          weekNumber,
          effectiveStudentId,
          effectiveEmail,
          effectiveName,
          githubUrl.trim(),
          cleanCommitSha,
          demoUrl?.trim() || null,
          notes?.trim() || null
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Week ${weekNumber} project submitted successfully for mentor review!`,
        submissionId: result.insertId,
        status: 'SUBMITTED'
      });
    }
  } catch (error: any) {
    console.error('POST /api/projects/submit-target error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit weekly project. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
