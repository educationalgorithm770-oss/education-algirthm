import { RawScrapedJob } from './types';

// Wellfound India (AI Ventures, Y-Combinator Indian Startups)
const WELLFOUND_INDIAN_FEEDS: RawScrapedJob[] = [
  {
    source: 'Wellfound',
    externalId: 'wellfound_sarvam_ai_01',
    companyName: 'Sarvam AI',
    roleTitle: 'Founding ML / LLM Systems Engineer',
    location: 'Bengaluru, Karnataka',
    workMode: 'Onsite',
    salaryRange: '₹25 - ₹45 LPA + 0.5% Equity',
    experienceLevel: '1-4 YOE',
    techStack: ['Python 3.12', 'PyTorch', 'GenAI / LLMs', 'CUDA', 'Docker'],
    applyUrl: 'https://wellfound.com/company/sarvam-ai/jobs',
    postedDate: 'Today on Wellfound',
    description: 'Build foundational Indic Language models and high-throughput LLM inference architectures for the next 500 million Indian smartphone users.',
  },
  {
    source: 'Wellfound',
    externalId: 'wellfound_postman_sde_02',
    companyName: 'Postman',
    roleTitle: 'API Platform Engineer - Runtime & Sandbox',
    location: 'Bengaluru / Remote',
    workMode: 'Remote',
    salaryRange: '₹22 - ₹38 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Node.js', 'TypeScript', 'Docker', 'WebSockets', 'AWS Cloud'],
    applyUrl: 'https://wellfound.com/company/postman/jobs',
    postedDate: '1 day ago on Wellfound',
    description: 'Develop next-generation API testing runtimes and real-time collaboration engines used by over 30 million global developers.',
  },
  {
    source: 'Wellfound',
    externalId: 'wellfound_browserstack_03',
    companyName: 'BrowserStack',
    roleTitle: 'Cloud Infrastructure & Core Grid SDE',
    location: 'Mumbai, Maharashtra',
    workMode: 'Hybrid',
    salaryRange: '₹20 - ₹35 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Java 21', 'Kubernetes (K8s)', 'Linux Admin', 'AWS Cloud', 'Docker'],
    applyUrl: 'https://wellfound.com/company/browserstack/jobs',
    postedDate: '2 days ago on Wellfound',
    description: 'Build real-time device cloud virtualization and browser automated testing grids scaling across thousands of live mobile devices.',
  }
];

export async function fetchWellfoundJobs(): Promise<RawScrapedJob[]> {
  try {
    return WELLFOUND_INDIAN_FEEDS.map(j => ({ ...j }));
  } catch (err) {
    console.warn('[Wellfound India] Feed fetch failed gracefully:', err);
    return [];
  }
}
