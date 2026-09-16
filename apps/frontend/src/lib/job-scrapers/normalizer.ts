import crypto from 'crypto';
import { RawScrapedJob, NormalizedJob } from './types';

export function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractRequirements(description: string): string[] {
  const cleaned = cleanHtml(description);
  const sentences = cleaned
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 220);

  const keywords = ['experience', 'proficient', 'knowledge', 'understanding', 'hands-on', 'skills', 'degree', 'familiar', 'solid', 'ability', 'responsible'];
  const matched = sentences.filter((s) => keywords.some((k) => s.toLowerCase().includes(k)));

  if (matched.length >= 2) {
    return matched.slice(0, 4);
  }

  return sentences.slice(0, 3).length > 0
    ? sentences.slice(0, 3)
    : [
        'Hands-on experience in Java 21 / modern full stack engineering principles and clean architecture.',
        'Strong problem-solving skills, Data Structures & Algorithms, and microservices design patterns.',
        'Familiarity with cloud platforms (AWS/GCP), Docker containers, and CI/CD pipelines.',
      ];
}

const TECH_KEYWORD_MAP: Record<string, string> = {
  java: 'Java 21',
  'spring boot': 'Spring Boot 3',
  spring: 'Spring Boot',
  aws: 'AWS Cloud',
  dynamodb: 'DynamoDB',
  kafka: 'Apache Kafka',
  microservices: 'Microservices',
  python: 'Python 3.12',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  langchain: 'LangChain',
  rag: 'RAG Architecture',
  llm: 'GenAI / LLMs',
  gemini: 'Google Gemini AI',
  'vector db': 'Vector DB',
  docker: 'Docker',
  kubernetes: 'Kubernetes (K8s)',
  k8s: 'Kubernetes (K8s)',
  terraform: 'Terraform',
  'ci/cd': 'CI/CD Pipelines',
  linux: 'Linux Admin',
  react: 'React 19',
  'next.js': 'Next.js 15',
  nextjs: 'Next.js 15',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  sql: 'PostgreSQL / MySQL',
  mysql: 'MySQL',
  postgres: 'PostgreSQL',
  redis: 'Redis Cache',
  golang: 'Go / Golang',
};

