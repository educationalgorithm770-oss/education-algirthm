'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface PublicJobItem {
  id: string;
  companyName: string;
  companyLogo?: string;
  roleTitle: string;
  domain?: string;
  location: string;
  workMode: string;
  salaryRange: string;
  experienceLevel: string;
  techStack?: string[] | string;
  postedDate?: string;
  description?: string;
  requirements?: string[] | string;
  source?: string;
}

const FALLBACK_JOBS: PublicJobItem[] = [
  {
    id: 'job_cisco_01',
    companyName: 'Cisco India',
    roleTitle: 'Software Engineer Trainee - Cloud & Networking Systems',
    domain: 'Java & Cloud',
    location: 'Bengaluru, Karnataka',
    workMode: 'Hybrid',
    salaryRange: '₹14 - ₹20 LPA',
    experienceLevel: 'Fresher / 0-1 YOE',
    techStack: ['Java 21', 'Spring Boot 3', 'Docker', 'Linux', 'Concurrency'],
    postedDate: 'Today',
    description: 'Work on high-throughput distributed network virtualization, cloud routing engines, and Linux concurrency kernels.',
    source: 'Partner',
  },
  {
    id: 'job_capgemini_02',
    companyName: 'Capgemini',
    roleTitle: 'Software Engineer - Exceller Fresher Drive (2024–2026 Batch)',
    domain: 'Full Stack & Core',
    location: 'Pune / Hyderabad / Chennai',
    workMode: 'Hybrid',
    salaryRange: '₹4.5 - ₹7.5 LPA',
    experienceLevel: 'Fresher / 0-1 YOE',
    techStack: ['Core Java', 'Spring Boot', 'SQL', 'REST APIs'],
    postedDate: '1 day ago',
    description: 'Exceller recruitment drive for engineering graduates. Build modern cloud and microservices software products.',
    source: 'Partner',
  },
  {
    id: 'job_persistent_03',
    companyName: 'Persistent Systems',
    roleTitle: 'Associate Software Engineer - Java & Distributed Systems',
    domain: 'Java & Cloud',
    location: 'Pune / Nagpur / Hyderabad',
    workMode: 'Hybrid',
    salaryRange: '₹5.5 - ₹8.5 LPA',
    experienceLevel: 'Fresher / 0-1 YOE',
    techStack: ['Java 21', 'Kafka', 'Redis', 'PostgreSQL'],
    postedDate: 'Today',
    description: 'Design scalable enterprise microservices, implement distributed caching, and write resilient database queries.',
    source: 'Partner',
  },
  {
    id: 'job_google_04',
    companyName: 'Google India',
    roleTitle: 'Software Engineer III - Full Stack & Scalable Systems',
    domain: 'Full Stack & Core',
    location: 'Hyderabad, Telangana',
    workMode: 'Onsite',
    salaryRange: '₹28 - ₹42 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['Java 21', 'Distributed Systems', 'TypeScript', 'Kubernetes'],
    postedDate: '2 hours ago',
    description: 'Architect low-latency global distributed backends with high resilience and real-time transaction consistency.',
    source: 'Partner',
  },
  {
    id: 'job_wipro_05',
    companyName: 'Wipro',
    roleTitle: 'Project Engineer - Elite Talent Hunt',
    domain: 'Full Stack & Core',
    location: 'Pan India (Bengaluru, Pune, Noida)',
    workMode: 'Hybrid',
    salaryRange: '₹4.0 - ₹7.0 LPA',
    experienceLevel: 'Fresher / 0-1 YOE',
    techStack: ['Java', 'Python', 'Data Structures', 'Linux'],
    postedDate: '3 hours ago',
    description: 'Elite national talent hunt for engineering graduates to build next-generation enterprise cloud platforms.',
    source: 'Partner',
  },
  {
    id: 'job_rapid7_06',
    companyName: 'Rapid7',
    roleTitle: 'DevOps & Site Reliability Engineer',
    domain: 'DevOps & SRE',
    location: 'Pune, Maharashtra',
    workMode: 'Hybrid',
    salaryRange: '₹16 - ₹26 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD'],
    postedDate: '5 hours ago',
    description: 'Automate multi-region cloud deployment pipelines with automated blue-green cutovers and zero downtime.',
    source: 'Partner',
  },
];

function cleanJobDescription(desc?: string, roleTitle?: string, company?: string): string {
  if (!desc) {
    return `Engineering opportunity at ${company || 'top tech enterprise'} focusing on scalable architecture, clean software design, and core engineering foundations.`;
  }
  return desc
    .replace(/Hiring in India via LinkedIn\.?/gi, '')
    .replace(/Hiring in India via Naukri\.?/gi, '')
    .replace(/Hiring in India via [a-zA-Z0-9_-]+\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDomainColor(domain?: string) {
  const d = (domain || '').toLowerCase();
  if (d.includes('java') || d.includes('cloud')) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: 'fa-solid fa-mug-hot' };
  }
  if (d.includes('ai') || d.includes('data') || d.includes('python')) {
    return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: 'fa-solid fa-brain' };
  }
  if (d.includes('devops') || d.includes('sre')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: 'fa-solid fa-server' };
  }
  return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: 'fa-solid fa-code' };
}

