import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { runJobSyncPipeline } from '@/lib/job-scrapers/sync-engine';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const workMode = searchParams.get('workMode');
    const exp = searchParams.get('exp');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const limit = Number(searchParams.get('limit') || 1000);

    let sql = `SELECT * FROM lms_jobs WHERE is_active = TRUE`;
    const params: any[] = [];

    if (domain && domain !== 'ALL') {
      sql += ` AND (domain = ? OR domain LIKE ?)`;
      params.push(domain, `%${domain}%`);
    }
    if (workMode && workMode !== 'ALL') {
      sql += ` AND (work_mode = ? OR work_mode LIKE ?)`;
      params.push(workMode, `%${workMode}%`);
    }
    if (exp && exp !== 'ALL') {
      if (exp.toLowerCase().includes('fresher') || exp === '0-1') {
        sql += ` AND (experience_level LIKE '%Fresher%' OR experience_level LIKE '%0-1%' OR experience_level LIKE '%0-2%')`;
      } else {
        sql += ` AND (experience_level = ? OR experience_level LIKE ?)`;
        params.push(exp, `%${exp}%`);
      }
    }
    if (source && source !== 'ALL') {
      sql += ` AND source = ?`;
      params.push(source);
    }
    if (search && search.trim()) {
      sql += ` AND (role_title LIKE ? OR company_name LIKE ? OR description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    let rows = await query<any[]>(sql, params);

    // If database is currently completely empty, trigger initial sync automatically
    if (rows.length === 0 && !search && (!domain || domain === 'ALL')) {
      console.log('lms_jobs table is empty, running initial sync...');
      await runJobSyncPipeline();
      rows = await query<any[]>(sql, params);
    }

function sanitizeWhiteLabelSource(rawSource?: string): string {
  if (!rawSource) return 'Enterprise Partner';
  const s = rawSource.toLowerCase();
  if (s.includes('linkedin') || s.includes('naukri') || s.includes('arbeitnow') || s.includes('jobicy') || s.includes('himalayas') || s.includes('remotive') || s.includes('unstop') || s.includes('wellfound') || s.includes('instahyre')) {
    return 'Enterprise Partner';
  }
  return rawSource;
}

function sanitizeWhiteLabelDescription(rawDesc?: string): string {
  if (!rawDesc) return '';
  return rawDesc
    .replace(/\b(?:Hiring in [^.]*?\s+)?via\s+(?:LinkedIn|Naukri|Indeed|Instahyre|Wellfound|Arbeitnow|Jobicy|Himalayas|Remotive|Unstop)\.?/gi, 'via Verified Partner Network.')
    .replace(/\b(?:Apply on|Source:|Posted on)\s+(?:LinkedIn|Naukri|Indeed|Instahyre|Wellfound|Arbeitnow|Jobicy|Himalayas|Remotive|Unstop)\b/gi, 'Direct Opportunity')
    .replace(/\b(?:LinkedIn|Naukri|Indeed)\b/gi, 'Partner Network')
    .trim();
}

    const jobs = rows.map(r => ({
      id: r.id,
      externalId: r.external_id,
      companyName: r.company_name,
      companyLogo: r.company_logo,
      roleTitle: r.role_title,
      domain: r.domain,
      location: r.location,
      workMode: r.work_mode,
      salaryRange: r.salary_range,
      experienceLevel: r.experience_level,
      techStack: typeof r.tech_stack === 'string' ? JSON.parse(r.tech_stack) : (r.tech_stack || []),
      referralAvailable: Boolean(r.referral_available),
      applyUrl: r.apply_url,
      postedDate: r.posted_date,
      description: sanitizeWhiteLabelDescription(r.description),
      requirements: typeof r.requirements === 'string' ? JSON.parse(r.requirements) : (r.requirements || []),
      mentorName: r.mentor_name,
      mentorRole: r.mentor_role,
      source: sanitizeWhiteLabelSource(r.source),
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: any) {
    console.error('API GET /api/jobs error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required to create job postings.' },
        { status: 403 }
      );
    }

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

    if (!companyName || !roleTitle || !applyUrl) {
      return NextResponse.json(
        { success: false, error: 'Company name, role title, and apply URL are required.' },
        { status: 400 }
      );
    }

    const id = `job_custom_${Date.now()}`;
    const externalId = `custom_${id}`;

    await execute(
      `INSERT INTO lms_jobs (
        id, external_id, company_name, company_logo, role_title, domain,
        location, work_mode, salary_range, experience_level, tech_stack,
        referral_available, apply_url, posted_date, description, requirements,
        mentor_name, mentor_role, source, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        externalId,
        companyName,
        companyLogo || 'https://cdn.simpleicons.org/apache/D22128',
        roleTitle,
        domain || 'Full Stack & Core',
        location || 'Remote',
        workMode || 'Remote',
        salaryRange || 'Competitive',
        experienceLevel || '1-3 YOE',
        JSON.stringify(Array.isArray(techStack) ? techStack : []),
        referralAvailable !== false ? 1 : 0,
        applyUrl,
        postedDate || 'Just posted',
        description || '',
        JSON.stringify(Array.isArray(requirements) ? requirements : []),
        mentorName || null,
        mentorRole || null,
        'Custom',
        1
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Job posting created successfully.',
      jobId: id,
    });
  } catch (error: any) {
    console.error('API POST /api/jobs error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create job posting' },
      { status: 500 }
    );
  }
}
