import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    let rows: any[] = [];
    if (session.role === 'admin' || session.role === 'instructor') {
      rows = await query<any[]>(
        `SELECT * FROM lms_job_referrals ORDER BY created_at DESC LIMIT 200`
      );
    } else {
      const email = session.email.toLowerCase().trim();
      rows = await query<any[]>(
        `SELECT * FROM lms_job_referrals WHERE LOWER(student_email) = ? ORDER BY created_at DESC LIMIT 50`,
        [email]
      );
    }

    const referrals = rows.map(r => ({
      id: r.id,
      jobId: r.job_id,
      jobTitle: r.job_title,
      company: r.company,
      studentName: r.student_name,
      studentEmail: r.student_email,
      enrolledTrack: r.enrolled_track,
      resumeUrl: r.resume_url,
      githubLinkedInUrl: r.github_linkedin_url,
      pitch: r.pitch,
      status: r.status,
      adminNotes: r.admin_notes,
      submittedAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      referrals,
    });
  } catch (error: any) {
    console.error('API GET /api/jobs/referrals error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required to submit job referrals.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      jobId,
      jobTitle,
      company,
      enrolledTrack,
      resumeUrl,
      githubLinkedInUrl,
      pitch,
    } = body;

    const studentName = session.name || body.studentName || 'Enrolled Student';
    const studentEmail = session.email.toLowerCase().trim();

    if (!jobId || !pitch) {
      return NextResponse.json(
        { success: false, error: 'Job details and pitch are required.' },
        { status: 400 }
      );
    }

    const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await execute(
      `INSERT INTO lms_job_referrals (
        id, job_id, job_title, company, student_name, student_email,
        enrolled_track, resume_url, github_linkedin_url, pitch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        jobId,
        jobTitle || 'Tech Role',
        company || 'Tech Company',
        studentName,
        studentEmail,
        enrolledTrack || 'Full Stack Track',
        resumeUrl || null,
        githubLinkedInUrl || null,
        pitch,
        'Pending Review',
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Referral application submitted successfully! Our placement mentors will review your application within 24 hours.',
      referralId: id,
    });
  } catch (error: any) {
    console.error('API POST /api/jobs/referrals error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit referral application' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Referral ID and new status are required.' },
        { status: 400 }
      );
    }

    await execute(
      `UPDATE lms_job_referrals SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = NOW() WHERE id = ?`,
      [status, adminNotes, id]
    );

    return NextResponse.json({
      success: true,
      message: `Referral status updated to "${status}".`,
    });
  } catch (error: any) {
    console.error('API PATCH /api/jobs/referrals error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update referral status' },
      { status: 500 }
    );
  }
}