function getCompanyInitialBg(name: string) {
  const colors = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-indigo-800',
    'from-emerald-600 to-teal-800',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700',
    'from-slate-700 to-slate-900',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function PublicJobsRadar() {
  const [jobs, setJobs] = useState<PublicJobItem[]>(FALLBACK_JOBS);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'Java' | 'Fresher' | 'FullStack' | 'AI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<PublicJobItem | null>(null);
  const [isGatedModalOpen, setIsGatedModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(789);
  const [fresherCount, setFresherCount] = useState(347);

  useEffect(() => {
    const controller = new AbortController();
    async function loadLiveJobs() {
      try {
        const res = await fetch('/api/jobs?limit=1000', { signal: controller.signal });
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
          if (data.count) setTotalCount(data.count);

          const freshers = data.jobs.filter(
            (j: { experienceLevel?: string }) =>
              (j.experienceLevel && j.experienceLevel.toLowerCase().includes('fresher')) ||
              (j.experienceLevel && j.experienceLevel.includes('0-1'))
          );
          if (freshers.length > 0) setFresherCount(freshers.length > 0 ? freshers.length : 347);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Fallback intact
      }
    }
    loadLiveJobs();
    return () => controller.abort();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeCategory === 'Java') {
        const hasJava =
          (job.roleTitle && job.roleTitle.toLowerCase().includes('java')) ||
          (Array.isArray(job.techStack) && job.techStack.some((t) => t.toLowerCase().includes('java'))) ||
          (job.domain && job.domain.toLowerCase().includes('java'));
        if (!hasJava) return false;
      } else if (activeCategory === 'Fresher') {
        const isFresher =
          (job.experienceLevel && job.experienceLevel.toLowerCase().includes('fresher')) ||
          (job.experienceLevel && job.experienceLevel.includes('0-1')) ||
          (job.roleTitle && job.roleTitle.toLowerCase().includes('trainee')) ||
          (job.roleTitle && job.roleTitle.toLowerCase().includes('graduate'));
        if (!isFresher) return false;
      } else if (activeCategory === 'FullStack') {
        const isFS =
          (job.domain && job.domain.toLowerCase().includes('full stack')) ||
          (job.roleTitle && job.roleTitle.toLowerCase().includes('react')) ||
          (job.roleTitle && job.roleTitle.toLowerCase().includes('stack'));
        if (!isFS) return false;
      } else if (activeCategory === 'AI') {
        const isAI =
          (job.domain && (job.domain.toLowerCase().includes('ai') || job.domain.toLowerCase().includes('data'))) ||
          (job.roleTitle && (job.roleTitle.toLowerCase().includes('ai') || job.roleTitle.toLowerCase().includes('python')));
        if (!isAI) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.roleTitle && job.roleTitle.toLowerCase().includes(q);
        const matchesCompany = job.companyName && job.companyName.toLowerCase().includes(q);
        const matchesLoc = job.location && job.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLoc) return false;
      }

      return true;
    });
  }, [jobs, activeCategory, searchQuery]);

  return (
    <section id="jobs-radar" className="py-12 sm:py-20 px-3 sm:px-6 bg-slate-50 border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Section Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Talent Network &amp; Career Radar
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Real-Time Developer Openings
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Synced hourly across verified enterprise hiring drives, tech partners, and high-growth accelerators.
            </p>
          </div>

          {/* Live Metrics Chips */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <div className="bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
              <span className="text-[11px] sm:text-xs text-slate-600 font-bold">Total:</span>
              <span className="text-[11px] sm:text-xs font-black text-slate-900">{totalCount} Active</span>
            </div>
            <div className="bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
              <span className="text-[11px] sm:text-xs text-slate-600 font-bold">Fresher:</span>
              <span className="text-[11px] sm:text-xs font-black text-indigo-600">{fresherCount} Roles</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
              <i className="fa-solid fa-indian-rupee-sign text-emerald-600 text-xs shrink-0"></i>
              <span className="text-[11px] sm:text-xs text-slate-600 font-bold">Packages:</span>
              <span className="text-[11px] sm:text-xs font-black text-slate-900">₹4.5 – ₹42 LPA</span>
            </div>
          </div>
        </div>

        {/* Domain Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1.5 no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Openings ({totalCount})
            </button>
            <button
              onClick={() => setActiveCategory('Java')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'Java'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ☕ Java &amp; Cloud
            </button>
            <button
              onClick={() => setActiveCategory('Fresher')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'Fresher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🎓 Fresher ({fresherCount})
            </button>
            <button
              onClick={() => setActiveCategory('FullStack')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'FullStack'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ⚛️ Full Stack
            </button>
            <button
              onClick={() => setActiveCategory('AI')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'AI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🤖 AI &amp; Python
            </button>
          </div>

          <div className="w-full sm:w-72 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search role, skills, or city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Jobs Grid (Redesigned with Clear Logos, Domains, and Dates) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredJobs.slice(0, 6).map((job) => {
            const rawStack = Array.isArray(job.techStack)
              ? job.techStack
              : typeof job.techStack === 'string'
              ? (job.techStack as string).split(',').map((s) => s.trim())
              : [];

            const domainMeta = getDomainColor(job.domain);
            const cleanDesc = cleanJobDescription(job.description, job.roleTitle, job.companyName);
            const postDateText = job.postedDate ? job.postedDate : 'Today';

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  
                  {/* Header Row: Clear Company Logo + Name & Visible Posting Date */}
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center space-x-3 min-w-0">
                      {job.companyLogo ? (
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          <img
                            src={job.companyLogo}
                            alt={job.companyName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              (e.currentTarget.parentElement as HTMLElement).innerHTML = `<span class="font-black text-xs text-indigo-700">${job.companyName.substring(0, 3).toUpperCase()}</span>`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${getCompanyInitialBg(job.companyName)} text-white font-black flex items-center justify-center text-sm shadow-xs uppercase shrink-0`}>
                          {job.companyName.substring(0, 3)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                          {job.companyName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                          <i className="fa-solid fa-location-dot text-slate-400 shrink-0"></i>
                          <span className="truncate">{job.location || 'India'}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold shrink-0">{job.workMode || 'Hybrid'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Visible Posting Date Badge */}
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        <i className="fa-regular fa-clock text-[9px] text-indigo-600"></i>
                        <span>{postDateText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Prominent Posted Domain Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${domainMeta.bg} ${domainMeta.text} border ${domainMeta.border}`}>
                      <i className={`${domainMeta.icon} text-[10px]`}></i>
                      <span>Domain: {job.domain || 'Full Stack & Core'}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {job.experienceLevel || 'Fresher / 0-1 YOE'}
                    </span>
                  </div>

                  {/* Role Title & Description */}
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">
                      {job.roleTitle}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 font-normal leading-relaxed">
                      {cleanDesc}
                    </p>
                  </div>

                  {/* Tech Stack Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {rawStack.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {tech}
                      </span>
                    ))}
                    {rawStack.length === 0 && (
                      <>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Java 21</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Spring Boot 3</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Bottom Row: Package + Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Package</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">{job.salaryRange || 'Competitive'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setSelectedJobForDetails(job)}
                      className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setIsGatedModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-lock text-[10px]"></i> Claim Referral
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-6 bg-slate-900 rounded-2xl sm:rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-black">Looking for direct company referrals &amp; AI pitch optimization?</h3>
            <p className="text-slate-400 text-xs font-normal">
              Students enrolled in our accelerator gain 1-click internal referrals and direct alumni mentor introductions.
            </p>
          </div>
          <button
            onClick={() => setIsGatedModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition-all shrink-0 cursor-pointer text-center"
          >
            Unlock 1-Click Cohort Referrals &rarr;
          </button>
        </div>

      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJobForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedJobForDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-base cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="flex items-center gap-3">
              {selectedJobForDetails.companyLogo ? (
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img src={selectedJobForDetails.companyLogo} alt={selectedJobForDetails.companyName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${getCompanyInitialBg(selectedJobForDetails.companyName)} text-white font-black flex items-center justify-center text-sm uppercase shrink-0`}>
                  {selectedJobForDetails.companyName.substring(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  Domain: {selectedJobForDetails.domain || 'Full Stack & Core'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{selectedJobForDetails.roleTitle}</h3>
                <p className="text-xs text-slate-500">{selectedJobForDetails.companyName} • {selectedJobForDetails.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Salary Package</span>
                <span className="font-black text-slate-900">{selectedJobForDetails.salaryRange || 'Competitive'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Experience Tier</span>
                <span className="font-black text-slate-900">{selectedJobForDetails.experienceLevel || 'Fresher / 0-1 YOE'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Role Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {cleanJobDescription(selectedJobForDetails.description, selectedJobForDetails.roleTitle, selectedJobForDetails.companyName)}
              </p>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 text-xs font-black">
                <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                <span>How Education Algorithm Prepares You:</span>
              </div>
              <p className="text-xs text-indigo-950 font-normal leading-relaxed">
                Our Java 21, Concurrency, and System Architecture tracks directly train you on Virtual Threads, Kafka, Docker, and SQL optimization required for this exact role.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="text-xs font-bold text-slate-600 px-4 py-2 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedJobForDetails(null);
                  setIsGatedModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-lock text-[10px]"></i> Claim Referral &amp; AI Pitch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GATED COHORT LEAD-GEN MODAL */}
      {isGatedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 border border-slate-200 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsGatedModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-base cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                Cohort Exclusive Talent Network
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Reserved for Enrolled Students &amp; Alumni
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Direct 1-Click Referrals and AI Pitch Generators are exclusively unlocked for enrolled students with verified <strong>Proof-of-Work repositories</strong> and completed <strong>System Sandboxes</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Direct Hiring Manager &amp; Alumni Referral Links</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
                <span>AI-Tailored Resume &amp; Role Alignment Pitch</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
                <span>Staff SDE 1-on-1 Interview Defense Preparation</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <Link
                href="/courses"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition-colors"
              >
                Enroll in Fall 2026 Cohort &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold py-3 rounded-xl transition-colors"
              >
                Student Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
