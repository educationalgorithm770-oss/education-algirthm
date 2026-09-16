import { RawScrapedJob } from './types';

interface SearchTarget {
  keywords: string;
  location: string;
  expFilter?: string; // f_E=1 (Internship), f_E=2 (Entry level), f_E=3 (Associate/Mid)
  pages?: number;
}

const SEARCH_QUERIES: SearchTarget[] = [
  // Tier 1: Freshers, Graduates & Interns (f_E=1,2)
  { keywords: 'Associate Software Engineer', location: 'India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Graduate Engineer Trainee', location: 'India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Software Engineer Fresher', location: 'Bengaluru, Karnataka, India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Java Developer Fresher', location: 'Hyderabad, Telangana, India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Python AI Intern', location: 'Pune, Maharashtra, India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Cloud Trainee OR DevOps Intern', location: 'Chennai, Tamil Nadu, India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'Junior Full Stack Developer', location: 'Gurugram, Haryana, India', expFilter: 'f_E=1,2', pages: 2 },
  { keywords: 'React Frontend Developer Fresher', location: 'India', expFilter: 'f_E=1,2', pages: 2 },

  // Tier 2: Mid-Level & Lateral SDE Roles (f_E=2,3)
  { keywords: 'Java Spring Boot Developer', location: 'Bengaluru, Karnataka, India', expFilter: 'f_E=3', pages: 2 },
  { keywords: 'Cloud AWS DevOps Engineer', location: 'Pune, Maharashtra, India', expFilter: 'f_E=3', pages: 2 },
  { keywords: 'Python Generative AI Engineer', location: 'Hyderabad, Telangana, India', expFilter: 'f_E=3', pages: 2 },
  { keywords: 'Full Stack React Node Engineer', location: 'India', expFilter: 'f_E=3', pages: 2 },
  { keywords: 'Data Engineer Snowflake Spark', location: 'Bengaluru, Karnataka, India', expFilter: 'f_E=3', pages: 2 },
  { keywords: 'QA Automation Engineer Selenium Playwright', location: 'India', expFilter: 'f_E=2,3', pages: 2 },
];

export async function fetchLinkedInJobs(): Promise<RawScrapedJob[]> {
  const allJobs: RawScrapedJob[] = [];
  const seenUrls = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    const numPages = query.pages || 1;

    for (let page = 0; page < numPages; page++) {
      const startParam = page * 25;
      try {
        const filterStr = query.expFilter ? `&${query.expFilter}` : '';
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
          query.keywords
        )}&location=${encodeURIComponent(query.location)}&f_TPR=r604800${filterStr}&start=${startParam}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-IN,en;q=0.9',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const html = await res.text();
        const cardRegex = /<div class="base-card[^>]*>([\s\S]*?)<\/div>\s*<\/li>/g;
        let match;

        while ((match = cardRegex.exec(html)) !== null) {
          const cardHtml = match[1];
          const titleMatch = /<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/i.exec(cardHtml);
          const companyMatch = /<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/i.exec(cardHtml);
          const locationMatch = /<span class="job-search-card__location">([\s\S]*?)<\/span>/i.exec(cardHtml);
          const linkMatch = /<a class="base-card__full-link[^"]*" href="([^"]*)"/i.exec(cardHtml);
          const logoMatch = /<img[^>]*data-delayed-url="([^"]*)"|<img[^>]*src="([^"]*)"/i.exec(cardHtml);
          const dateMatch = /<time class="job-search-card__listdate[^"]*" datetime="([^"]*)">([\s\S]*?)<\/time>/i.exec(cardHtml);

          const rawLink = linkMatch ? linkMatch[1] : '';
          const cleanLink = rawLink.split('?')[0].replace(/&amp;/g, '&');
          if (!cleanLink || seenUrls.has(cleanLink)) continue;
          seenUrls.add(cleanLink);

          const roleTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          const companyName = companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          const location = locationMatch ? locationMatch[1].replace(/<[^>]+>/g, '').trim() : query.location;
          const logo = logoMatch ? (logoMatch[1] || logoMatch[2])?.replace(/&amp;/g, '&') : undefined;
          const postedDate = dateMatch ? dateMatch[2].replace(/<[^>]+>/g, '').trim() : 'Active on LinkedIn';

          if (roleTitle && companyName) {
            const isFresherQuery = query.expFilter?.includes('f_E=1') || query.expFilter?.includes('f_E=2');
            allJobs.push({
              source: 'LinkedIn',
              externalId: `li_${cleanLink.split('-').pop() || cleanLink.replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`,
              companyName,
              companyLogo: logo,
              roleTitle,
              location,
              workMode: /remote/i.test(location) ? 'Remote' : /hybrid/i.test(location) ? 'Hybrid' : 'Onsite',
              experienceLevel: isFresherQuery ? 'Fresher / 0-1 YOE' : '1-3 YOE',
              applyUrl: cleanLink,
              postedDate: postedDate.includes('ago') ? postedDate : `${postedDate} on LinkedIn`,
              description: `Exciting software engineering role for ${roleTitle} at ${companyName}. Hiring in India via LinkedIn. Requires expertise in modern system architecture, clean coding practices, and core engineering foundations.`,
            });
          }
        }
      } catch (err) {
        console.warn(`[LinkedIn India] Query for "${query.keywords}" page ${page} skipped:`, err);
      }
    }
  }

  return allJobs;
}
