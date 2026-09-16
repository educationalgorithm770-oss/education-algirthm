'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import { SITE_DATA, AlumniCaseStudy, TransparencyFAQ } from '@/config/site-data';

export default function OutcomesPage() {
  // Calculator state
  const [backgroundType, setBackgroundType] = useState<'service' | 'qa' | 'fresher' | 'support' | 'junior_dev'>('service');
  const [targetTrack, setTargetTrack] = useState<'java' | 'genai' | 'devops'>('java');
  const [currentCompensation, setCurrentCompensation] = useState<number>(4.5);

  // Active Category filter for Case Studies
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Realistic ROI calculation engine
  const calculationResult = useMemo(() => {
    let baseMultiplier = 2.2;
    let expectedMonths = 5;
    let baselineCap = 12;

    if (backgroundType === 'fresher') {
      baseMultiplier = 2.0;
      expectedMonths = 6;
      baselineCap = 8.5;
    } else if (backgroundType === 'qa' || backgroundType === 'support') {
      baseMultiplier = 2.4;
      expectedMonths = 5;
      baselineCap = 13.5;
    } else if (backgroundType === 'service') {
      baseMultiplier = 2.5;
      expectedMonths = 5;
      baselineCap = 15.0;
    } else if (backgroundType === 'junior_dev') {
      baseMultiplier = 2.1;
      expectedMonths = 4;
      baselineCap = 18.0;
    }

    if (targetTrack === 'genai') {
      baselineCap += 1.5;
    } else if (targetTrack === 'devops') {
      baselineCap += 1.0;
    }

    const projectedLow = Math.round(Math.max(currentCompensation * (baseMultiplier - 0.3), baselineCap - 2.5));
    const projectedHigh = Math.round(Math.max(currentCompensation * (baseMultiplier + 0.4), baselineCap + 3.0));
    const expectedHike = Math.round((((projectedLow + projectedHigh) / 2 - currentCompensation) / (currentCompensation || 1)) * 100);

    return {
      rangeText: `₹${projectedLow} - ₹${projectedHigh} LPA`,
      medianText: `₹${Math.round((projectedLow + projectedHigh) / 2)} LPA`,
      hikeText: `+${Math.max(expectedHike, 80)}%`,
      timelineMonths: expectedMonths,
      weeklyHours: '12-15 hrs/week',
      keyMilestones: targetTrack === 'java'
        ? ['Distributed Redis Rate Limiter', 'Kafka Event Settlement Pipeline', 'Spring Security 6 RBAC Microservices']
        : targetTrack === 'genai'
        ? ['Autonomous RAG Multi-Agent Pipeline', 'Vector DB Similarity Benchmarking', 'FastAPI LLM Microservice']
        : ['Kubernetes ArgoCD GitOps Pipeline', 'Prometheus & Grafana Alerting', 'Terraform Multi-Cloud Deployment'],
    };
  }, [backgroundType, targetTrack, currentCompensation]);

  // Filtered case studies
  const filteredStudies = useMemo(() => {
    return SITE_DATA.alumniCaseStudies.filter((cs: AlumniCaseStudy) => {
      const matchCategory = selectedCategory === 'All' || cs.companyCategory === selectedCategory;
      const matchSearch =
        cs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.hiringCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.previousCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cs.capstoneProject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-indigo-600 selection:text-white">
      <HeaderNavbar />

      {/* 1. HERO SECTION: CRISP & PROFESSIONAL */}
      <section className="relative pt-16 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 border-b border-slate-200 overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audited 2025–2026 Engineering Placement Report</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-950">
            Real Engineering Transitions.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Zero Marketing Hype.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            We don&apos;t promise magical shortcuts or fake guarantees. Our graduates land top product and enterprise roles because they build production distributed microservices, write clean concurrent code, and clear rigorous architecture interviews.
          </p>

          {/* Quick Transparency Metric Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold text-slate-700">
            <span className="px-4 py-2 bg-white border border-slate-200/90 rounded-2xl flex items-center space-x-2 shadow-xs hover:border-slate-300 transition">
              <i className="fa-solid fa-code text-indigo-600"></i>
              <span>100% Portfolio-Driven Proof of Work</span>
            </span>
            <span className="px-4 py-2 bg-white border border-slate-200/90 rounded-2xl flex items-center space-x-2 shadow-xs hover:border-slate-300 transition">
              <i className="fa-solid fa-clipboard-check text-emerald-600"></i>
              <span>Verified Offer Letters & Slips</span>
            </span>
            <span className="px-4 py-2 bg-white border border-slate-200/90 rounded-2xl flex items-center space-x-2 shadow-xs hover:border-slate-300 transition">
              <i className="fa-solid fa-shield-check text-cyan-600"></i>
              <span>7-Day No-Questions-Asked Refund Guarantee</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. REALISTIC SALARY & PLACEMENT BENCHMARKS */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <span className="text-indigo-600 text-xs font-black uppercase tracking-wider">Audited Compensation Bands</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Transparent Salary Distribution by Experience</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Honest compensation breakdowns across distinct career experience brackets in the Indian & global tech hiring market.
          </p>
        </div>

        {/* 3-Tier Grid in Light Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SITE_DATA.salaryBands.map((band, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-6 hover:shadow-lg hover:border-indigo-300 transition relative overflow-hidden group shadow-sm flex flex-col justify-between"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${band.colorScheme}`} />

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{band.experience}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-700">Audited Band</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{band.tier}</h3>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Salary Range</div>
                    <div className="text-2xl font-black text-slate-900">{band.salaryRange}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">Median Package:</span>
                    <span className="text-emerald-600 font-black font-mono text-sm">{band.medianCTC}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Typical Placed Roles</div>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {band.commonRoles.map((role, rIdx) => (
                      <li key={rIdx} className="flex items-center space-x-2">
                        <i className="fa-solid fa-circle-check text-[11px] text-indigo-600 shrink-0"></i>
                        <span>{role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Stats Summary Bar in Light Mode */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="space-y-1 p-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{SITE_DATA.stats.placementRate}</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Placement Success Rate</div>
            <div className="text-[10px] text-slate-500 max-w-[200px] mx-auto">For students completing &ge;80% capstones</div>
          </div>
          <div className="space-y-1 p-2">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">{SITE_DATA.stats.medianPackage}</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Cohort Median CTC</div>
            <div className="text-[10px] text-slate-500">Across all tech specializations</div>
          </div>
          <div className="space-y-1 p-2">
            <div className="text-2xl sm:text-3xl font-black text-cyan-600 font-mono">{SITE_DATA.stats.averageHike}</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Average Salary Growth</div>
            <div className="text-[10px] text-slate-500">Service-to-product switchers</div>
          </div>
          <div className="space-y-1 p-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">180 Days</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Placement Window</div>
            <div className="text-[10px] text-slate-500">With internal partner referrals</div>
          </div>
        </div>
      </section>

      {/* 3. MULTI-FACTOR CAREER & ROI ESTIMATOR */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="px-3.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider">
              Diagnostic Career Tool
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Realistic Career Transition & Skill-Gap Blueprint</h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
              Select your current background and target track to receive realistic compensation projections, timeline estimates, and mandatory milestone projects.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls (7 cols) in Light Mode */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-md">
              {/* Control 1: Background */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>1. Your Current Background</span>
                  <span className="text-[11px] text-indigo-600 font-bold">Select Starting Point</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'service', label: 'IT Services Dev', icon: 'fa-building' },
                    { id: 'qa', label: 'QA / Automation', icon: 'fa-bug' },
                    { id: 'fresher', label: 'College Fresher', icon: 'fa-graduation-cap' },
                    { id: 'support', label: 'IT Support / Ops', icon: 'fa-headset' },
                    { id: 'junior_dev', label: 'Junior SDE (1-2y)', icon: 'fa-code' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBackgroundType(item.id as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col space-y-1.5 transition ${
                        backgroundType === item.id
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-sm ${backgroundType === item.id ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                      <span className="font-extrabold text-[11px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 2: Target Specialization */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>2. Target Engineering Specialization</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'java', label: 'Java 21 & Distributed Microservices' },
                    { id: 'genai', label: 'Data Science & GenAI Agents' },
                    { id: 'devops', label: 'Cloud DevOps & Kubernetes' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetTrack(item.id as any)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        targetTrack === item.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 3: Current Salary Slider */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-700">3. Current Annual Compensation:</span>
                  <span className="text-emerald-600 font-mono font-black text-base sm:text-lg">
                    {currentCompensation === 0 ? 'Fresher (₹0 LPA)' : `₹${currentCompensation} LPA`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.5"
                  value={currentCompensation}
                  onChange={(e) => setCurrentCompensation(parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                  <span>₹0 (Fresher)</span>
                  <span>₹6 LPA (Service Mid)</span>
                  <span>₹18 LPA (Senior)</span>
                </div>
              </div>
            </div>

            {/* Results Blueprint Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden border border-indigo-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target Career Projection</span>
                <h3 className="text-xl font-black text-white">Realistic Outcome Blueprint</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-center">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Package</div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{calculationResult.rangeText}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Projected Growth</div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">{calculationResult.hikeText}</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300">
                  <span className="font-bold flex items-center space-x-1.5">
                    <i className="fa-solid fa-clock text-indigo-400"></i>
                    <span>Required Timeline:</span>
                  </span>
                  <span className="font-mono font-black text-white">{calculationResult.timelineMonths} Months</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300">
                  <span className="font-bold flex items-center space-x-1.5">
                    <i className="fa-solid fa-calendar-check text-cyan-400"></i>
                    <span>Weekly Commitment:</span>
                  </span>
                  <span className="font-mono font-black text-white">{calculationResult.weeklyHours}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <i className="fa-solid fa-microchip text-emerald-400"></i>
                  <span>Mandatory Capstones Required:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {calculationResult.keyMilestones.map((m, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-[11px]">
                      <i className="fa-solid fa-arrow-right text-[10px] text-indigo-400 mt-1 shrink-0"></i>
                      <span className="font-medium text-slate-200">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/courses"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Explore Matching Cohort Curriculum</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFIED ALUMNI ENGINEERING CASE STUDIES (LIGHT MODE) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-indigo-600 text-xs font-black uppercase tracking-wider">Detailed Transition Case Studies</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">How Our Students Cleared Top SDE Loops</h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
              Inspect actual background starting points, GitHub capstones built, interview rounds passed, and verified offers.
            </p>
          </div>

          {/* Search bar in Light Mode */}
          <div className="relative w-full md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search by company, tech, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-extrabold">
          {['All', 'Enterprise GCC', 'Fintech', 'High-Growth Product', 'SaaS'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl border transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Case Studies Grid in Light Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudies.map((cs: AlumniCaseStudy) => (
            <div
              key={cs.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5 hover:shadow-lg hover:border-indigo-300 transition group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-4">
                {/* Header: Avatar, Name, Company & Hike */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cs.avatarBg} text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                      {cs.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-black text-slate-900 text-base truncate">{cs.name}</h4>
                        <i className="fa-solid fa-circle-check text-emerald-600 text-xs" title="Verified Offer"></i>
                      </div>
                      <p className="text-xs text-slate-600 font-bold truncate">
                        {cs.targetRole} at <strong className="text-indigo-600 font-extrabold">{cs.hiringCompany}</strong>
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black font-mono shrink-0">
                    +{cs.hikePercentage} Hike
                  </span>
                </div>

                {/* Transition Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-bold">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <span>{cs.previousRole} ({cs.previousCompany})</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500">{cs.previousSalary}</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-[10px] text-indigo-600"></i>
                  <div className="flex items-center space-x-2 text-slate-900">
                    <span className="font-black text-emerald-600 font-mono">{cs.newSalary}</span>
                    <span className="text-[10px] text-slate-500">({cs.timelineMonths} mo grind)</span>
                  </div>
                </div>

                {/* Capstone Project Showcase */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center space-x-1.5">
                    <i className="fa-solid fa-laptop-code"></i>
                    <span>Primary Capstone Built</span>
                  </div>
                  <p className="text-xs text-slate-800 font-bold leading-snug">
                    {cs.capstoneProject}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cs.capstoneTech.map((t, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interview Rounds Focus */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <i className="fa-solid fa-bullseye text-cyan-600"></i>
                    <span>Interview Focus Areas Cleared:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cs.interviewFocus.map((f, fIdx) => (
                      <span key={fIdx} className="px-2.5 py-1 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded-lg text-[10px] font-bold">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-slate-600 text-xs italic leading-relaxed pt-1">
                  &ldquo;{cs.storyQuote}&rdquo;
                </p>
              </div>

              {/* Card Footer: Verified Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>{cs.verifiedBatch}</span>
                <span className="text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 font-extrabold">
                  {cs.companyCategory}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CAPSTONE PROOF OF WORK SHOWCASE (LIGHT MODE) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/60 border-y border-slate-200 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2">
          <span className="text-emerald-700 text-xs font-black uppercase tracking-wider">Proof of Work Architecture</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">What You Build Replaces 3+ Years of Generic Resume Filler</h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Hiring managers evaluate code depth. Every student completes enterprise-grade architectures that survive high concurrency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SITE_DATA.capstoneShowcases.map((cap) => (
            <div
              key={cap.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md font-bold">
                    {cap.difficulty}
                  </span>
                  <span className="text-slate-500 font-mono text-[10px] font-bold">{cap.track}</span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.subtitle}</p>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="text-[10px] font-black uppercase text-indigo-700">Architecture Core:</div>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-mono">{cap.architectureHighlight}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {cap.techStack.map((tech, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-mono text-slate-700 font-bold">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {cap.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-mono font-bold">
                      <i className="fa-solid fa-bolt text-[10px]"></i>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CATEGORIZED HIRING ECOSYSTEM (LIGHT MODE) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2">
          <span className="text-indigo-600 text-xs font-black uppercase tracking-wider">Hiring Partner Network</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Companies Actively Interviewing Our Cohort Graduates</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Categorized across high-volume hiring sectors: Fintechs, Enterprise GCCs, and high-velocity product startups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SITE_DATA.hiringPartnerCategories.map((cat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md hover:border-slate-300 transition">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base">{cat.category}</h3>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {cat.partners.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3 text-xs font-extrabold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                  >
                    <i className={`${p.icon} text-indigo-600 text-sm w-5 text-center`}></i>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TRANSPARENT BILL OF RIGHTS & FAQ (LIGHT MODE) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-t border-slate-200 max-w-5xl mx-auto w-full space-y-10">
        <div className="text-center space-y-2">
          <span className="text-indigo-600 text-xs font-black uppercase tracking-wider">The Transparent Promise</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Frequently Asked Questions & Truths</h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            No small-print traps. Direct answers to the most common questions engineers ask before enrolling.
          </p>
        </div>

        <div className="space-y-3">
          {SITE_DATA.transparencyFaqs.map((faq: TransparencyFAQ, idx: number) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-black uppercase shrink-0">
                    {faq.category}
                  </span>
                  <h4 className="font-black text-sm text-slate-900 truncate">{faq.question}</h4>
                </div>
                <i className={`fa-solid fa-chevron-down text-xs text-slate-500 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-indigo-600' : ''}`}></i>
              </button>

              {openFaqIndex === idx && (
                <div className="p-5 pt-0 text-xs text-slate-700 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. HIGH-CONVERSION BOTTOM CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-8 sm:p-12 border border-indigo-700 shadow-2xl text-center space-y-6 text-white relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-4xl font-black">Ready to Build Real Engineering Proof of Work?</h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Join the next cohort, solve 120+ live coding challenges in our Docker sandboxes, and get internal referral access to top product teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/courses"
              className="px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <span>Explore Flagship Engineering Cohorts</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
            <Link
              href="/jobs"
              className="px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition"
            >
              Check 780+ Live SDE Openings
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
