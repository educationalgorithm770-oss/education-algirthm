import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required to update job postings.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const {
      companyName,
      companyLogo,
      roleTitle,
      domain,
      location,
      workMode,
      salaryRange,
      experienceLevel,
      techStack,
      referralAvailable,
      applyUrl,
      postedDate,
      description,
      requirements,
      mentorName,
      mentorRole,
    } = body;

    await execute(
      `UPDATE lms_jobs SET
        company_name = COALESCE(?, company_name),
        company_logo = COALESCE(?, company_logo),
        role_title = COALESCE(?, role_title),
        domain = COALESCE(?, domain),
        location = COALESCE(?, location),
        work_mode = COALESCE(?, work_mode),
        salary_range = COALESCE(?, salary_range),
        experience_level = COALESCE(?, experience_level),
        tech_stack = COALESCE(?, tech_stack),
        referral_available = COALESCE(?, referral_available),
        apply_url = COALESCE(?, apply_url),
        posted_date = COALESCE(?, posted_date),
        description = COALESCE(?, description),
        requirements = COALESCE(?, requirements),
        mentor_name = ?,
        mentor_role = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        companyName,
        companyLogo,
        roleTitle,
        domain,
        location,
        workMode,
        salaryRange,
        experienceLevel,
        techStack ? JSON.stringify(techStack) : null,
        referralAvailable !== undefined ? (referralAvailable ? 1 : 0) : null,
        applyUrl,
        postedDate,
        description,
        requirements ? JSON.stringify(requirements) : null,
        mentorName || null,
        mentorRole || null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully.',
    });
  } catch (error: any) {
    console.error('API PUT /api/jobs/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required to delete job postings.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await execute(`DELETE FROM lms_jobs WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully.',
    });
  } catch (error: any) {
    console.error('API DELETE /api/jobs/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
