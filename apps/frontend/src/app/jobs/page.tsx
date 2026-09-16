'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import FresherRealityCheckPopup from '@/components/marketing/FresherRealityCheckPopup';

interface PublicJob {
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
  source?: string;
}

interface DropdownItem {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
}

// Elegant Custom Dropdown Component
function FilterDropdown({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: DropdownItem[];
  icon: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];
  const isFiltered = value !== 'ALL';

  return (
    <div className="relative" ref={ref}>
      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        {isFiltered && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
        )}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
          isFiltered
            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-xs'
            : 'bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        } ${isOpen ? 'ring-2 ring-indigo-500/30 border-indigo-500 bg-white' : ''}`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          <i className={`${selectedOption.icon || icon} ${isFiltered ? 'text-indigo-600' : 'text-slate-400'} text-xs shrink-0`}></i>
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}></i>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-900 font-black'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <i className={`${opt.icon} ${isSelected ? 'text-indigo-600' : 'text-slate-400'} text-xs shrink-0`}></i>}
                  <span className="truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <i className="fa-solid fa-check text-indigo-600 text-xs ml-1"></i>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedExp, setSelectedExp] = useState('ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [isGatedModalOpen, setIsGatedModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic live counts synchronized across all components
  const totalJobsCount = jobs.length > 0 ? jobs.length : 789;
  const liveFresherCount = useMemo(() => {
    if (!jobs || jobs.length === 0) return 347;
    return jobs.filter((j) => {
      const exp = (j.experienceLevel || '').toLowerCase();
      return exp.includes('fresher') || exp.includes('0-1') || exp.includes('0-2') || exp.includes('entry');
    }).length;
  }, [jobs]);

  useEffect(() => {
    async function loadJobs() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/jobs?limit=1000');
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to load public jobs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  // Close modals on Escape key and lock background body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedJob(null);
        setIsGatedModalOpen(false);
      }
    }
    if (selectedJob || isGatedModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedJob, isGatedModalOpen]);

  // Compute available cities from database
  const citiesList = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((j) => {
      if (j.location) {
        const loc = j.location.toLowerCase();
        let normalized = '';
        if (loc.includes('bengaluru') || loc.includes('bangalore')) normalized = 'Bengaluru';
        else if (loc.includes('hyderabad')) normalized = 'Hyderabad';
        else if (loc.includes('pune')) normalized = 'Pune';
        else if (loc.includes('delhi') || loc.includes('gurgaon') || loc.includes('ncr') || loc.includes('noida')) normalized = 'Delhi-NCR';
        else if (loc.includes('chennai')) normalized = 'Chennai';
        else if (loc.includes('mumbai')) normalized = 'Mumbai';
        else if (loc.includes('remote')) normalized = 'Remote';

        if (normalized) {
          map.set(normalized, (map.get(normalized) || 0) + 1);
        }
      }
    });

    const items: DropdownItem[] = [{ value: 'ALL', label: 'All Cities & Regions', icon: 'fa-solid fa-globe' }];
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([city, count]) => {
        items.push({
          value: city,
          label: city,
          icon: 'fa-solid fa-location-dot',
          badge: `${count}`,
        });
      });
    return items;
  }, [jobs]);

  // Dropdown options
  const domainOptions: DropdownItem[] = [
    { value: 'ALL', label: 'All Domains', icon: 'fa-solid fa-layer-group' },
    { value: 'Java', label: 'Java & Cloud Engineering', icon: 'fa-solid fa-mug-hot' },
    { value: 'Full Stack', label: 'Full Stack & Web', icon: 'fa-solid fa-code' },
    { value: 'DevOps', label: 'DevOps & SRE', icon: 'fa-solid fa-server' },
    { value: 'AI', label: 'Data Science & AI', icon: 'fa-solid fa-brain' },
  ];

  const expOptions: DropdownItem[] = [
    { value: 'ALL', label: 'All Experience Tiers', icon: 'fa-solid fa-briefcase' },
    { value: 'Fresher', label: 'Fresher & Graduate (0-1 YOE)', icon: 'fa-solid fa-graduation-cap' },
    { value: '1-3', label: 'Associate / SDE-1 (1-3 YOE)', icon: 'fa-solid fa-user-gear' },
    { value: '3+', label: 'Mid-Senior (3+ YOE)', icon: 'fa-solid fa-crown' },
  ];

  const workModeOptions: DropdownItem[] = [
    { value: 'ALL', label: 'All Work Modes', icon: 'fa-solid fa-building' },
    { value: 'Remote', label: '100% Remote', icon: 'fa-solid fa-laptop-house' },
    { value: 'Hybrid', label: 'Hybrid Workplace', icon: 'fa-solid fa-shuffle' },
    { value: 'Onsite', label: 'Onsite / In-Office', icon: 'fa-solid fa-city' },
  ];

  // Accurate filtering logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // 1. Domain Filter
      if (selectedDomain !== 'ALL') {
        const dom = (j.domain || '').toLowerCase();
        const title = (j.roleTitle || '').toLowerCase();
        const tech = Array.isArray(j.techStack) ? j.techStack.join(' ').toLowerCase() : (j.techStack || '').toLowerCase();

        if (selectedDomain === 'Java') {
          const match = dom.includes('java') || title.includes('java') || title.includes('spring') || tech.includes('java') || tech.includes('spring');
          if (!match) return false;
        } else if (selectedDomain === 'Full Stack') {
          const match = dom.includes('full stack') || title.includes('react') || title.includes('stack') || title.includes('web') || tech.includes('react');
          if (!match) return false;
        } else if (selectedDomain === 'DevOps') {
          const match = dom.includes('devops') || dom.includes('sre') || title.includes('cloud') || title.includes('devops') || title.includes('sre') || tech.includes('docker') || tech.includes('aws');
          if (!match) return false;
        } else if (selectedDomain === 'AI') {
          const match = dom.includes('ai') || dom.includes('data') || title.includes('ai') || title.includes('python') || title.includes('data') || tech.includes('python');
          if (!match) return false;
        }
      }

      // 2. Experience Filter
      if (selectedExp !== 'ALL') {
        const exp = (j.experienceLevel || '').toLowerCase();
        const title = (j.roleTitle || '').toLowerCase();

        if (selectedExp === 'Fresher') {
          const isF = exp.includes('fresher') || exp.includes('0-1') || title.includes('intern') || title.includes('trainee') || title.includes('graduate') || title.includes('fresher') || title.includes('associate');
          if (!isF) return false;
        } else if (selectedExp === '1-3') {
          const isMid = exp.includes('1-3') || title.includes('sde 1') || title.includes('sde-1') || title.includes('junior') || (exp.includes('1') && !exp.includes('0-1'));
          if (!isMid) return false;
        } else if (selectedExp === '3+') {
          const isSenior = exp.includes('3+') || exp.includes('3-5') || title.includes('senior') || title.includes('sr.') || title.includes('lead');
          if (!isSenior) return false;
        }
      }

      // 3. Work Mode Filter
      if (selectedWorkMode !== 'ALL') {
        const wm = (j.workMode || '').toLowerCase();
        if (selectedWorkMode === 'Remote' && !wm.includes('remote')) return false;
        if (selectedWorkMode === 'Hybrid' && !wm.includes('hybrid')) return false;
        if (selectedWorkMode === 'Onsite' && !wm.includes('onsite')) return false;
      }

      // 4. City Filter
      if (selectedCity !== 'ALL') {
        const loc = (j.location || '').toLowerCase();
        if (selectedCity === 'Delhi-NCR') {
          const match = loc.includes('delhi') || loc.includes('gurgaon') || loc.includes('ncr') || loc.includes('noida');
          if (!match) return false;
        } else if (selectedCity === 'Bengaluru') {
          const match = loc.includes('bengaluru') || loc.includes('bangalore');
          if (!match) return false;
        } else {
          if (!loc.includes(selectedCity.toLowerCase())) return false;
        }
      }

      // 5. Keyword Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (j.roleTitle || '').toLowerCase().includes(q);
        const matchesCompany = (j.companyName || '').toLowerCase().includes(q);
        const matchesLocation = (j.location || '').toLowerCase().includes(q);
        const matchesDomain = (j.domain || '').toLowerCase().includes(q);
        const matchesTech = Array.isArray(j.techStack)
          ? j.techStack.some((t) => t.toLowerCase().includes(q))
          : typeof j.techStack === 'string' && (j.techStack as string).toLowerCase().includes(q);

        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesDomain && !matchesTech) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, selectedDomain, selectedExp, selectedWorkMode, selectedCity, searchQuery]);

  const hasActiveFilters = selectedDomain !== 'ALL' || selectedExp !== 'ALL' || selectedWorkMode !== 'ALL' || selectedCity !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedDomain('ALL');
    setSelectedExp('ALL');
    setSelectedWorkMode('ALL');
    setSelectedCity('ALL');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <HeaderNavbar />

      {/* Main Header Banner */}
      <section className="bg-white border-b border-slate-200 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Verified Enterprise Talent Radar
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Explore <span className="text-indigo-600">{jobs.length > 0 ? jobs.length : 780}+ Active Tech Openings</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            Real-time verified developer roles across Top Tech Leaders &amp; High-Growth Startups. Enrolled students unlock direct 1-click internal referrals and AI application pitch optimization.
          </p>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-2">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs">
              <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
              <span>{liveFresherCount}+ Fresher &amp; Graduate Roles</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs">
              <i className="fa-solid fa-indian-rupee-sign text-emerald-600"></i>
              <span>₹4.5 - ₹42 LPA Salary Range</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs">
              <i className="fa-solid fa-rotate text-amber-500"></i>
              <span>Synced Hourly from Enterprise Feeds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-6">
        
        {/* Search & Custom Filter Controls Bar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          
          {/* Keyword Search Input */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role title, company name, skill (e.g. Java, React, Kafka, Docker), or city..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/80 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          {/* 4 Custom Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <FilterDropdown
              label="Domain / Track"
              value={selectedDomain}
              onChange={setSelectedDomain}
              options={domainOptions}
              icon="fa-solid fa-layer-group"
            />
            <FilterDropdown
              label="Experience Tier"
              value={selectedExp}
              onChange={setSelectedExp}
              options={expOptions}
              icon="fa-solid fa-briefcase"
            />
            <FilterDropdown
              label="Work Mode"
              value={selectedWorkMode}
              onChange={setSelectedWorkMode}
              options={workModeOptions}
              icon="fa-solid fa-building"
            />
            <FilterDropdown
              label="City / Region"
              value={selectedCity}
              onChange={setSelectedCity}
              options={citiesList}
              icon="fa-solid fa-location-dot"
            />
          </div>

          {/* Active Filter Summary & Reset Action */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-bold text-[11px]">Active Filters:</span>
                {selectedDomain !== 'ALL' && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    Domain: {selectedDomain}
                    <i onClick={() => setSelectedDomain('ALL')} className="fa-solid fa-xmark cursor-pointer hover:text-indigo-900"></i>
                  </span>
                )}
                {selectedExp !== 'ALL' && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    Exp: {selectedExp}
                    <i onClick={() => setSelectedExp('ALL')} className="fa-solid fa-xmark cursor-pointer hover:text-indigo-900"></i>
                  </span>
                )}
                {selectedWorkMode !== 'ALL' && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    Mode: {selectedWorkMode}
                    <i onClick={() => setSelectedWorkMode('ALL')} className="fa-solid fa-xmark cursor-pointer hover:text-indigo-900"></i>
                  </span>
                )}
                {selectedCity !== 'ALL' && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    City: {selectedCity}
                    <i onClick={() => setSelectedCity('ALL')} className="fa-solid fa-xmark cursor-pointer hover:text-indigo-900"></i>
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200">
                    Search: "{searchQuery}"
                    <i onClick={() => setSearchQuery('')} className="fa-solid fa-xmark cursor-pointer hover:text-indigo-900"></i>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-extrabold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600">
            Showing <strong className="text-slate-900 font-extrabold">{filteredJobs.length}</strong> matching verified openings
            {hasActiveFilters && <span className="text-slate-400 font-normal"> (Filtered from {jobs.length} total roles)</span>}
          </span>
        </div>

        {/* Jobs Grid (Redesigned with Clear Logos, Domains, and Dates) */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-bold">Loading live developer openings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-filter-circle-xmark"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900">No matching openings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or clearing some filters to explore more developer openings.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
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
                        onClick={() => setSelectedJob(job)}
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
        )}
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div 
          onClick={() => setSelectedJob(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-scale-in"
          >
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {selectedJob.companyLogo ? (
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    <img src={selectedJob.companyLogo} alt={selectedJob.companyName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getCompanyInitialBg(selectedJob.companyName)} text-white font-black flex items-center justify-center text-sm uppercase shrink-0`}>
                    {selectedJob.companyName.substring(0, 3)}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                    Domain: {selectedJob.domain || 'Full Stack & Core'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">{selectedJob.roleTitle}</h3>
                  <p className="text-xs text-slate-500 truncate">{selectedJob.companyName} • {selectedJob.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Salary Package</span>
                  <span className="font-black text-slate-900">{selectedJob.salaryRange || 'Competitive'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Experience Tier</span>
                  <span className="font-black text-slate-900">{selectedJob.experienceLevel || 'Fresher / 0-1 YOE'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Role Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {cleanJobDescription(selectedJob.description, selectedJob.roleTitle, selectedJob.companyName)}
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
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="text-xs font-bold text-slate-600 px-4 py-2 hover:bg-slate-200 rounded-xl cursor-pointer transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedJob(null);
                  setIsGatedModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
              >
                <i className="fa-solid fa-lock text-[10px]"></i> Claim Referral &amp; AI Pitch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GATED COHORT LEAD-GEN MODAL */}
      {isGatedModalOpen && (
        <div 
          onClick={() => setIsGatedModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 shadow-2xl text-center animate-scale-in"
          >
            {/* STICKY HEADER */}
            <div className="flex items-center justify-end p-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setIsGatedModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
                title="Close (Esc)"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
              <Link
                href="/courses"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition-colors"
              >
                Enroll in Fall 2026 Cohort &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold py-3 rounded-xl transition-colors"
              >
                Student Login
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sarcastic Fresher Reality Check Popup */}
      <FresherRealityCheckPopup />

      <Footer />
    </div>
  );
}
