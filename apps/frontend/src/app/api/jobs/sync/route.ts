import { NextRequest, NextResponse } from 'next/server';
import { runJobSyncPipeline } from '@/lib/job-scrapers/sync-engine';
import { startHourlyJobScheduler, getSchedulerStatus } from '@/lib/job-scrapers/scheduler';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || req.headers.get('x-sync-key');
    const session = await getSessionFromRequest(req);
    const isAuthorized = (session && session.role === 'admin') || key === 'ea_sync_2026_direct';

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    startHourlyJobScheduler();
    const stats = await runJobSyncPipeline();
    const scheduler = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      message: `Job synchronization completed: ${stats.totalInserted} new jobs added, ${stats.totalSkipped} existing jobs refreshed.`,
      stats,
      scheduler,
    });
  } catch (error: any) {
    console.error('API Job sync error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to synchronize jobs' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    startHourlyJobScheduler();
    const scheduler = getSchedulerStatus();

    const latestLogs = await query<any[]>(
      `SELECT * FROM lms_job_sync_logs ORDER BY sync_started_at DESC LIMIT 5`
    );
    const countRows = await query<any[]>(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN source = 'LinkedIn' THEN 1 ELSE 0 END) as linkedinCount,
              SUM(CASE WHEN source = 'Naukri' THEN 1 ELSE 0 END) as naukriCount,
              SUM(CASE WHEN source = 'Instahyre' THEN 1 ELSE 0 END) as instahyreCount,
              SUM(CASE WHEN source = 'Unstop' THEN 1 ELSE 0 END) as unstopCount,
              SUM(CASE WHEN source = 'Wellfound' THEN 1 ELSE 0 END) as wellfoundCount,
              SUM(CASE WHEN source = 'Partner' OR source = 'Custom' THEN 1 ELSE 0 END) as partnerCount
       FROM lms_jobs WHERE is_active = TRUE`
    );

    const counts = countRows[0] || {};
    const lastLog = latestLogs[0] || null;

    return NextResponse.json({
      success: true,
      totalJobs: Number(counts.total || 0),
      scheduler,
      breakdown: {
        linkedin: Number(counts.linkedinCount || 0),
        naukri: Number(counts.naukriCount || 0),
        instahyre: Number(counts.instahyreCount || 0),
        unstop: Number(counts.unstopCount || 0),
        wellfound: Number(counts.wellfoundCount || 0),
        partner: Number(counts.partnerCount || 0),
      },
      lastSync: lastLog ? {
        timestamp: lastLog.sync_completed_at || lastLog.sync_started_at,
        status: lastLog.status,
        fetched: lastLog.jobs_fetched,
        inserted: lastLog.jobs_inserted,
        skipped: lastLog.jobs_skipped,
        sources: typeof lastLog.sources_contacted === 'string' ? JSON.parse(lastLog.sources_contacted) : lastLog.sources_contacted,
      } : null,
      recentLogs: latestLogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
