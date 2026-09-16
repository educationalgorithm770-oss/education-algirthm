export type IndianJobSource =
  | 'LinkedIn'
  | 'Naukri'
  | 'Instahyre'
  | 'Unstop'
  | 'Wellfound'
  | 'Partner'
  | 'Custom';

export type IndianTechHub =
  | 'Bengaluru'
  | 'Hyderabad'
  | 'Pune'
  | 'Delhi-NCR'
  | 'Mumbai'
  | 'Chennai'
  | 'Remote (India)';

export interface RawScrapedJob {
  source: IndianJobSource | string;
  externalId?: string;
  companyName: string;
  companyLogo?: string;
  roleTitle: string;
  location?: string;
  workMode?: 'Remote' | 'Hybrid' | 'Onsite';
  salaryRange?: string;
  experienceLevel?: string;
  techStack?: string[];
  applyUrl: string;
  postedDate?: string;
  description: string;
  requirements?: string[];
  referralAvailable?: boolean;
}

export interface NormalizedJob {
  id: string;
  externalId: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  domain: 'Java & Cloud' | 'Data Science & AI' | 'DevOps & SRE' | 'Full Stack & Core';
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite';
  salaryRange: string;
  experienceLevel: string;
  techStack: string[];
  referralAvailable: boolean;
  applyUrl: string;
  postedDate: string;
  description: string;
  requirements: string[];
  source: string;
  mentorName?: string;
  mentorRole?: string;
  isActive?: boolean;
}

export interface SyncStats {
  startedAt: string;
  completedAt: string;
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  sourcesContacted: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorMessage?: string;
}
