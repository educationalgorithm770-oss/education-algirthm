export interface RealityQuote {
  headline: string;
  punchline: string;
  myth: string;
  reality: string;
  category: 'ai-myth' | 'tutorial-hell' | 'copy-paste' | 'market-truth';
}

export interface JobMetrics {
  fresherCount: number;
  totalCount: number;
  topSalary: string;
  topCompanies: string[];
}

export const BASE_REALITY_TEMPLATES: RealityQuote[] = [
  {
    category: 'ai-myth',
    headline: 'Hey Fresher! 👀 {fresherCount}+ Junior Dev Jobs Just Synced in our Talent Network Today...',
    punchline: `"Stop the social media drama crying 'AI is taking my job'. Companies aren't looking for ChatGPT prompt copy-pasters; they're looking for real engineers who understand Java 21, Concurrency, and System Design. Wake up, learn programming first, and grab these roles!"`,
    myth: '😭 Myth #1: "AI Killed Entry-Level Developer Hiring in 2026"',
    reality: '⚡ Reality: {fresherCount}+ junior roles are active in our Talent Network right now—companies just stopped hiring people who cannot write thread-safe code or explain SQL indexes.',
  },
  {
    category: 'tutorial-hell',
    headline: 'Watching 40 Hours of Tutorials Won\'t Crack a ₹14 LPA Offer...',
    punchline: `"If copying code from StackOverflow made someone a Senior SDE, your web browser would be a Staff Engineer. Our Talent Network has {fresherCount} entry-level positions today—get into Docker sandboxes and build real microservices!"`,
    myth: '😭 Myth #2: "You Need 3+ Years of Experience for SDE-1"',
    reality: '⚡ Reality: You need Proof-of-Work. An engineer with Docker, Kafka, and 98% test coverage beats 3 years of tutorial certificates every single time.',
  },
  {
    category: 'market-truth',
    headline: 'The Tech Hiring Market Isn\'t Dead. Generic Todo-List Clones Are.',
    punchline: `"Stop building your 50th Weather App. Recruiters across Bengaluru and Hyderabad are actively seeking developers who understand Redis Redlock, Virtual Threads, and Database Row Locks. {totalCount} total openings are waiting for real skills."`,
    myth: '😭 Myth #3: "Recruiters Only Hire From Tier-1 Colleges"',
    reality: '⚡ Reality: Recruiters hire verified GitHub PRs and tamper-proof sandboxed code. Tier-1 degrees don\'t debug distributed race conditions.',
  },
  {
    category: 'copy-paste',
    headline: 'ChatGPT Wrote Your Resume, But Won\'t Pass Your Live Interview.',
    punchline: `"Hiring managers ask tough system design questions about Kafka partition rebalances and deadlock resolution. There are {fresherCount} junior positions open right now—master core programming first!"`,
    myth: '😭 Myth #4: "Framework Syntax Is All You Need"',
    reality: '⚡ Reality: Frameworks change every 2 years. Core Concurrency, Algorithms, and Distributed Systems stay relevant for 20 years.',
  },
  {
    category: 'ai-myth',
    headline: 'AI Won\'t Replace You. An Engineer Who Understands Java 21 Will.',
    punchline: `"AI can generate boilerplate in 2 seconds, but who investigates why a database deadlock crashed the payment gateway at 10,000 TPS? That\'s why {fresherCount}+ fresher openings exist today. Get serious about engineering fundamentals."`,
    myth: '😭 Myth #5: "Coding Will Be Fully Automated Soon"',
    reality: '⚡ Reality: High-scale distributed systems, transactional rollbacks, and mission-critical payment engines require human architectural thinking and debugging.',
  },
  {
    category: 'tutorial-hell',
    headline: 'You Don\'t Lack Opportunities. You Lack Verifiable Proof-of-Work.',
    punchline: `"Sending 500 identical resumes with 'Java, HTML, CSS' yields 0 calls. Our Talent Network has {fresherCount}+ openings right now waiting for candidates who can demonstrate Docker orchestration and JaCoCo test reports."`,
    myth: '😭 Myth #6: "Mass Applying to 1,000 Jobs Is the Only Strategy"',
    reality: '⚡ Reality: 1 high-throughput microservice capstone with an architectural defense video lands more interview calls than 500 cold clicks.',
  },
  {
    category: 'market-truth',
    headline: 'Top Tech Firms Are Actively Hiring Right Now.',
    punchline: `"{recentCompany} and other industry leaders currently have open roles in our curated network offering up to {topSalary}. The only question is: can you defend your code in a 4-round hiring loop?"`,
    myth: '😭 Myth #7: "Off-Campus Drives Are Pure Luck"',
    reality: '⚡ Reality: Off-campus hiring is systematic when you clear the OA threshold (85%+) and articulate system design tradeoffs with confidence.',
  },
];

export function getFormattedQuotes(metrics: JobMetrics): RealityQuote[] {
  const fresherStr = metrics.fresherCount > 0 ? String(metrics.fresherCount) : '400';
  const totalStr = metrics.totalCount > 0 ? String(metrics.totalCount) : '780';
  const salaryStr = metrics.topSalary || '₹38 LPA';
  const companyStr = metrics.topCompanies.length > 0 ? metrics.topCompanies[0] : 'Cisco India';

  return BASE_REALITY_TEMPLATES.map((t) => ({
    ...t,
    headline: t.headline
      .replace(/{fresherCount}/g, fresherStr)
      .replace(/{totalCount}/g, totalStr)
      .replace(/{topSalary}/g, salaryStr)
      .replace(/{recentCompany}/g, companyStr),
    punchline: t.punchline
      .replace(/{fresherCount}/g, fresherStr)
      .replace(/{totalCount}/g, totalStr)
      .replace(/{topSalary}/g, salaryStr)
      .replace(/{recentCompany}/g, companyStr),
    reality: t.reality
      .replace(/{fresherCount}/g, fresherStr)
      .replace(/{totalCount}/g, totalStr)
      .replace(/{topSalary}/g, salaryStr)
      .replace(/{recentCompany}/g, companyStr),
  }));
}

export function whiteLabelSourceName(rawSource?: string): string {
  if (!rawSource) return 'Verified Talent Drive';
  const s = rawSource.toLowerCase();
  if (s.includes('linkedin')) return 'Enterprise Direct Drive';
  if (s.includes('naukri')) return 'Campus & Lateral Drive';
  if (s.includes('unstop')) return 'National Hackathon & Drive';
  if (s.includes('partner')) return 'Curated Hiring Partner';
  if (s.includes('instahyre')) return 'Curated Talent Network';
  if (s.includes('wellfound')) return 'High-Growth Tech Partner';
  return 'Verified Direct Opening';
}
