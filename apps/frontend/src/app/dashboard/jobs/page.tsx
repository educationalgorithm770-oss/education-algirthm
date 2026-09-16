'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import { JOBS_DATA, JobListingItem } from '@/config/jobs-data';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface TrackedApplication {
  id: string;
  jobId: string;
  companyName: string;
  roleTitle: string;
  salaryRange: string;
  location: string;
  status: 'Referral Requested' | 'Applied' | 'Interviewing' | 'Offer Received';
  appliedDate: string;
  resumeUrl?: string;
  referralPitch?: string;
  mentorName?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListingItem[]>(JOBS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState<'ALL' | 'Java & Cloud' | 'Data Science & AI' | 'DevOps & SRE' | 'Full Stack & Core'>('ALL');
  const [selectedExp, setSelectedExp] = useState('ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState<'ALL' | 'Remote' | 'Hybrid' | 'Onsite'>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('ALL');
  const [onlyReferral, setOnlyReferral] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'salary_high' | 'exp_low'>('newest');
  const [activeTab, setActiveTab] = useState<'openings' | 'applications' | 'bookmarks'>('openings');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  // Persistence State
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>([]);
  const [trackedApplications, setTrackedApplications] = useState<TrackedApplication[]>([]);
  
  // Modals State
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobListingItem | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobListingItem | null>(null);
  
  // Referral Application Form State
  const [referralFormData, setReferralFormData] = useState({
    enrolledTrack: 'Java Full Stack & Cloud Engineering',
    resumeUrl: '',
    githubLinkedInUrl: '',
    pitch: '',
  });
  const [toastMessage, setToastMessage] = useState('');

  // Close modals on Escape key and prevent background body scrolling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedJobForDetails(null);
        setSelectedJobForModal(null);
      }
    }
    if (selectedJobForDetails || selectedJobForModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedJobForDetails, selectedJobForModal]);

  const handleGenerateAIPitch = async () => {
    if (!selectedJobForModal) return;
    try {
      setIsGeneratingPitch(true);
      const res = await fetch('/api/jobs/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobForModal.id,
          companyName: selectedJobForModal.companyName,
          roleTitle: selectedJobForModal.roleTitle,
          enrolledTrack: referralFormData.enrolledTrack,
          pitchNotes: referralFormData.pitch,
        }),
      });
      const data = await res.json();
      if (data.success && data.pitch) {
        setReferralFormData((prev) => ({ ...prev, pitch: data.pitch }));
        showToast('✨ AI generated personalized referral pitch!');
      }
    } catch {
      showToast('Could not generate AI pitch. Please write manually.');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  useEffect(() => {
    // 1. Fetch live jobs from API
    const fetchLiveJobs = async () => {
      try {
        const res = await fetch('/api/jobs?limit=1000');
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      } catch (e) {
        console.warn('Using default job data', e);
      }
    };
    fetchLiveJobs();

    // 2. Load saved bookmarks
    const savedBookmarks = localStorage.getItem('ea_job_bookmarks');
    if (savedBookmarks) {
      try { setBookmarkedJobIds(JSON.parse(savedBookmarks)); } catch (e) {}
    }

    // 3. Load tracked applications
    const savedApps = localStorage.getItem('ea_tracked_applications');
    if (savedApps) {
      try { setTrackedApplications(JSON.parse(savedApps)); } catch (e) {}
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const toggleBookmark = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarkedJobIds.includes(jobId)) {
      updated = bookmarkedJobIds.filter(id => id !== jobId);
      showToast('Removed job from bookmarks.');
    } else {
      updated = [...bookmarkedJobIds, jobId];
      showToast('Saved role to bookmarked opportunities!');
    }
    setBookmarkedJobIds(updated);
    localStorage.setItem('ea_job_bookmarks', JSON.stringify(updated));
  };

  const handleOpenReferralModal = (job: JobListingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobForModal(job);
    setReferralFormData({
      enrolledTrack: 'Java Full Stack & Cloud Engineering',
      resumeUrl: '',
      githubLinkedInUrl: '',
      pitch: `I have completed production capstone projects in ${job.techStack.slice(0, 3).join(', ')} with high performance benchmarks. Would appreciate an internal referral for this opening!`,
    });
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForModal) return;

    const newApp: TrackedApplication = {
      id: 'app_' + Date.now(),
      jobId: selectedJobForModal.id,
      companyName: selectedJobForModal.companyName,
      roleTitle: selectedJobForModal.roleTitle,
      salaryRange: selectedJobForModal.salaryRange,
      location: selectedJobForModal.location,
      status: selectedJobForModal.referralAvailable ? 'Referral Requested' : 'Applied',
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      resumeUrl: referralFormData.resumeUrl || 'Uploaded in AI Resume Studio',
      referralPitch: referralFormData.pitch,
      mentorName: selectedJobForModal.mentorName,
    };

    const updatedApps = [newApp, ...trackedApplications.filter(a => a.jobId !== selectedJobForModal.id)];
    setTrackedApplications(updatedApps);
    localStorage.setItem('ea_tracked_applications', JSON.stringify(updatedApps));

    // Submit referral directly to MySQL backend
    try {
      await fetch('/api/jobs/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobForModal.id,
          jobTitle: selectedJobForModal.roleTitle,
          company: selectedJobForModal.companyName,
          studentName: 'Active Scholar',
          studentEmail: 'student@example.com',
          enrolledTrack: referralFormData.enrolledTrack,
          resumeUrl: referralFormData.resumeUrl,
          githubLinkedInUrl: referralFormData.githubLinkedInUrl,
          pitch: referralFormData.pitch,
        }),
      });
    } catch (err) {
      console.warn('Backend referral submission fallback:', err);
    }

    const targetUrl = selectedJobForModal.applyUrl;
    setSelectedJobForModal(null);
    showToast(`Application tracked! Referral request dispatched to ${newApp.mentorName || 'Alumni Mentor'}.`);

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  // Filtered and Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.roleTitle.toLowerCase().includes(q);
        const matchesCompany = job.companyName.toLowerCase().includes(q);
        const matchesLoc = job.location.toLowerCase().includes(q);
        const matchesTech = job.techStack.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesLoc && !matchesTech) return false;
      }

      // City Filter
      if (selectedCity !== 'ALL') {
        const cLower = selectedCity.toLowerCase();
        const locLower = job.location.toLowerCase();
        if (selectedCity === 'Remote') {
          if (!locLower.includes('remote') && job.workMode !== 'Remote') return false;
        } else if (selectedCity === 'Delhi-NCR') {
          if (!locLower.includes('delhi') && !locLower.includes('noida') && !locLower.includes('gurugram') && !locLower.includes('gurgaon') && !locLower.includes('ncr')) return false;
        } else {
          if (!locLower.includes(cLower)) return false;
        }
      }

      // Domain
      if (selectedDomain !== 'ALL' && job.domain !== selectedDomain) return false;

      // Experience
      if (selectedExp !== 'ALL') {
        if (selectedExp === 'FRESHER') {
          const isFresher = /fresher|0-1|0-2|intern|trainee|graduate|entry|campus|2024|2025|2026/i.test(job.experienceLevel);
          if (!isFresher) return false;
        } else if (selectedExp === 'MID') {
          const isMid = /1-3|2-4|2-5|mid/i.test(job.experienceLevel) && !/fresher|intern|trainee/i.test(job.experienceLevel);
          if (!isMid) return false;
        } else if (selectedExp === 'SENIOR') {
          const isSenior = /3\+|4-8|5\+|senior|lead|principal|architect/i.test(job.experienceLevel);
          if (!isSenior) return false;
        } else if (job.experienceLevel !== selectedExp) {
          return false;
        }
      }

      // Work Mode
      if (selectedWorkMode !== 'ALL' && job.workMode !== selectedWorkMode) return false;

      // Source Filter
      if (selectedSourceFilter !== 'ALL' && (job.source || 'Custom') !== selectedSourceFilter) return false;

      // Referral only
      if (onlyReferral && !job.referralAvailable) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'salary_high') {
        const getSal = (s: string) => {
          const match = s.match(/₹?(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getSal(b.salaryRange) - getSal(a.salaryRange);
      }
      if (sortBy === 'exp_low') {
        return a.experienceLevel.localeCompare(b.experienceLevel);
      }
      return 0; // default newest order
    });
  }, [jobs, searchQuery, selectedCity, selectedDomain, selectedExp, selectedWorkMode, selectedSourceFilter, onlyReferral, sortBy]);

  const bookmarkedJobsList = useMemo(() => {
    return jobs.filter(j => bookmarkedJobIds.includes(j.id));
  }, [jobs, bookmarkedJobIds]);

  const totalReferralsCount = useMemo(() => {
    return jobs.filter(j => j.referralAvailable).length;
  }, [jobs]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-slide-up">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition flex items-center space-x-1.5">
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Back to Student Hub</span>
            </Link>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase tracking-wider">
              💼 Career Acceleration Desk
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Curated SDE &amp; AI Tech Openings
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
                Direct hiring pipelines &amp; verified internal employee referrals across top product companies and hyper-growth unicorns.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-center flex-1 min-w-[80px] sm:min-w-[100px]">
                <div className="text-lg sm:text-xl font-black text-indigo-600">{jobs.length}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">Live Roles</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-center flex-1 min-w-[80px] sm:min-w-[100px]">
                <div className="text-lg sm:text-xl font-black text-purple-600">{totalReferralsCount}</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">Referral Slots</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-center flex-1 min-w-[80px] sm:min-w-[100px]">
                <div className="text-lg sm:text-xl font-black text-emerald-600">₹48 LPA</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">Avg Max CTC</div>
              </div>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveTab('openings')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'openings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-briefcase"></i>
              <span>Openings ({filteredJobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'applications'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-paper-plane"></i>
              <span>Tracked ({trackedApplications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-bookmark"></i>
              <span>Saved ({bookmarkedJobIds.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">

        {/* Tab 1: All Openings View */}
        {activeTab === 'openings' && (
          <div className="space-y-6">
            {/* Search & Multi-Filter Control Console */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              {/* Search Bar + Sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-0">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roles, tech stack..."
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <CustomDropdown
                    value={sortBy}
                    onChange={(val) => setSortBy(val as any)}
                    labelPrefix="SORT:"
                    options={[
                      { value: 'newest', label: 'Newest First', icon: '⚡' },
                      { value: 'salary_high', label: 'Highest Salary', icon: '💰' },
                      { value: 'exp_low', label: 'Experience Level', icon: '🎓' },
                    ]}
                    theme="light"
                  />

                  <button
                    onClick={() => setOnlyReferral(!onlyReferral)}
                    className={`px-3 py-2 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                      onlyReferral
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <i className="fa-solid fa-bolt text-[11px]"></i>
                    <span>Referrals</span>
                  </button>
                </div>
              </div>

            {/* City Hubs Filter */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 w-full">
              <span className="text-[10px] font-black uppercase text-slate-400 me-1">Tech Hub:</span>
              {[
                { id: 'ALL', label: '🇮🇳 All India' },
                { id: 'Bengaluru', label: 'Bengaluru' },
                { id: 'Hyderabad', label: 'Hyderabad' },
                { id: 'Pune', label: 'Pune' },
                { id: 'Delhi-NCR', label: 'Delhi-NCR' },
                { id: 'Mumbai', label: 'Mumbai' },
                { id: 'Chennai', label: 'Chennai' },
                { id: 'Remote', label: 'Remote India' },
              ].map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCity === city.id
                      ? 'bg-slate-900 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>

            {/* Domain & Experience Filters */}
            <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
              {/* Domain Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 me-1">Domain:</span>
                {(['ALL', 'Java & Cloud', 'Data Science & AI', 'DevOps & SRE', 'Full Stack & Core'] as const).map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setSelectedDomain(dom)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedDomain === dom
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>

              {/* Experience Filters */}
              <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 me-1">Experience:</span>
                {[
                  { id: 'ALL', label: 'All Levels' },
                  { id: 'FRESHER', label: '🎓 Freshers (0-1 YOE)' },
                  { id: 'MID', label: '⚡ Mid-Level (1-3 YOE)' },
                  { id: 'SENIOR', label: '🚀 Senior (3+ YOE)' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedExp(tier.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedExp === tier.id
                        ? 'bg-slate-900 text-white shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Work Mode & Source Filter */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 me-1">Mode:</span>
                  {(['ALL', 'Remote', 'Hybrid', 'Onsite'] as const).map((wm) => (
                    <button
                      key={wm}
                      onClick={() => setSelectedWorkMode(wm)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedWorkMode === wm
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {wm}
                    </button>
                  ))}
                </div>

                {/* Source Filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 me-1">Source:</span>
                  {['ALL', 'LinkedIn', 'Naukri', 'Instahyre', 'Unstop', 'Wellfound', 'Partner'].map((src) => (
                    <button
                      key={src}
                      onClick={() => setSelectedSourceFilter(src)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        selectedSourceFilter === src
                          ? 'bg-indigo-600 text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings Feed */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 w-full">
              <i className="fa-solid fa-briefcase text-4xl text-slate-300"></i>
              <h3 className="text-base font-extrabold text-slate-800">No matching openings found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try broadening your search query or reset your experience and domain filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('ALL');
                  setSelectedDomain('ALL');
                  setSelectedExp('ALL');
                  setSelectedWorkMode('ALL');
                  setSelectedSourceFilter('ALL');
                  setOnlyReferral(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {filteredJobs.map((job) => {
                const isBookmarked = bookmarkedJobIds.includes(job.id);
                const isTracked = trackedApplications.some(a => a.jobId === job.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobForDetails(job)}
                    className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 cursor-pointer group w-full overflow-hidden"
                  >
                    {/* Left: Role Info */}
                    <div className="space-y-3 flex-1 min-w-0 w-full">
                      <div className="flex items-start space-x-3 sm:space-x-3.5 w-full min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-slate-100 p-1 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                          {job.companyLogo && (job.companyLogo.startsWith('http://') || job.companyLogo.startsWith('https://') || job.companyLogo.startsWith('data:') || job.companyLogo.startsWith('/')) ? (
                            <img
                              src={job.companyLogo}
                              alt={job.companyName}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : job.companyLogo && job.companyLogo.includes('fa-') ? (
                            <i className={`${job.companyLogo} text-indigo-600`}></i>
                          ) : (
                            <i className="fa-solid fa-building text-indigo-600 text-base sm:text-lg"></i>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                              {job.domain}
                            </span>
                            {job.source && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {job.source}
                              </span>
                            )}
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] font-mono text-slate-400">{job.postedDate}</span>
                          </div>
                          <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {job.roleTitle}
                          </h3>
                          <div className="text-xs text-slate-600 font-bold mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span>{job.companyName}</span>
                            <span>&bull;</span>
                            <span className="text-slate-500 font-medium truncate max-w-[150px] sm:max-w-none">{job.location}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {job.workMode}
                            </span>
                          </div>
                        </div>
                      </div>

                        {/* Badges Strip */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black flex items-center space-x-1">
                            <span>💰</span>
                            <span>{job.salaryRange}</span>
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">
                            {job.experienceLevel}
                          </span>
                          {job.referralAvailable && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-extrabold flex items-center space-x-1">
                              <i className="fa-solid fa-bolt text-[10px]"></i>
                              <span>Internal Referral Available</span>
                            </span>
                          )}
                          {job.mentorName && (
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                              Mentor: {job.mentorName}
                            </span>
                          )}
                        </div>

                        {/* Tech Stack Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {job.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-mono font-bold border border-slate-200"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-2.5 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <button
                          onClick={(e) => toggleBookmark(job.id, e)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs transition ${
                            isBookmarked
                              ? 'bg-amber-50 border-amber-300 text-amber-500'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark role'}
                        >
                          <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark`}></i>
                        </button>

                        <button
                          onClick={(e) => handleOpenReferralModal(job, e)}
                          className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 ${
                            isTracked
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isTracked ? (
                            <>
                              <i className="fa-solid fa-check text-[11px]"></i>
                              <span>Application Tracked</span>
                            </>
                          ) : (
                            <>
                              <span>{job.referralAvailable ? 'Request Referral & Apply' : 'Direct Apply'}</span>
                              <i className="fa-solid fa-arrow-right text-[10px]"></i>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tracked Applications View */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Tracked Referral &amp; Job Applications</h2>
                <p className="text-xs text-slate-500">Live tracker of all tech openings you have applied to or requested internal referrals for.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black">
                {trackedApplications.length} Active
              </span>
            </div>

            {trackedApplications.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <i className="fa-solid fa-paper-plane text-4xl text-slate-300"></i>
                <h3 className="text-base font-extrabold text-slate-800">No applications tracked yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Browse curated openings and click &quot;Request Referral &amp; Apply&quot; to track your candidacy and interview pipeline here.
                </p>
                <button
                  onClick={() => setActiveTab('openings')}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Explore Tech Roles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trackedApplications.map((app) => (
                  <div key={app.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{app.appliedDate}</span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">{app.roleTitle}</h3>
                        <div className="text-xs text-slate-600 font-bold">{app.companyName} • {app.location}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        app.status === 'Referral Requested'
                          ? 'bg-purple-100 text-purple-800'
                          : app.status === 'Interviewing'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'Offer Received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Salary: <strong className="text-slate-800">{app.salaryRange}</strong></span>
                        {app.mentorName && <span>Referral Mentor: <strong className="text-indigo-600">{app.mentorName}</strong></span>}
                      </div>
                      {app.referralPitch && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic pt-1 border-t border-slate-200/60">
                          &quot;{app.referralPitch}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bookmarked Roles View */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Saved Tech Opportunities</h2>
                <p className="text-xs text-slate-500">Quick access to roles you have shortlisted for later review.</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black">
                {bookmarkedJobsList.length} Saved
              </span>
            </div>

            {bookmarkedJobsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <i className="fa-regular fa-bookmark text-4xl text-slate-300"></i>
                <h3 className="text-base font-extrabold text-slate-800">No saved roles</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the bookmark icon on any job card to save it for quick review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarkedJobsList.map((job) => (
                  <div key={job.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                        <i className={job.companyLogo}></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{job.roleTitle}</h4>
                        <div className="text-xs text-slate-500 font-medium">{job.companyName} • {job.salaryRange}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => toggleBookmark(job.id, e)}
                        className="p-2 text-slate-400 hover:text-red-500 text-xs"
                        title="Remove bookmark"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <button
                        onClick={(e) => handleOpenReferralModal(job, e)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs"
                      >
                        Apply Now &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: Request Internal Referral & Application Dispatch */}
      {selectedJobForModal && (
        <div 
          onClick={() => setSelectedJobForModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden animate-scale-in"
          >
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                  {selectedJobForModal.referralAvailable ? 'Internal Employee Referral Request' : 'Direct Application'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {selectedJobForModal.roleTitle}
                </h3>
                <div className="text-xs text-slate-500 font-bold truncate">
                  {selectedJobForModal.companyName} • <span className="text-emerald-600 font-black">{selectedJobForModal.salaryRange}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForModal(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSubmitReferral} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {/* Enrolled Track Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Enrolled Course Track</label>
                  <select
                    value={referralFormData.enrolledTrack}
                    onChange={(e) => setReferralFormData({ ...referralFormData, enrolledTrack: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Java Full Stack & Cloud Engineering">Java Full Stack &amp; Cloud Engineering</option>
                    <option value="Data Science, Machine Learning & GenAI">Data Science, Machine Learning &amp; GenAI</option>
                    <option value="DevOps & Multi-Cloud Architecture">DevOps &amp; Multi-Cloud Architecture</option>
                  </select>
                </div>

                {/* Resume / Portfolio Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">
                    Resume / Portfolio URL <span className="text-slate-400 font-normal">(Google Drive, GitHub, or ATS PDF)</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={referralFormData.resumeUrl}
                    onChange={(e) => setReferralFormData({ ...referralFormData, resumeUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... or GitHub link"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Referral Pitch */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700">
                      Referral Note to Mentor <span className="text-slate-400 font-normal">(Highlight capstone projects)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAIPitch}
                      disabled={isGeneratingPitch}
                      className="text-[11px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingPitch ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
                          <span>AI Drafting...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-purple-600"></i>
                          <span>⚡ Auto-Generate with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={referralFormData.pitch}
                    onChange={(e) => setReferralFormData({ ...referralFormData, pitch: e.target.value })}
                    placeholder="Explain why you are a great fit for this role..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                {selectedJobForModal.mentorName && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center space-x-3 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <i className="fa-solid fa-user-check"></i>
                    </div>
                    <div>
                      <div className="font-extrabold text-purple-900">Mentor: {selectedJobForModal.mentorName}</div>
                      <div className="text-[11px] text-purple-700">{selectedJobForModal.mentorRole || 'Verified Alumni Referral'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY FOOTER */}
              <div className="flex items-center justify-end space-x-2 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedJobForModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Submit &amp; Open Portal ↗</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Job Details Slide-over */}
      {selectedJobForDetails && (
        <div 
          onClick={() => setSelectedJobForDetails(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-scale-in"
          >
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
              <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0 shadow-xs overflow-hidden">
                  {selectedJobForDetails.companyLogo && (selectedJobForDetails.companyLogo.startsWith('http') || selectedJobForDetails.companyLogo.startsWith('/')) ? (
                    <img src={selectedJobForDetails.companyLogo} alt={selectedJobForDetails.companyName} className="max-w-full max-h-full object-contain" />
                  ) : selectedJobForDetails.companyLogo && selectedJobForDetails.companyLogo.includes('fa-') ? (
                    <i className={selectedJobForDetails.companyLogo}></i>
                  ) : (
                    <i className="fa-solid fa-briefcase text-indigo-600"></i>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                    {selectedJobForDetails.roleTitle}
                  </h3>
                  <div className="text-xs text-slate-600 font-bold mt-0.5 truncate">
                    {selectedJobForDetails.companyName} &bull; {selectedJobForDetails.location} &bull; <span className="text-emerald-600 font-black">{selectedJobForDetails.salaryRange}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForDetails(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Role Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Role Overview</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {selectedJobForDetails.description}
                </p>
              </div>

              {/* Requirements */}
              {selectedJobForDetails.requirements && selectedJobForDetails.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Key Technical Requirements</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 list-disc list-inside">
                    {selectedJobForDetails.requirements.map((req, i) => (
                      <li key={i} className="leading-relaxed">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack Required */}
              {selectedJobForDetails.techStack && selectedJobForDetails.techStack.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tech Stack &amp; Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJobForDetails.techStack.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-bold border border-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={(e) => toggleBookmark(selectedJobForDetails.id, e)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <i className={`fa-${bookmarkedJobIds.includes(selectedJobForDetails.id) ? 'solid' : 'regular'} fa-bookmark text-amber-500`}></i>
                <span>{bookmarkedJobIds.includes(selectedJobForDetails.id) ? 'Saved' : 'Save for Later'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  const targetJob = selectedJobForDetails;
                  setSelectedJobForDetails(null);
                  handleOpenReferralModal(targetJob, e);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{selectedJobForDetails.referralAvailable ? 'Request Referral & Apply' : 'Direct Apply'}</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
