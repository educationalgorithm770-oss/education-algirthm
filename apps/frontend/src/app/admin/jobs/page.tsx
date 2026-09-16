'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import { JOBS_DATA, JobListingItem } from '@/config/jobs-data';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface AdminReferralRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  studentName: string;
  studentEmail: string;
  enrolledTrack: string;
  resumeUrl?: string;
  pitch: string;
  status: 'Pending Review' | 'Referral Submitted' | 'Interview Scheduled' | 'Offer Placed' | 'Rejected';
  submittedAt: string;
  adminNotes?: string;
}

const DOMAIN_OPTIONS: Array<JobListingItem['domain']> = [
  'Java & Cloud',
  'Data Science & AI',
  'DevOps & SRE',
  'Full Stack & Core',
];

const PRESET_LOGOS = [
  { name: 'Amazon / AWS', url: 'https://cdn.simpleicons.org/amazon/FF9900' },
  { name: 'Google Cloud', url: 'https://cdn.simpleicons.org/google/4285F4' },
  { name: 'Microsoft Azure', url: 'https://cdn.simpleicons.org/microsoft/00A4EF' },
  { name: 'Flipkart', url: 'https://cdn.simpleicons.org/flipkart/2874F0' },
  { name: 'Swiggy', url: 'https://cdn.simpleicons.org/swiggy/FC8019' },
  { name: 'Atlassian', url: 'https://cdn.simpleicons.org/atlassian/0052CC' },
  { name: 'Uber', url: 'https://cdn.simpleicons.org/uber/000000' },
  { name: 'Stripe', url: 'https://cdn.simpleicons.org/stripe/635BFF' },
  { name: 'Netflix', url: 'https://cdn.simpleicons.org/netflix/E50914' },
  { name: 'Meta', url: 'https://cdn.simpleicons.org/meta/0668E1' },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobListingItem[]>(JOBS_DATA);
  const [referrals, setReferrals] = useState<AdminReferralRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'openings' | 'referrals'>('openings');
  
  // Search and Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('ALL');
  const [selectedReferralFilter, setSelectedReferralFilter] = useState<string>('ALL');
  const [referralStatusFilter, setReferralStatusFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');

  // Sync Telemetry State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusData, setSyncStatusData] = useState<any>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListingItem | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [viewingReferral, setViewingReferral] = useState<AdminReferralRecord | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Create / Edit
  const [formData, setFormData] = useState<Partial<JobListingItem>>({
    companyName: '',
    roleTitle: '',
    domain: 'Java & Cloud',
    location: 'Bangalore, India',
    workMode: 'Hybrid',
    salaryRange: '₹18 - 30 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Java', 'Spring Boot', 'AWS', 'Docker'],
    applyUrl: 'https://careers.google.com',
    referralAvailable: true,
    mentorName: 'Alumni Staff Engineer',
    mentorRole: 'Senior SRE & Mentor',
    description: '',
    requirements: ['Solid understanding of core data structures and distributed systems.', 'Hands-on experience with cloud deployment and microservices.'],
    companyLogo: 'https://cdn.simpleicons.org/amazon/FF9900',
    postedDate: 'Just now',
  });

  const [techStackInput, setTechStackInput] = useState('Java, Spring Boot, AWS, Docker');
  const [requirementsInput, setRequirementsInput] = useState('Solid understanding of core data structures and distributed systems.\nHands-on experience with cloud deployment and microservices.');

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.warn('Failed to fetch jobs from API, falling back to local storage', e);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/jobs/sync');
      const data = await res.json();
      if (data.success) {
        setSyncStatusData(data);
      }
    } catch (e) {
      console.warn('Failed to fetch sync status', e);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/jobs/referrals');
      const data = await res.json();
      if (data.success && Array.isArray(data.referrals)) {
        setReferrals(data.referrals);
      }
    } catch (e) {
      console.warn('Failed to fetch referrals from API', e);
    }
  };

  // Load Initial Data from API
  useEffect(() => {
    fetchJobs();
    fetchSyncStatus();
    fetchReferrals();

    // Poll status every 30s to keep countdown accurate
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Manual Trigger Ingestion from Internet
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    showToast('🌐 Contacting LinkedIn, Himalayas, Remotive, Arbeitnow & Jobicy...');
    try {
      const res = await fetch('/api/jobs/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 ${data.message}`);
        await fetchJobs();
        await fetchSyncStatus();
      } else {
        showToast(`Sync error: ${data.error || 'Failed'}`);
      }
    } catch (err: any) {
      showToast(`Sync request failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormData({
      companyName: '',
      roleTitle: '',
      domain: 'Java & Cloud',
      location: 'Bangalore, India',
      workMode: 'Hybrid',
      salaryRange: '₹18 - 30 LPA',
      experienceLevel: '2-5 YOE',
      applyUrl: 'https://careers.company.com',
      referralAvailable: true,
      mentorName: 'Staff SRE & Alumni',
      mentorRole: 'Alumni Tech Mentor',
      description: 'We are seeking an ambitious software engineer to join our high-scale product engineering team.',
      companyLogo: 'https://cdn.simpleicons.org/amazon/FF9900',
      postedDate: 'Just now',
    });
    setTechStackInput('Java, Spring Boot, AWS, Docker, Kubernetes');
    setRequirementsInput('Strong grasp of Data Structures and Algorithms.\nExperience building scalable REST APIs and microservices.\nFamiliarity with cloud platforms (AWS/GCP/Azure).');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (job: JobListingItem) => {
    setEditingJob(job);
    setFormData({ ...job });
    setTechStackInput(job.techStack.join(', '));
    setRequirementsInput(job.requirements.join('\n'));
    setIsFormModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const techStackArray = techStackInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const requirementsArray = requirementsInput
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    if (editingJob) {
      try {
        await fetch(`/api/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            techStack: techStackArray,
            requirements: requirementsArray,
          }),
        });
        showToast(`Job opening "${formData.roleTitle}" updated successfully!`);
        await fetchJobs();
      } catch (err: any) {
        showToast('Error updating job');
      }
    } else {
      try {
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            techStack: techStackArray,
            requirements: requirementsArray,
          }),
        });
        showToast(`New opening for "${formData.companyName}" published to live student job board!`);
        await fetchJobs();
      } catch (err: any) {
        showToast('Error creating job');
      }
    }

    setIsFormModalOpen(false);
  };

  // Toggle Referral Status directly
  const handleToggleReferral = async (jobId: string, currentVal: boolean) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralAvailable: !currentVal }),
      });
      showToast(currentVal ? 'Referral disabled for this role.' : 'Internal referral activated for students!');
      await fetchJobs();
    } catch (e) {}
  };

  // Delete Job
  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      showToast('Job opening removed from the database.');
      setDeletingJobId(null);
      await fetchJobs();
      await fetchSyncStatus();
    } catch (err) {
      showToast('Failed to delete job');
    }
  };

  // Reset Catalog / Re-run Sync
  const handleResetCatalog = async () => {
    if (confirm('Re-run internet sync pipeline across all verified sources (LinkedIn, Himalayas, Remotive, Arbeitnow, Jobicy)?')) {
      handleTriggerSync();
    }
  };

  // Update Referral Request Status
  const handleUpdateReferralStatus = async (refId: string, newStatus: AdminReferralRecord['status']) => {
    try {
      await fetch('/api/jobs/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: refId, status: newStatus }),
      });
      showToast(`Referral application marked as "${newStatus}"`);
      await fetchReferrals();
      if (viewingReferral && viewingReferral.id === refId) {
        setViewingReferral({ ...viewingReferral, status: newStatus });
      }
    } catch (e) {
      showToast('Error updating referral status');
    }
  };

  // Delete Referral Request
  const handleDeleteReferral = (refId: string) => {
    setReferrals(referrals.filter(r => r.id !== refId));
    if (viewingReferral?.id === refId) setViewingReferral(null);
    showToast('Student referral request archived.');
  };

  // Filtered Job Openings
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch =
        j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDomain = selectedDomain === 'ALL' || j.domain === selectedDomain;
      const matchesWorkMode = selectedWorkMode === 'ALL' || j.workMode === selectedWorkMode;
      const matchesReferral =
        selectedReferralFilter === 'ALL' ||
        (selectedReferralFilter === 'REFERRAL' && j.referralAvailable) ||
        (selectedReferralFilter === 'DIRECT' && !j.referralAvailable);
      const matchesSource =
        selectedSourceFilter === 'ALL' ||
        (j.source || 'Custom') === selectedSourceFilter;

      return matchesSearch && matchesDomain && matchesWorkMode && matchesReferral && matchesSource;
    });
  }, [jobs, searchQuery, selectedDomain, selectedWorkMode, selectedReferralFilter, selectedSourceFilter]);

  // Filtered Referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = referralStatusFilter === 'ALL' || r.status === referralStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [referrals, searchQuery, referralStatusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <AdminNavbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold border border-emerald-500 animate-slide-up">
          <i className="fa-solid fa-circle-check text-base"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16 w-full space-y-6">
        
        {/* Header Title & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl text-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                ⚙️ Placement &amp; Careers CMS
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>1-Hour Auto Ingestion Active</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-3">
              Tech Job Board &amp; Placement Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Continuously gathers live software engineering, cloud, AI, and DevOps jobs from the internet every 1 hour, standardizes tech tracks, and syncs to student portals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              title="Immediately scrape latest openings from LinkedIn, Unstop, Naukri & Wellfound"
            >
              <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
              <span>{isSyncing ? 'Syncing Internet Jobs...' : '⚡ Sync Jobs Now'}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Post Custom Opening</span>
            </button>
          </div>
        </div>

        {/* 1-Hour Automated Ingestion Telemetry Widget */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-black">
              <i className="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 font-extrabold text-sm">Automated Internet Ingestion Engine</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Every 1 Hour (0 * * * *)
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Next run in ~{syncStatusData?.scheduler?.minutesUntilNextRun ?? 55} mins &bull; Last run: {syncStatusData?.lastSync?.timestamp ? new Date(syncStatusData.lastSync.timestamp).toLocaleTimeString() : 'Recently'} ({syncStatusData?.lastSync?.inserted ?? 0} new added, {syncStatusData?.lastSync?.skipped ?? 0} refreshed)
              </p>
            </div>
          </div>

          {/* Sources Breakdown Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
              <i className="fa-brands fa-linkedin mr-1 text-blue-600"></i> LinkedIn ({syncStatusData?.breakdown?.linkedin ?? 0})
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
              <i className="fa-solid fa-graduation-cap mr-1 text-indigo-600"></i> Unstop Campus ({syncStatusData?.breakdown?.unstop ?? 0})
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
              <i className="fa-solid fa-briefcase mr-1 text-amber-600"></i> Naukri ({syncStatusData?.breakdown?.naukri ?? 0})
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
              <i className="fa-solid fa-rocket mr-1 text-rose-600"></i> Wellfound Startups ({syncStatusData?.breakdown?.wellfound ?? 0})
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
              <i className="fa-solid fa-handshake mr-1 text-emerald-600"></i> Partner / Custom ({syncStatusData?.breakdown?.partner ?? 0})
            </span>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Openings</p>
              <p className="text-2xl font-black text-slate-900">{jobs.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold">
              <i className="fa-solid fa-handshake-angle"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referral Enabled</p>
              <p className="text-2xl font-black text-purple-700">{jobs.filter(j => j.referralAvailable).length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Requests</p>
              <p className="text-2xl font-black text-emerald-700">{referrals.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xl font-bold">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-black text-amber-700">{referrals.filter(r => r.status === 'Pending Review').length}</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('openings')}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'openings'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <i className="fa-solid fa-table-list"></i>
                <span>Active Tech Openings ({jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <i className="fa-solid fa-user-check"></i>
                <span>Referral Review Desk ({referrals.length})</span>
                {referrals.filter(r => r.status === 'Pending Review').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-1"></span>
                )}
              </button>
            </div>

            {/* Quick Preview Links */}
            <Link
              href="/dashboard/jobs"
              target="_blank"
              className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              <span>View Student-facing Board</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </Link>
          </div>

          {/* Filtering Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder={activeTab === 'openings' ? 'Search by company, title, tech stack...' : 'Search student name, email, role...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Filters for Tech Openings Tab */}
            {activeTab === 'openings' && (
              <>
                <CustomDropdown
                  value={selectedDomain}
                  onChange={(val) => setSelectedDomain(val)}
                  options={[
                    { value: 'ALL', label: 'All Domains' },
                    ...DOMAIN_OPTIONS.map(d => ({ value: d, label: d })),
                  ]}
                  theme="light"
                  size="sm"
                />

                <CustomDropdown
                  value={selectedWorkMode}
                  onChange={(val) => setSelectedWorkMode(val)}
                  options={[
                    { value: 'ALL', label: 'All Work Modes' },
                    { value: 'Remote', label: 'Remote', icon: '🌐' },
                    { value: 'Hybrid', label: 'Hybrid', icon: '🏢' },
                    { value: 'Onsite', label: 'Onsite', icon: '📍' },
                  ]}
                  theme="light"
                  size="sm"
                />

                <CustomDropdown
                  value={selectedReferralFilter}
                  onChange={(val) => setSelectedReferralFilter(val)}
                  options={[
                    { value: 'ALL', label: 'All Application Types' },
                    { value: 'REFERRAL', label: 'Internal Referral Only', icon: '⚡' },
                    { value: 'DIRECT', label: 'Direct Portal Only', icon: '🔗' },
                  ]}
                  theme="light"
                  size="sm"
                />

                <CustomDropdown
                  value={selectedSourceFilter}
                  onChange={(val) => setSelectedSourceFilter(val)}
                  options={[
                    { value: 'ALL', label: `All Sources (${jobs.length})` },
                    { value: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
                    { value: 'Unstop', label: 'Unstop Campus', icon: '🎓' },
                    { value: 'Naukri', label: 'Naukri', icon: '🏢' },
                    { value: 'Wellfound', label: 'Wellfound Startups', icon: '🚀' },
                    { value: 'Partner', label: 'Partner Drives', icon: '🤝' },
                    { value: 'Custom', label: 'Admin Custom', icon: '⭐' },
                  ]}
                  theme="light"
                  size="sm"
                />
              </>
            )}

            {/* Filters for Referral Desk Tab */}
            {activeTab === 'referrals' && (
              <CustomDropdown
                value={referralStatusFilter}
                onChange={(val) => setReferralStatusFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Review Statuses' },
                  { value: 'Pending Review', label: 'Pending Review', icon: '⏳' },
                  { value: 'Referral Submitted', label: 'Referral Submitted', icon: '📤' },
                  { value: 'Interview Scheduled', label: 'Interview Scheduled', icon: '📅' },
                  { value: 'Offer Placed', label: 'Offer Placed', icon: '🎉' },
                  { value: 'Rejected', label: 'Rejected', icon: '❌' },
                ]}
                theme="light"
                size="sm"
              />
            )}
          </div>
        </div>

        {/* TAB 1: TECH OPENINGS MANAGEMENT */}
        {activeTab === 'openings' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Active Tech Openings ({filteredJobs.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live openings automatically gathered and synced from LinkedIn, Unstop, Naukri, Wellfound &amp; Partners.</p>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <i className="fa-solid fa-folder-open text-4xl text-slate-300"></i>
                <p className="text-slate-500 font-bold text-sm">No tech openings match your filter criteria.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedDomain('ALL'); setSelectedWorkMode('ALL'); setSelectedReferralFilter('ALL'); setSelectedSourceFilter('ALL'); }}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Company &amp; Role</th>
                      <th className="py-3.5 px-6">Domain &amp; Stack</th>
                      <th className="py-3.5 px-6">Compensation</th>
                      <th className="py-3.5 px-6">Work Mode / Loc</th>
                      <th className="py-3.5 px-6">Referral Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition">
                        {/* Company & Role */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
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
                                <i className={`${job.companyLogo} text-indigo-600 text-lg`}></i>
                              ) : (
                                <i className="fa-solid fa-building text-indigo-600 text-base"></i>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 transition">
                                  {job.roleTitle}
                                </span>
                                {job.source && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {job.source}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-xs font-semibold">{job.companyName}</p>
                            </div>
                          </div>
                        </td>

                        {/* Domain & Stack */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-bold text-[11px] block w-fit mb-1.5">
                            {job.domain}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {job.techStack.slice(0, 3).map((tech, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {tech}
                              </span>
                            ))}
                            {job.techStack.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">+{job.techStack.length - 3}</span>
                            )}
                          </div>
                        </td>

                        {/* Compensation */}
                        <td className="py-4 px-6">
                          <div className="font-black text-emerald-700 text-sm">{job.salaryRange}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{job.postedDate || 'Active'}</div>
                        </td>

                        {/* Work Mode & Location */}
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] inline-block mb-1 ${
                            job.workMode === 'Remote'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.workMode === 'Hybrid'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {job.workMode}
                          </span>
                          <div className="text-slate-500 text-xs truncate max-w-[140px]" title={job.location}>
                            {job.location}
                          </div>
                        </td>

                        {/* Referral Status Toggle */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleReferral(job.id, job.referralAvailable)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                              job.referralAvailable
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle alumni referral status"
                          >
                            <i className={`fa-solid ${job.referralAvailable ? 'fa-toggle-on text-purple-600' : 'fa-toggle-off'}`}></i>
                            <span>{job.referralAvailable ? 'Referral Active' : 'Direct Apply'}</span>
                          </button>
                          {job.referralAvailable && job.mentorName && (
                            <div className="text-[10px] text-purple-700 mt-1 truncate max-w-[130px]" title={job.mentorName}>
                              👤 {job.mentorName}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(job)}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition cursor-pointer"
                              title="Edit Opening"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
                              title="Visit Direct Career Link"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                            </a>
                            <button
                              onClick={() => setDeletingJobId(job.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Delete Opening"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT REFERRAL REVIEW DESK */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Student Referral Applications Review ({filteredReferrals.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verify student cohort track records, review resumes, and dispatch internal alumni referrals.</p>
              </div>
            </div>

            {filteredReferrals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <i className="fa-solid fa-clipboard-check text-4xl text-slate-300"></i>
                <p className="text-slate-500 font-bold text-sm">No referral requests found matching current filter.</p>
                <button
                  onClick={() => { setSearchQuery(''); setReferralStatusFilter('ALL'); }}
                  className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Student Scholar</th>
                      <th className="py-3.5 px-6">Target Role &amp; Company</th>
                      <th className="py-3.5 px-6">Enrolled Track</th>
                      <th className="py-3.5 px-6">Application Pitch &amp; Resume</th>
                      <th className="py-3.5 px-6">Review Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition">
                        {/* Student */}
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-slate-900 text-sm">{ref.studentName}</div>
                          <div className="text-slate-500 text-xs">{ref.studentEmail}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(ref.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Target Role */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-indigo-700 text-sm">{ref.jobTitle}</div>
                          <div className="text-slate-500 text-xs font-semibold">{ref.company}</div>
                        </td>

                        {/* Enrolled Track */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-bold text-[11px]">
                            {ref.enrolledTrack}
                          </span>
                        </td>

                        {/* Pitch & Resume */}
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-slate-600 text-xs line-clamp-2 italic">
                            &quot;{ref.pitch}&quot;
                          </p>
                          {ref.resumeUrl && (
                            <a
                              href={ref.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-1.5"
                            >
                              <i className="fa-solid fa-file-pdf"></i>
                              <span>View Candidate Resume</span>
                            </a>
                          )}
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-4 px-6">
                          <select
                            value={ref.status}
                            onChange={e => handleUpdateReferralStatus(ref.id, e.target.value as AdminReferralRecord['status'])}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border focus:outline-none transition ${
                              ref.status === 'Offer Placed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : ref.status === 'Interview Scheduled'
                                ? 'bg-sky-50 text-sky-700 border-sky-300'
                                : ref.status === 'Referral Submitted'
                                ? 'bg-purple-50 text-purple-700 border-purple-300'
                                : ref.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            <option value="Pending Review">Pending Review</option>
                            <option value="Referral Submitted">Referral Submitted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer Placed">Offer Placed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setViewingReferral(ref)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                              title="View Full Application Details"
                            >
                              <i className="fa-solid fa-eye text-xs"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteReferral(ref.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition cursor-pointer"
                              title="Archive / Remove Request"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ================= MODAL: CREATE / EDIT TECH OPENING ================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                  <i className={`fa-solid ${editingJob ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingJob ? 'Edit Tech Job Opening' : 'Post New Tech Job Opening'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Published roles appear immediately on the student job board.</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="jobForm" onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon AWS, Google"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                {/* Role Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior DevOps & Cloud Engineer"
                    value={formData.roleTitle}
                    onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Logo Quick Select or URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo URL / Quick Icon</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, companyLogo: preset.url, companyName: formData.companyName || preset.name.split(' ')[0] })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <img src={preset.url} alt={preset.name} className="w-3.5 h-3.5 object-contain" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="https://cdn.simpleicons.org/company/color"
                  value={formData.companyLogo}
                  onChange={e => setFormData({ ...formData, companyLogo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Domain Track */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domain Track</label>
                  <select
                    value={formData.domain}
                    onChange={e => setFormData({ ...formData, domain: e.target.value as JobListingItem['domain'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  >
                    {DOMAIN_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Work Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={e => setFormData({ ...formData, workMode: e.target.value as JobListingItem['workMode'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  >
                    <option value="0-2 YOE">0-2 YOE (Entry Level)</option>
                    <option value="1-3 YOE">1-3 YOE (Associate)</option>
                    <option value="2-5 YOE">2-5 YOE (Mid-Level SDE)</option>
                    <option value="4-8 YOE">4-8 YOE (Senior / Staff)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Salary Range */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Range / CTC *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18 - 30 LPA"
                    value={formData.salaryRange}
                    onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore, India"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Tech Stack (comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Java, Spring Boot, AWS, Docker"
                  value={techStackInput}
                  onChange={e => setTechStackInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Referral Toggle & Mentor Details */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900">Enable Alumni Referral Pipeline</span>
                    <p className="text-[11px] text-purple-700 font-medium">Allows students to request direct referrals from assigned company mentors.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.referralAvailable}
                    onChange={e => setFormData({ ...formData, referralAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                </div>

                {formData.referralAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-purple-200">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Mentor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Staff SRE & Alumni"
                        value={formData.mentorName}
                        onChange={e => setFormData({ ...formData, mentorName: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">Mentor Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Alumni Tech Mentor"
                        value={formData.mentorRole}
                        onChange={e => setFormData({ ...formData, mentorRole: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Apply URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Direct Career Page URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://careers.company.com"
                  value={formData.applyUrl}
                  onChange={e => setFormData({ ...formData, applyUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Description / Mission</label>
                <textarea
                  rows={2}
                  placeholder="Provide an engaging summary of the opening..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Requirements (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Strong grasp of Data Structures and Algorithms.&#10;Hands-on experience with REST APIs and cloud architecture."
                  value={requirementsInput}
                  onChange={e => setRequirementsInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-3.5 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="jobForm"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-cloud-arrow-up text-[11px]"></i>
                <span>{editingJob ? 'Save Changes' : 'Publish Opening'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingJobId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-xl mx-auto">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Delete Tech Opening?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This opening will be immediately removed from the live student job board.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingJobId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Keep Opening
              </button>
              <button
                onClick={() => handleDeleteJob(deletingJobId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REFERRAL APPLICATION DETAILS ================= */}
      {viewingReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/80">
              <div>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-[10px] font-black uppercase">
                  Referral Dossier
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{viewingReferral.studentName}</h3>
                <p className="text-xs text-slate-500">{viewingReferral.studentEmail}</p>
              </div>
              <button
                onClick={() => setViewingReferral(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold text-[11px]">Target Position</span>
                  <p className="font-extrabold text-slate-900 text-xs mt-0.5">{viewingReferral.jobTitle}</p>
                  <p className="text-slate-500 text-[11px]">{viewingReferral.company}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-bold text-[11px]">Enrolled Cohort</span>
                  <p className="font-extrabold text-indigo-600 text-xs mt-0.5">{viewingReferral.enrolledTrack}</p>
                  <p className="text-slate-400 text-[10px]">Applied {new Date(viewingReferral.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Candidate Referral Pitch</span>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 mt-1.5 leading-relaxed italic text-xs">
                  &quot;{viewingReferral.pitch}&quot;
                </div>
              </div>

              {viewingReferral.resumeUrl && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <i className="fa-solid fa-file-pdf text-indigo-600 text-base"></i>
                    <span className="font-bold text-indigo-950 text-xs">Student Resume &amp; Portfolio</span>
                  </div>
                  <a
                    href={viewingReferral.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    Open Resume
                  </a>
                </div>
              )}

              {/* Status Manager */}
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Update Application Status</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {(['Pending Review', 'Referral Submitted', 'Interview Scheduled', 'Offer Placed', 'Rejected'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateReferralStatus(viewingReferral.id, st)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition cursor-pointer ${
                        viewingReferral.status === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                onClick={() => handleDeleteReferral(viewingReferral.id)}
                className="px-3 py-1.5 text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
                <span>Archive Request</span>
              </button>

              <button
                onClick={() => setViewingReferral(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
