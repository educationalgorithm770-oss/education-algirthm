import { RawScrapedJob } from './types';

export async function fetchArbeitnowJobs(): Promise<RawScrapedJob[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Arbeitnow API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.data || [];

    return jobs.slice(0, 25).map((job: any): RawScrapedJob => ({
      source: 'Arbeitnow',
      externalId: `arbeitnow_${job.slug || job.id}`,
      companyName: job.company_name || 'Tech Enterprise',
      roleTitle: job.title || 'Software Developer',
      location: job.location || (job.remote ? 'Remote' : 'Hybrid'),
      workMode: job.remote ? 'Remote' : 'Hybrid',
      techStack: job.tags || [],
      applyUrl: job.url || 'https://www.arbeitnow.com',
      postedDate: job.created_at ? new Date(job.created_at * 1000).toLocaleDateString() : 'Recent',
      description: job.description || '',
    }));
  } catch (error) {
    console.error('Error fetching Arbeitnow jobs:', error);
    return [];
  }
}
