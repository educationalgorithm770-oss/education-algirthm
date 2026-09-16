import { RawScrapedJob } from './types';

export async function fetchJobicyJobs(): Promise<RawScrapedJob[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25&industry=dev', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Jobicy API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs.slice(0, 25).map((job: any): RawScrapedJob => ({
      source: 'Jobicy',
      externalId: `jobicy_${job.id}`,
      companyName: job.companyName || 'Global Startup',
      companyLogo: job.companyLogo || undefined,
      roleTitle: job.jobTitle || 'Full Stack Engineer',
      location: job.jobGeo || 'Remote',
      workMode: 'Remote',
      salaryRange: job.annualSalaryMin ? `$${job.annualSalaryMin} - $${job.annualSalaryMax || job.annualSalaryMin * 1.4} / yr` : undefined,
      experienceLevel: job.jobLevel ? `${job.jobLevel}` : undefined,
      techStack: job.jobKeywords || [],
      applyUrl: job.url || 'https://jobicy.com',
      postedDate: job.pubDate ? new Date(job.pubDate).toLocaleDateString() : 'Recent',
      description: job.jobDescription || '',
    }));
  } catch (error) {
    console.error('Error fetching Jobicy jobs:', error);
    return [];
  }
}
