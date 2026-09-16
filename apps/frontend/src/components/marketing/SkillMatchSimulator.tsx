'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface SkillOption {
  id: string;
  name: string;
  category: 'core' | 'framework' | 'advanced' | 'cloud';
  weight: number;
}

const AVAILABLE_SKILLS: SkillOption[] = [
  { id: 'java', name: 'Core Java / OOP', category: 'core', weight: 15 },
  { id: 'spring', name: 'Spring Boot 3', category: 'framework', weight: 15 },
  { id: 'sql', name: 'SQL & Database Indexing', category: 'core', weight: 10 },
  { id: 'react', name: 'React / Next.js', category: 'framework', weight: 10 },
  { id: 'concurrency', name: 'Java 21 Virtual Threads & Concurrency', category: 'advanced', weight: 20 },
  { id: 'kafka', name: 'Kafka Event Sourcing', category: 'advanced', weight: 15 },
  { id: 'docker', name: 'Docker & Microservices', category: 'cloud', weight: 10 },
  { id: 'redis', name: 'Redis Caching & Distributed Locks', category: 'advanced', weight: 10 },
  { id: 'system_design', name: 'System Design & High Throughput', category: 'advanced', weight: 15 },
  { id: 'aws', name: 'AWS Cloud Deployment', category: 'cloud', weight: 10 },
];

export default function SkillMatchSimulator() {
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(['java', 'sql', 'react']);
  const [isGatedModalOpen, setIsGatedModalOpen] = useState(false);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const analysis = useMemo(() => {
    const totalWeight = AVAILABLE_SKILLS.reduce((acc, s) => acc + s.weight, 0);
    const selectedWeight = AVAILABLE_SKILLS.filter((s) =>
      selectedSkillIds.includes(s.id)
    ).reduce((acc, s) => acc + s.weight, 0);

    const matchPercent = Math.min(100, Math.round((selectedWeight / totalWeight) * 100));

    // Calculate eligible jobs out of 789
    const eligibleJobs = Math.round((matchPercent / 100) * 789);

    // Calculate potential salary tier
    let avgSalary = '₹4.5 – ₹6.5 LPA';
    let tierTitle = 'Junior Entry Level';
    if (matchPercent >= 75) {
      avgSalary = '₹16 – ₹32 LPA';
      tierTitle = 'Tier-1 High Throughput SDE';
    } else if (matchPercent >= 50) {
      avgSalary = '₹9 – ₹16 LPA';
      tierTitle = 'Specialist Software Engineer';
    } else if (matchPercent >= 30) {
      avgSalary = '₹6.5 – ₹10 LPA';
      tierTitle = 'Associate Developer';
    }

    // Missing critical skills
    const missingHighValue = AVAILABLE_SKILLS.filter(
      (s) => !selectedSkillIds.includes(s.id) && s.weight >= 15
    );

    return {
      matchPercent,
      eligibleJobs,
      avgSalary,
      tierTitle,
      missingHighValue,
    };
  }, [selectedSkillIds]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/40 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">
              <i className="fa-solid fa-crosshairs text-emerald-400 animate-pulse"></i>
              <span>Live ATS Skill-Match &amp; Salary Simulator</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Test Your Current Profile Against 780+ Live Tech Openings
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Select your current skills to calculate instant market match, salary ceiling, and missing architectural modules.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-indigo-950/80 px-4 py-2 rounded-2xl border border-indigo-700/50 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black text-indigo-200">789 Openings Indexed</span>
          </div>
        </div>

        {/* Skill Pills Selection */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block">
            Step 1: Click the skills you currently master:
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SKILLS.map((skill) => {
              const isSelected = selectedSkillIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105 border border-indigo-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      isSelected ? 'fa-circle-check text-emerald-300' : 'fa-circle-plus text-slate-400'
                    } text-xs`}
                  ></i>
                  <span>{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Match Calculation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Match Score */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-indigo-900/50 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Market Match Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{analysis.matchPercent}%</span>
              <span className="text-xs text-indigo-300 font-bold">{analysis.tierTitle}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${analysis.matchPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Eligible Jobs */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-indigo-900/50 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Eligible Live Roles
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{analysis.eligibleJobs}</span>
              <span className="text-xs text-slate-300 font-medium">/ 789 Openings</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Matches your selected tech stack across Bengaluru, Hyderabad &amp; Pune.
            </p>
          </div>

          {/* Card 3: Salary Potential */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-indigo-900/50 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Potential CTC Bracket
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{analysis.avgSalary}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {analysis.matchPercent >= 70
                ? 'High-throughput concurrency unlocked!'
                : 'Boostable to ₹18+ LPA by adding Concurrency & Kafka.'}
            </p>
          </div>
        </div>

        {/* Skill Gap Fast-Track Callout */}
        {analysis.missingHighValue.length > 0 && (
          <div className="bg-indigo-900/40 border border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-300 text-xs font-black">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>High-Value Skill Gaps Identified:</span>
              </div>
              <p className="text-xs text-slate-300">
                Unlock top-tier ₹14–₹32 LPA openings by adding:{' '}
                <strong className="text-white">
                  {analysis.missingHighValue.map((s) => s.name).join(' • ')}
                </strong>
              </p>
            </div>

            <Link
              href="/courses"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all shrink-0 text-center"
            >
              Bridge Skill Gaps in 16 Weeks &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
