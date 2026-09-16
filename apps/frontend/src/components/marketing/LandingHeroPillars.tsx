'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HeroCohortShowcase from '@/components/features/HeroCohortShowcase';
import PlatformComparisonModal from './PlatformComparisonModal';
import JobReadinessQuizModal from './JobReadinessQuizModal';
import { SITE_DATA } from '@/config/site-data';

export default function LandingHeroPillars() {
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  return (
    <>
      {/* Modals */}
      <PlatformComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        onOpenQuiz={() => setShowQuizModal(true)}
      />
      <JobReadinessQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />

      {/* Hero Section — Crisp Clean Light Aesthetic */}
      <section className="relative pt-8 sm:pt-12 pb-14 sm:pb-20 px-3 sm:px-6 lg:px-8 bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] sm:text-sm font-extrabold uppercase tracking-wider shadow-2xs">
              <i className="fa-solid fa-shield-halved text-indigo-600 text-xs"></i>
              <span>{SITE_DATA.company.tagline}</span>
            </div>

            {/* Master Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
              Build Your Skills.<br />
              Build Your Career.<br />
              <span className="text-indigo-600">Get Ready for the Job.</span>
            </h1>

            {/* Job-Outcome Focused Subtext */}
            <p className="text-slate-600 text-xs sm:text-base lg:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              The complete engineering-to-employment accelerator. Master <strong className="text-slate-900 font-bold">Java 21 Virtual Threads</strong>, <strong className="text-slate-900 font-bold">Distributed Microservices</strong>, and <strong className="text-slate-900 font-bold">Placement Aptitude</strong> with automated Docker code sandboxes, motion concept labs, and RAG AI mock interviews.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 sm:pt-2 w-full sm:w-auto">
              <Link
                href="/courses"
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                <span>Explore Cohort Syllabus</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>
              
              <button
                onClick={() => setShowQuizModal(true)}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-extrabold text-xs sm:text-sm border border-amber-200 transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <i className="fa-solid fa-bullseye text-amber-600 text-sm"></i>
                <span>2-Min Job Readiness Quiz</span>
              </button>

              <button
                onClick={() => setShowComparisonModal(true)}
                className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-200 transition flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-scale-balanced text-indigo-600 text-sm"></i>
                <span>See How We Compare</span>
              </button>
            </div>

            {/* Live Cohort & Placement Status */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-[11px] sm:text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-800 font-bold">Fall 2026 Batch Active</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div>Average Package: <strong className="text-indigo-600 font-extrabold">₹14.5 LPA</strong></div>
              <span className="hidden sm:inline">•</span>
              <div>Format: <strong className="text-emerald-700 font-extrabold">Live Interactive + AI Sandbox</strong></div>
            </div>
          </div>

          {/* Right Column: Hero Cohort Showcase */}
          <div className="lg:col-span-6 w-full">
            <HeroCohortShowcase />
          </div>

        </div>
      </section>

      {/* 3-PILLAR VISUAL TRANSFORMATION CARDS (THE ROADMAP TO GETTING HIRED) */}
      <section className="py-12 sm:py-16 px-3 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          <div className="text-center space-y-2.5 max-w-3xl mx-auto px-2">
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
              The 3-Phase Acceleration Blueprint
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              From First Line of Code to Your <span className="text-indigo-600">Dream Offer Letter</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-base font-normal leading-relaxed">
              Every phase is engineered with live execution tools, AI evaluators, and production architectures so you never stay stuck.
            </p>
          </div>

          {/* 3 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: BUILD YOUR SKILLS */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-sm font-black font-mono">
                    01
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Live Sandboxes
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <span>Build Your Skills</span>
                    <i className="fa-solid fa-bolt text-amber-500 text-xs"></i>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Interactive Docker-based code sandbox & 7 zero-algebra aptitude visualizers.
                  </p>
                </div>

                {/* UI Preview Box: Code Editor Mockup */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="ml-1 text-slate-300">PaymentService.java</span>
                    </span>
                    <span className="text-indigo-400">Java 21 LTS</span>
                  </div>
                  <div className="space-y-0.5 text-slate-300 text-[10px]">
                    <p><span className="text-purple-400">@Transactional</span></p>
                    <p><span className="text-blue-400">public void</span> executePayment() &#123;</p>
                    <p className="pl-3 text-slate-400">{"// Redis Distributed Lock"}</p>
                    <p className="pl-3"><span className="text-emerald-400">redisLock</span>.lockInterruptibly();</p>
                    <p>&#125;</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 flex items-center justify-between text-[10px] font-bold">
                    <span>✓ 5/5 Hidden Tests Passed</span>
                    <span className="font-mono text-emerald-400">0.04s</span>
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="text-xs text-slate-600 space-y-2 font-medium">
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-indigo-600 text-[10px]"></i>
                    <span>Java 21 Virtual Threads & Spring Boot 3</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-indigo-600 text-[10px]"></i>
                    <span>7 Motion Concept Labs (Relative Speed, Venn, LCM)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  href="/courses"
                  className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 group"
                >
                  <span>Explore Syllabus &amp; Sandbox</span>
                  <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </div>
            </div>

            {/* CARD 2: BUILD YOUR CAREER */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm font-black font-mono">
                    02
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                    AI Career Suite
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <span>Build Your Career</span>
                    <i className="fa-solid fa-id-card text-purple-600 text-xs"></i>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ATS resume optimization, verifiable credentials & 1-on-1 SDE mentorship.
                  </p>
                </div>

                {/* UI Preview Box: AI Resume Scorecard */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">AI ATS Scanner</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-black text-[10px]">
                      ATS: 94 / 100 🟢
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold">Verified Production Badges:</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-mono border border-slate-200">Kafka Streams</span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-mono border border-slate-200">Spring Security 6</span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-mono border border-slate-200">Redis Locks</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-[10px] text-purple-900 flex items-center space-x-1.5">
                    <i className="fa-solid fa-user-check text-purple-600"></i>
                    <span><strong>Amazon SDE Reviewer:</strong> "Clean decoupled architecture."</span>
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="text-xs text-slate-600 space-y-2 font-medium">
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-purple-600 text-[10px]"></i>
                    <span>Automated ATS Resume Screening for 90%+ Recruiter Calls</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-purple-600 text-[10px]"></i>
                    <span>Cryptographically Verifiable Certificates (/verify-certificate)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center space-x-1 group"
                >
                  <span>Compare Career Features</span>
                  <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>

            {/* CARD 3: GET READY FOR THE JOB */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black font-mono">
                    03
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Hiring Loop Ready
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <span>Get Ready for the Job</span>
                    <i className="fa-solid fa-briefcase text-emerald-600 text-xs"></i>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    RAG AI mock interviews, Company OA simulators & direct hiring pipeline.
                  </p>
                </div>

                {/* UI Preview Box: Mock Interview Dialogue */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">RAG AI Mock Interviewer</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                      Staff SDE Rubric
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-1 text-[10px]">
                    <div className="font-bold text-indigo-700 flex items-center space-x-1">
                      <i className="fa-solid fa-robot"></i>
                      <span>AI Interview Question:</span>
                    </div>
                    <p className="text-slate-700 leading-tight">
                      "Explain how you prevent cache breakdown in Redis during sudden traffic spikes."
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-0.5 font-bold text-slate-500">
                    <span>OA Simulators:</span>
                    <div className="flex space-x-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px]">TCS Prime</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px]">Infosys</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px]">Amazon</span>
                    </div>
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="text-xs text-slate-600 space-y-2 font-medium">
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-emerald-600 text-[10px]"></i>
                    <span>50,000+ Question Bank with Staff SDE Rubric Grading</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <i className="fa-solid fa-check text-emerald-600 text-[10px]"></i>
                    <span>60s Mental Math Speed Duels & Direct Hiring Partner Referrals</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowQuizModal(true)}
                  className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 group"
                >
                  <span>Check Placement Readiness</span>
                  <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}
