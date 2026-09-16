import { RawScrapedJob } from './types';

export async function fetchRemotiveJobs(): Promise<RawScrapedJob[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=30', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Remotive API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs.slice(0, 25).map((job: any): RawScrapedJob => ({
      source: 'Remotive',
      externalId: `remotive_${job.id}`,
      companyName: job.company_name || 'Global Tech',
      companyLogo: job.company_logo || undefined,
      roleTitle: job.title || 'Software Engineer',
      location: job.candidate_required_location || 'Remote',
      workMode: 'Remote',
      salaryRange: job.salary || undefined,
      techStack: job.tags || [],
      applyUrl: job.url || 'https://remotive.com',
      postedDate: job.publication_date ? new Date(job.publication_date).toLocaleDateString() : 'Recent',
      description: job.description || '',
    }));
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error);
    return [];
  }
}
