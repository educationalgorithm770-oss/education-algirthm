'use client';

import React from 'react';
import Link from 'next/link';

export default function WhyChooseUsGrid() {
  const reasons = [
    {
      icon: 'fa-microchip',
      iconColor: 'text-indigo-600 bg-indigo-50',
      badge: 'Modern Architecture',
      title: 'Java 21 LTS & Concurrency Mastery',
      description:
        'Generic bootcamps still teach obsolete Java 8 CRUD syntax. We teach Java 21 Virtual Threads (Loom), Scoped Values, Spring Boot 3, and Garbage Collection tuning (G1GC/ZGC).',
    },
    {
      icon: 'fa-robot',
      iconColor: 'text-purple-600 bg-purple-50',
      badge: 'Proprietary AI Ecosystem',
      title: '50,000 Qs AI Interview Arena & Docker Runner',
      description:
        'Get private student access to our RAG-powered AI Mock Interviewer with Staff Engineer rubric scoring, and an in-browser Code Arena executing against automated test suites.',
    },
    {
      icon: 'fa-shield-halved',
      iconColor: 'text-emerald-600 bg-emerald-50',
      badge: 'Zero Financial Debt',
      title: 'Direct Enrollment (No 17% Salary Deductions)',
      description:
        'Other bootcamps lock you into aggressive Income Share Agreements (ISAs) deducting 17% of your salary for 3 years. We offer complete all-inclusive access with zero salary deductions and flexible options.',
    },
    {
      icon: 'fa-layer-group',
      iconColor: 'text-blue-600 bg-blue-50',
      badge: 'Real Systems',
      title: 'Production Capstones (No Toy Todo Apps)',
      description:
        'Build and deploy a High-Throughput Payment Gateway with Redis distributed locks & MySQL row locks, an Autonomous AI Code Review Auditor, and a Kafka event streaming pipeline.',
    },
    {
      icon: 'fa-user-tie',
      iconColor: 'text-amber-600 bg-amber-50',
      badge: 'Senior Mentorship',
      title: '1-on-1 Code Reviews by Tier-1 SDEs',
      description:
        'Direct mentorship and simulated technical hiring loops with engineers from Amazon AWS, Google Cloud, and top product engineering teams to eliminate bad coding anti-patterns.',
    },
    {
      icon: 'fa-headset',
      iconColor: 'text-rose-600 bg-rose-50',
      badge: 'Guaranteed Support',
      title: '24-Hour Faculty Doubt SLA',
      description:
        'Never stay stuck on a compiler bug or distributed system deadlock. Submit your code to the private Doubt Desk and receive an instructor resolution within 24 hours guaranteed.',
    },
    {
      icon: 'fa-certificate',
      iconColor: 'text-teal-600 bg-teal-50',
      badge: 'Proof of Work',
      title: 'Cryptographically Verifiable Credentials',
      description:
        'Graduates receive tamper-proof certificates with a unique ID that recruiters and hiring managers can verify instantly on our public verification portal (/verify-certificate).',
    },
  ];

  return (
    <section id="why-choose-us" className="py-14 sm:py-20 px-3 sm:px-6 lg:px-8 bg-white border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto px-2">
          <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider">
            The Engineering Advantage
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Why Serious Engineers Choose <span className="text-indigo-600">Education Algorithm</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-base font-normal leading-relaxed">
            We replaced generic tutorials with rigorous systems engineering, proprietary AI tools, and 100% transparent pricing.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reasons.map((r, idx) => (
            <div
              key={idx}
              className={`p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 space-y-4 flex flex-col justify-between ${
                idx === 2 ? 'md:col-span-2 lg:col-span-1 bg-gradient-to-b from-emerald-50/40 to-slate-50/50 border-emerald-200/80' : ''
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold shadow-xs ${r.iconColor}`}>
                    <i className={`fa-solid ${r.icon}`}></i>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white border border-slate-200 text-slate-600">
                    {r.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {r.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Pillar 0{idx + 1}</span>
                <Link href="/courses" className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
                  <span>Learn more</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">
              Admissions Open for Fall 2026 Batch
            </div>
            <h3 className="text-xl sm:text-3xl font-black leading-tight">
              Ready to Accelerate into Tier-1 Product SDE Roles?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Comprehensive 16-week production engineering cohort with live AI Interview Arena, cloud code runner, and 1-on-1 senior mentorship.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto shrink-0">
            <Link
              href="/courses"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 text-center whitespace-nowrap"
            >
              Enroll in Cohort &rarr;
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs sm:text-sm transition border border-slate-700 text-center whitespace-nowrap"
            >
              Talk to Advisor
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
