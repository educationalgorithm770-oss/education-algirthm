import { RawScrapedJob } from './types';

export async function fetchHimalayasJobs(): Promise<RawScrapedJob[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://himalayas.app/jobs/api?limit=30', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs.slice(0, 25).map((job: any): RawScrapedJob => ({
      source: 'Himalayas',
      externalId: `himalayas_${job.id || job.slug}`,
      companyName: job.companyName || 'Global Tech',
      companyLogo: job.companyLogo || undefined,
      roleTitle: job.title || 'Software Engineer',
      location: job.location || 'Remote',
      workMode: 'Remote',
      salaryRange: job.salary ? `$${job.salary} / yr` : (job.minSalary ? `$${job.minSalary} - $${job.maxSalary}` : undefined),
      techStack: job.skills || job.tags || [],
      applyUrl: job.applicationUrl || job.himalayasUrl || 'https://himalayas.app',
      postedDate: job.pubDate ? new Date(job.pubDate).toLocaleDateString() : 'Recent',
      description: job.description || job.excerpt || '',
    }));
  } catch (err) {
    console.error('Error fetching Himalayas jobs:', err);
    return [];
  }
}
