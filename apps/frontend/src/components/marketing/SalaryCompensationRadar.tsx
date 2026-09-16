'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TierData {
  tierName: string;
  tag: string;
  salaryRange: string;
  targetCompanies: string[];
  requiredSkills: string[];
  hiringFocus: string;
  interviewStages: string;
}

const TIERS: TierData[] = [
  {
    tierName: 'Tier-1 Product & Concurrency Systems',
    tag: 'Elite SDE Track',
    salaryRange: '₹14 – ₹38 LPA',
    targetCompanies: ['Cisco', 'Google', 'Amazon', 'Razorpay', 'Swiggy'],
    requiredSkills: ['Java 21 Virtual Threads', 'Kafka Event Sourcing', 'Redis Redlock', 'Distributed Sharding', 'System Design'],
    hiringFocus: 'Concurreny race condition safety, latency budgets under 20ms, and resilient fault recovery.',
    interviewStages: '4 Rounds (OA -> Live Concurrency Coding -> System Architecture Defense -> Bar Raiser)',
  },
  {
    tierName: 'High-Growth Startups & Fintech',
    tag: 'Full Stack & Cloud',
    salaryRange: '₹8 – ₹18 LPA',
    targetCompanies: ['Persistent', 'Linedata', 'Rapid7', 'Fintech Scaleups'],
    requiredSkills: ['Spring Boot 3', 'Docker Multi-stage', 'PostgreSQL Row Locks', 'Next.js / React 19', 'REST API Contracts'],
    hiringFocus: 'Production-ready codebases, clean architectural separation, and automated CI/CD pipelines.',
    interviewStages: '3 Rounds (Machine Coding -> Architecture Q&A -> Founder/Engineering Manager)',
  },
  {
    tierName: 'Enterprise Cadres & Campus Drives',
    tag: 'Fresher Trainee Track',
    salaryRange: '₹4.5 – ₹9 LPA',
    targetCompanies: ['Capgemini', 'Wipro', 'TCS Prime', 'Infosys Specialist'],
    requiredSkills: ['Core Java OOP', 'SQL Queries & Joins', 'Data Structures (Trees/Graphs)', 'Git Workflows', 'Linux Basics'],
    hiringFocus: 'Algorithmic fundamentals, problem solving aptitude, and clean coding practices.',
    interviewStages: '2-3 Rounds (National Assessment -> Technical Coding -> HR/Managerial)',
  },
];

export default function SalaryCompensationRadar() {
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);
  const tier = TIERS[selectedTierIdx];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-indigo-600 text-xs font-black uppercase tracking-widest block mb-1">
            Compensation &amp; Career ROI Explorer
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Indian Tech Salary Benchmark by Technical Depth
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            See how mastering Java 21, Concurrency, and System Design multiplies entry-level CTC.
          </p>
        </div>

        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TIERS.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTierIdx(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedTierIdx === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Tier Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <div className="space-y-3">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
            {tier.tag}
          </span>
          <h4 className="text-lg font-black text-slate-900">{tier.tierName}</h4>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Package Range</span>
            <span className="text-2xl font-black text-indigo-600">{tier.salaryRange}</span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Target Companies</span>
            <div className="flex flex-wrap gap-1.5">
              {tier.targetCompanies.map((c, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Required Technology Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {tier.requiredSkills.map((s, idx) => (
              <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                {s}
              </span>
            ))}
          </div>
          <div className="pt-2 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Hiring Manager Focus</span>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">{tier.hiringFocus}</p>
          </div>
        </div>

        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Interview Gauntlet</span>
            <p className="text-xs text-slate-800 font-bold leading-relaxed">{tier.interviewStages}</p>
          </div>

          <Link
            href="/courses"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-xs transition-colors block"
          >
            Target This Salary Tier &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
