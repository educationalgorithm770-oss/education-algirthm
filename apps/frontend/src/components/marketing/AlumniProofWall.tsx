'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SITE_DATA, AlumniCaseStudy } from '@/config/site-data';

export default function AlumniProofWall() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStoryModal, setActiveStoryModal] = useState<AlumniCaseStudy | null>(null);

  const categories = ['All', 'Fintech', 'Enterprise GCC', 'High-Growth Product', 'SaaS'];

  const alumniList = SITE_DATA.alumniCaseStudies || [];

  const filteredAlumni = selectedCategory === 'All'
    ? alumniList
    : alumniList.filter((a) => a.companyCategory === selectedCategory);

  return (
    <section className="py-14 sm:py-20 px-3 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold uppercase tracking-wider">
              <i className="fa-solid fa-trophy text-amber-500"></i>
              <span>Alumni Placement Wall Of Fame</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              From Service Companies &amp; Freshers to <span className="text-blue-600">Product SDEs</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              Every transition is verified with GitHub capstone repositories, pull request logs, and company offer letters.
            </p>
          </div>

          {/* Placement Metric Summary */}
          <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Average CTC</div>
              <div className="text-base sm:text-lg font-black text-slate-900 font-mono">₹14.2 LPA</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Average Hike</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">+148%</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Placement SLA</div>
              <div className="text-base sm:text-lg font-black text-blue-600 font-mono">89.2%</div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat} {cat === 'All' ? `(${alumniList.length})` : ''}
            </button>
          ))}
        </div>

        {/* Alumni Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alum) => (
            <div
              key={alum.id}
              className="bg-slate-50 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 p-6 flex flex-col justify-between space-y-5 relative group"
            >
              {/* Header with Photo & Name */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="relative shrink-0">
                      {alum.imageUrl ? (
                        <img
                          src={alum.imageUrl}
                          alt={alum.name}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-md"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${alum.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-md`}>
                          {alum.initials}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">
                        <i className="fa-solid fa-check"></i>
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {alum.name}
                      </h3>
                      <div className="text-xs text-blue-700 font-bold">
                        {alum.targetRole}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Hired by <strong className="text-slate-800 font-bold">{alum.hiringCompany}</strong>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800 text-[10px] font-mono font-bold shrink-0">
                    {alum.companyCategory}
                  </span>
                </div>

                {/* Salary Hike Card */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Transition Path:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[11px] font-mono border border-emerald-200">
                      +{alum.hikePercentage} Hike
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 line-through">{alum.previousSalary}</span>
                    <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
                    <span className="text-base font-black text-blue-600">{alum.newSalary}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Was: <span className="text-slate-600 font-medium">{alum.previousRole}</span> @ {alum.previousCompany}
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-xs text-slate-600 italic leading-relaxed bg-slate-100/70 p-3 rounded-xl border border-slate-200/60 line-clamp-3">
                  &quot;{alum.storyQuote}&quot;
                </blockquote>

                {/* Capstone Focus */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Verified Production Capstone:
                  </div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">
                    {alum.capstoneProject}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {alum.capstoneTech.slice(0, 3).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[9px] font-mono font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                    {alum.capstoneTech.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-mono">
                        +{alum.capstoneTech.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Verification Footer */}
              <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                  <i className="fa-solid fa-certificate text-emerald-600 text-[10px]"></i>
                  <span>{alum.verifiedBatch}</span>
                </span>
                <button
                  onClick={() => setActiveStoryModal(alum)}
                  className="text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  Full Story
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-black text-white">
              Ready to create your own verifiable career switch?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Apply for the Fall 2026 cohort and get mentored 1-on-1 by staff engineers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/courses"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-blue-600/30"
            >
              Explore Cohort Syllabus
            </Link>
            <Link
              href="/about"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm border border-slate-700 transition"
            >
              Verify Placement Audit
            </Link>
          </div>
        </div>

      </div>

      {/* Full Case Study Detail Modal */}
      {activeStoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setActiveStoryModal(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {activeStoryModal.imageUrl ? (
                  <img
                    src={activeStoryModal.imageUrl}
                    alt={activeStoryModal.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${activeStoryModal.avatarBg} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                    {activeStoryModal.initials}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {activeStoryModal.name}
                  </h3>
                  <div className="text-sm text-blue-600 font-bold">
                    {activeStoryModal.targetRole} @ {activeStoryModal.hiringCompany}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {activeStoryModal.verifiedBatch}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveStoryModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Compensation & Timeline Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Previous CTC</div>
                <div className="text-sm font-bold text-slate-700">{activeStoryModal.previousSalary}</div>
                <div className="text-[9px] text-slate-400">{activeStoryModal.previousCompany}</div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-bold">New Verified CTC</div>
                <div className="text-base font-black text-blue-600">{activeStoryModal.newSalary}</div>
                <div className="text-[9px] text-emerald-600 font-bold">+{activeStoryModal.hikePercentage} Hike</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Prep Timeline</div>
                <div className="text-sm font-bold text-slate-800">{activeStoryModal.timelineMonths} Months</div>
                <div className="text-[9px] text-slate-400">Weekend Cohort</div>
              </div>
            </div>

            {/* Detailed Story */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Transition Journey &amp; Mentorship Impact
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-200">
                &quot;{activeStoryModal.storyQuote}&quot;
              </p>
            </div>

            {/* Capstone Architecture */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Verified Production Capstone
              </h4>
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 font-mono text-xs">
                <div className="text-blue-400 font-bold">{activeStoryModal.capstoneProject}</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeStoryModal.capstoneTech.map((tech, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Interview Focus Areas */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Technical Interview Focus Cleared
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeStoryModal.interviewFocus.map((focus, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-100">
                    ✓ {focus}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Offer Letter Verified on Blockchain</span>
              <button
                onClick={() => setActiveStoryModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Close Case Study
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
