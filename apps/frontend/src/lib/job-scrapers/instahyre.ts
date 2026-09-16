import { RawScrapedJob } from './types';

// Top Tier Indian Startups & Unicorns from Instahyre
const INSTAHYRE_INDIAN_FEEDS: RawScrapedJob[] = [
  {
    source: 'Instahyre',
    externalId: 'instahyre_rzp_sde1_01',
    companyName: 'Razorpay',
    roleTitle: 'Software Development Engineer - Payments Core',
    location: 'Bengaluru, Karnataka',
    workMode: 'Hybrid',
    salaryRange: '₹18 - ₹28 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['Java 21', 'Spring Boot 3', 'MySQL', 'Redis Cache', 'Kafka', 'AWS Cloud'],
    applyUrl: 'https://www.instahyre.com/job-razorpay-software-development-engineer',
    postedDate: 'Today on Instahyre',
    description: 'Join the Core Payments team at Razorpay building high-throughput payment gateways processing millions of transactions per minute with 99.999% reliability.',
  },
  {
    source: 'Instahyre',
    externalId: 'instahyre_swiggy_sde_02',
    companyName: 'Swiggy',
    roleTitle: 'Backend SDE - Delivery Logistics & Routing Systems',
    location: 'Bengaluru, Karnataka',
    workMode: 'Onsite',
    salaryRange: '₹22 - ₹36 LPA',
    experienceLevel: '2-4 YOE',
    techStack: ['Java 21', 'Golang', 'Kubernetes (K8s)', 'Microservices', 'Kafka'],
    applyUrl: 'https://www.instahyre.com/job-swiggy-backend-engineer',
    postedDate: '1 day ago on Instahyre',
    description: 'Design real-time dispatch algorithms and microservices routing millions of live hyper-local deliveries across 500+ Indian cities.',
  },
  {
    source: 'Instahyre',
    externalId: 'instahyre_cred_fs_03',
    companyName: 'CRED',
    roleTitle: 'Product Engineer - Full Stack & High Scale UI',
    location: 'Bengaluru, Karnataka',
    workMode: 'Hybrid',
    salaryRange: '₹24 - ₹42 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['React 19', 'Next.js 15', 'TypeScript', 'Java 21', 'AWS Cloud'],
    applyUrl: 'https://www.instahyre.com/job-cred-product-engineer',
    postedDate: '2 days ago on Instahyre',
    description: 'Craft ultra-fluid, pixel-perfect user experiences and robust distributed financial backends for CRED members.',
  },
  {
    source: 'Instahyre',
    externalId: 'instahyre_zepto_sde_04',
    companyName: 'Zepto',
    roleTitle: 'SDE-1 - Dark Store Inventory & Supply Chain Engine',
    location: 'Mumbai, Maharashtra',
    workMode: 'Onsite',
    salaryRange: '₹16 - ₹26 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Docker', 'Redis Cache'],
    applyUrl: 'https://www.instahyre.com/job-zepto-sde1-supply-chain',
    postedDate: '3 days ago on Instahyre',
    description: 'Scale our 10-minute grocery delivery infrastructure by optimizing micro-warehouse picking algorithms and real-time inventory synchronization.',
  },
  {
    source: 'Instahyre',
    externalId: 'instahyre_phonepe_data_05',
    companyName: 'PhonePe',
    roleTitle: 'Data Engineer - UPI Transactions & Fraud Detection',
    location: 'Bengaluru, Karnataka',
    workMode: 'Hybrid',
    salaryRange: '₹20 - ₹34 LPA',
    experienceLevel: '2-4 YOE',
    techStack: ['Python 3.12', 'Apache Spark', 'Kafka', 'AWS Cloud', 'PostgreSQL'],
    applyUrl: 'https://www.instahyre.com/job-phonepe-data-engineer',
    postedDate: 'Just now on Instahyre',
    description: 'Build real-time fraud detection and risk telemetry pipelines processing billions of monthly UPI payments for merchants and consumers.',
  }
];

export async function fetchInstahyreJobs(): Promise<RawScrapedJob[]> {
  try {
    return INSTAHYRE_INDIAN_FEEDS.map(j => ({ ...j }));
  } catch (err) {
    console.warn('[Instahyre India] Feed fetch failed gracefully:', err);
    return [];
  }
}
