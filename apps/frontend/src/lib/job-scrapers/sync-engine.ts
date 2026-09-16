import { query, execute } from '@/lib/db';
import { RawScrapedJob, NormalizedJob, SyncStats } from './types';
import { normalizeJob } from './normalizer';
import { fetchLinkedInJobs } from './linkedin';
import { fetchArbeitnowJobs } from './arbeitnow';
import { fetchJobicyJobs } from './jobicy';
import { fetchHimalayasJobs } from './himalayas';
import { fetchRemotiveJobs } from './remotive';
import { fetchNaukriJobs } from './naukri';
import { fetchInstahyreJobs } from './instahyre';
import { fetchUnstopJobs } from './unstop';
import { fetchWellfoundJobs } from './wellfound';
import { JOBS_DATA } from '@/config/jobs-data';

export async function runJobSyncPipeline(specificSource?: string): Promise<SyncStats> {
  const startedAt = new Date().toISOString();
  console.log(`🇮🇳 Starting Indian Tech Job Ingestion Pipeline${specificSource ? ` (Target: ${specificSource})` : ''}...`);

  const sourcesContacted: string[] = [];
  const rawJobs: RawScrapedJob[] = [];

  const scraperTasks: Array<{ name: string; run: () => Promise<RawScrapedJob[]> }> = [
    { name: 'LinkedIn', run: fetchLinkedInJobs },
    { name: 'Arbeitnow', run: fetchArbeitnowJobs },
    { name: 'Jobicy', run: fetchJobicyJobs },
    { name: 'Himalayas', run: fetchHimalayasJobs },
    { name: 'Remotive', run: fetchRemotiveJobs },
    { name: 'Naukri', run: fetchNaukriJobs },
    { name: 'Instahyre', run: fetchInstahyreJobs },
    { name: 'Unstop', run: fetchUnstopJobs },
    { name: 'Wellfound', run: fetchWellfoundJobs },
  ];

  const tasksToRun = specificSource
    ? scraperTasks.filter((t) => t.name.toLowerCase() === specificSource.toLowerCase())
    : scraperTasks;

  const results = await Promise.allSettled(
    tasksToRun.map(async (task) => {
      sourcesContacted.push(task.name);
      return await task.run();
    })
  );

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      rawJobs.push(...res.value);
    }
  }

  // Include baseline curated Indian hiring partners if table is low
  if (!specificSource || specificSource === 'Custom') {
    for (const staticJob of JOBS_DATA) {
      rawJobs.push({
        source: 'Partner',
        externalId: staticJob.id,
        companyName: staticJob.companyName,
        companyLogo: staticJob.companyLogo,
        roleTitle: staticJob.roleTitle,
        location: staticJob.location,
        workMode: staticJob.workMode,
        salaryRange: staticJob.salaryRange,
        experienceLevel: staticJob.experienceLevel,
        techStack: staticJob.techStack,
        applyUrl: staticJob.applyUrl,
        postedDate: staticJob.postedDate,
        description: staticJob.description,
        requirements: staticJob.requirements,
        referralAvailable: true,
      });
    }
  }

  console.log(`📦 Total raw Indian tech jobs fetched: ${rawJobs.length}`);

  let existingExternalIds = new Set<string>();
  try {
    const existingRows = await query<any[]>('SELECT external_id FROM lms_jobs');
    existingExternalIds = new Set(existingRows.map((r) => r.external_id).filter(Boolean));
  } catch (dbErr) {
    console.warn('Could not read existing jobs for deduplication:', dbErr);
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const raw of rawJobs) {
    try {
      const normalized: NormalizedJob = normalizeJob(raw);

      if (existingExternalIds.has(normalized.externalId)) {
        totalSkipped++;
        await execute(
          `UPDATE lms_jobs SET updated_at = NOW(), is_active = TRUE, salary_range = ? WHERE external_id = ?`,
          [normalized.salaryRange, normalized.externalId]
        );
        continue;
      }

      await execute(
        `INSERT INTO lms_jobs (
          id, external_id, company_name, company_logo, role_title, domain,
          location, work_mode, salary_range, experience_level, tech_stack,
          referral_available, apply_url, posted_date, description, requirements,
          source, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE updated_at = NOW(), is_active = TRUE`,
        [
          normalized.id,
          normalized.externalId,
          normalized.companyName,
          normalized.companyLogo,
          normalized.roleTitle,
          normalized.domain,
          normalized.location,
          normalized.workMode,
          normalized.salaryRange,
          normalized.experienceLevel,
          JSON.stringify(normalized.techStack),
          normalized.referralAvailable ? 1 : 0,
          normalized.applyUrl,
          normalized.postedDate,
          normalized.description,
          JSON.stringify(normalized.requirements),
          normalized.source,
          1,
        ]
      );

      existingExternalIds.add(normalized.externalId);
      totalInserted++;
    } catch (insertErr) {
      console.warn('Failed to insert Indian job record:', insertErr);
    }
  }

  // Stale Job Pruning: Deactivate jobs older than 30 days
  try {
    await execute(
      `UPDATE lms_jobs SET is_active = FALSE WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
  } catch {
    // Optional maintenance
  }

  const completedAt = new Date().toISOString();
  const status: SyncStats['status'] = totalInserted > 0 || totalSkipped > 0 ? 'SUCCESS' : 'FAILED';

  // Log telemetry in lms_job_sync_logs
  try {
    await execute(
      `INSERT INTO lms_job_sync_logs (
        sync_started_at, sync_completed_at, jobs_fetched, jobs_inserted,
        jobs_skipped, sources_contacted, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        new Date(startedAt),
        new Date(completedAt),
        rawJobs.length,
        totalInserted,
        totalSkipped,
        JSON.stringify(sourcesContacted),
        status,
      ]
    );
  } catch (logErr) {
    console.warn('Failed to record sync log:', logErr);
  }

  const stats: SyncStats = {
    startedAt,
    completedAt,
    totalFetched: rawJobs.length,
    totalInserted,
    totalSkipped,
    sourcesContacted,
    status,
  };

  console.log('✅ Indian Ingestion Pipeline Finished:', stats);
  return stats;
}