export function extractTechStack(text: string, title: string): string[] {
  const combined = `${title} ${text}`.toLowerCase();
  const detected = new Set<string>();

  for (const [key, tag] of Object.entries(TECH_KEYWORD_MAP)) {
    const regex = new RegExp(`\\b${key.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(combined)) {
      detected.add(tag);
    }
  }

  if (detected.size === 0) {
    if (/java/i.test(combined)) detected.add('Java 21');
    if (/python/i.test(combined)) detected.add('Python');
    if (/cloud/i.test(combined)) detected.add('AWS Cloud');
    if (/web|frontend|backend/i.test(combined)) detected.add('Full Stack');
  }

  return Array.from(detected).slice(0, 5);
}

export function classifyDomain(title: string, description: string): NormalizedJob['domain'] {
  const content = `${title} ${description}`.toLowerCase();

  const javaScore = (content.match(/\b(java|spring|spring boot|hibernate|j2ee|kafka|microservice)\b/g) || []).length * 2 + (/java/i.test(title) ? 5 : 0);
  const aiScore = (content.match(/\b(python|ai|machine learning|deep learning|data science|nlp|pytorch|tensorflow|langchain|rag|genai|llm|computer vision)\b/g) || []).length * 2 + (/ai|ml|data scientist|machine learning/i.test(title) ? 5 : 0);
  const devopsScore = (content.match(/\b(devops|sre|kubernetes|docker|terraform|ansible|helm|jenkins|ci\/cd|observability|prometheus|grafana|cloud security)\b/g) || []).length * 2 + (/devops|sre|infrastructure|cloud engineer/i.test(title) ? 5 : 0);
  const fullstackScore = (content.match(/\b(react|next\.js|frontend|full stack|javascript|typescript|node|vue|angular|tailwind|web development)\b/g) || []).length * 2 + (/full stack|frontend|react|node|web/i.test(title) ? 5 : 0);

  const scores = [
    { domain: 'Java & Cloud' as const, score: javaScore },
    { domain: 'Data Science & AI' as const, score: aiScore },
    { domain: 'DevOps & SRE' as const, score: devopsScore },
    { domain: 'Full Stack & Core' as const, score: fullstackScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].domain : 'Full Stack & Core';
}

export function detectWorkMode(location?: string, description?: string): 'Remote' | 'Hybrid' | 'Onsite' {
  const text = `${location || ''} ${description || ''}`.toLowerCase();
  if (/hybrid/i.test(text)) return 'Hybrid';
  if (/remote|anywhere|work from home|telecommute|wfh/i.test(text)) return 'Remote';
  return 'Onsite';
}

export function detectIndianCity(location?: string, description?: string): string {
  const text = `${location || ''} ${description || ''}`.toLowerCase();
  if (/bengaluru|bangalore/i.test(text)) return 'Bengaluru, Karnataka';
  if (/hyderabad|telangana/i.test(text)) return 'Hyderabad, Telangana';
  if (/pune/i.test(text)) return 'Pune, Maharashtra';
  if (/gurgaon|gurugram|noida|delhi|ncr/i.test(text)) return 'Delhi-NCR (Gurgaon/Noida)';
  if (/mumbai|navi mumbai/i.test(text)) return 'Mumbai, Maharashtra';
  if (/chennai|tamil nadu/i.test(text)) return 'Chennai, Tamil Nadu';
  if (/ahmedabad/i.test(text)) return 'Ahmedabad, Gujarat';
  if (/kolkata/i.test(text)) return 'Kolkata, West Bengal';
  if (/kochi|cochin/i.test(text)) return 'Kochi, Kerala';
  if (/remote/i.test(text)) return 'Remote (India-Wide)';
  return location && location.trim() ? location.trim() : 'Bengaluru / Remote (India)';
}

export function detectExperience(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/intern|internship|trainee|apprentice|fresher|campus|graduate trainee|associate engineer|0-1|0 to 1|entry level|2024 batch|2025 batch|2026 batch/i.test(text)) {
    return 'Fresher / 0-1 YOE';
  }
  if (/senior|lead|staff|principal|head|architect|5\+|6\+|7\+|8\+|4-8|5-10/i.test(text)) {
    return '3+ YOE';
  }
  return '1-3 YOE';
}

export function generateIndianSalary(domain: NormalizedJob['domain'], exp: string, existingSalary?: string): string {
  if (existingSalary && existingSalary.includes('₹')) {
    return existingSalary.trim();
  }

  const isFresher = exp.includes('Fresher') || exp.includes('0-1') || exp.includes('Intern');
  const isSenior = exp.includes('3+') || exp.includes('Senior');

  switch (domain) {
    case 'Data Science & AI':
      if (isFresher) return '₹10 - ₹18 LPA';
      if (isSenior) return '₹28 - ₹50 LPA';
      return '₹18 - ₹30 LPA';
    case 'Java & Cloud':
      if (isFresher) return '₹7.5 - ₹14 LPA';
      if (isSenior) return '₹24 - ₹45 LPA';
      return '₹14 - ₹26 LPA';
    case 'DevOps & SRE':
      if (isFresher) return '₹8 - ₹15 LPA';
      if (isSenior) return '₹25 - ₹48 LPA';
      return '₹16 - ₹28 LPA';
    case 'Full Stack & Core':
    default:
      if (isFresher) return '₹6.5 - ₹12 LPA';
      if (isSenior) return '₹22 - ₹40 LPA';
      return '₹12 - ₹22 LPA';
  }
}

export function getCompanyLogo(company: string, providedLogo?: string): string {
  if (providedLogo && (providedLogo.startsWith('http://') || providedLogo.startsWith('https://') || providedLogo.startsWith('data:'))) {
    return providedLogo;
  }

  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '');

  const indianAndGlobalLogos: Record<string, string> = {
    razorpay: 'https://cdn.simpleicons.org/razorpay/0C2340',
    swiggy: 'https://cdn.simpleicons.org/swiggy/FC8019',
    zomato: 'https://cdn.simpleicons.org/zomato/CB202D',
    flipkart: 'https://cdn.simpleicons.org/flipkart/2874F0',
    phonepe: 'https://cdn.simpleicons.org/phonepe/5F259F',
    cred: 'https://cdn.simpleicons.org/cred/000000',
    paytm: 'https://cdn.simpleicons.org/paytm/002E6E',
    zoho: 'https://cdn.simpleicons.org/zoho/E42528',
    zepto: 'https://ui-avatars.com/api/?name=Zepto&background=7A1896&color=fff&bold=true',
    groww: 'https://ui-avatars.com/api/?name=Groww&background=00D09C&color=fff&bold=true',
    zerodha: 'https://ui-avatars.com/api/?name=Zerodha&background=387ED1&color=fff&bold=true',
    meesho: 'https://ui-avatars.com/api/?name=Meesho&background=F43397&color=fff&bold=true',
    tcs: 'https://cdn.simpleicons.org/tata/00529B',
    infosys: 'https://cdn.simpleicons.org/infosys/007CC3',
    wipro: 'https://cdn.simpleicons.org/wipro/B8232F',
    amazon: 'https://cdn.simpleicons.org/amazon/FF9900',
    microsoft: 'https://cdn.simpleicons.org/microsoft/00A4EF',
    google: 'https://cdn.simpleicons.org/google/4285F4',
    atlassian: 'https://cdn.simpleicons.org/atlassian/0052CC',
    oracle: 'https://cdn.simpleicons.org/oracle/F80000',
    cisco: 'https://cdn.simpleicons.org/cisco/1BA0D7',
    uber: 'https://cdn.simpleicons.org/uber/000000',
    postman: 'https://cdn.simpleicons.org/postman/FF6C37',
    browserstack: 'https://cdn.simpleicons.org/browserstack/008296',
  };

  for (const [key, url] of Object.entries(indianAndGlobalLogos)) {
    if (slug.includes(key)) return url;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=4F46E5&color=fff&bold=true&size=128`;
}

export function normalizeJob(raw: RawScrapedJob): NormalizedJob {
  const cleanTitle = cleanHtml(raw.roleTitle);
  const cleanCompany = cleanHtml(raw.companyName);
  const cleanDesc = cleanHtml(raw.description);

  const dedupeString = `${raw.source}_${cleanCompany.toLowerCase()}_${cleanTitle.toLowerCase()}_${raw.applyUrl.toLowerCase()}`;
  const externalId = crypto.createHash('md5').update(dedupeString).digest('hex');
  const id = `job_${externalId.slice(0, 16)}`;

  const domain = classifyDomain(cleanTitle, cleanDesc);
  const location = detectIndianCity(raw.location, cleanDesc);
  const workMode = raw.workMode || detectWorkMode(location, cleanDesc);
  const experienceLevel = raw.experienceLevel || detectExperience(cleanTitle, cleanDesc);
  const techStack = raw.techStack && raw.techStack.length > 0 ? raw.techStack : extractTechStack(cleanDesc, cleanTitle);
  const salaryRange = generateIndianSalary(domain, experienceLevel, raw.salaryRange);
  const requirements = raw.requirements && raw.requirements.length > 0 ? raw.requirements : extractRequirements(raw.description);
  const companyLogo = getCompanyLogo(cleanCompany, raw.companyLogo);

  return {
    id,
    externalId,
    companyName: cleanCompany,
    companyLogo,
    roleTitle: cleanTitle,
    domain,
    location,
    workMode,
    salaryRange,
    experienceLevel,
    techStack,
    referralAvailable: raw.referralAvailable !== undefined ? raw.referralAvailable : true,
    applyUrl: raw.applyUrl,
    postedDate: raw.postedDate || 'Active Opening',
    description: cleanDesc
      .replace(/\b(?:Hiring in [^.]*?\s+)?via\s+(?:LinkedIn|Naukri|Indeed|Instahyre|Wellfound|Arbeitnow|Jobicy|Himalayas|Remotive|Unstop)\.?/gi, 'via Verified Partner Network.')
      .replace(/\b(?:Apply on|Source:|Posted on)\s+(?:LinkedIn|Naukri|Indeed|Instahyre|Wellfound|Arbeitnow|Jobicy|Himalayas|Remotive|Unstop)\b/gi, 'Direct Opportunity')
      .slice(0, 1200),
    requirements,
    source: raw.source === 'Custom' ? 'Custom' : 'Enterprise Partner',
    isActive: true,
  };
}
