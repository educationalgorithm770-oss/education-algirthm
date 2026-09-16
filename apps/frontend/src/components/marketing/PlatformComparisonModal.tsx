'use client';

import React, { useState } from 'react';

interface ComparisonRow {
  category: 'all' | 'coding' | 'aptitude' | 'ai' | 'pricing';
  feature: string;
  genericCourses: {
    text: string;
    sub?: string;
  };
  expensiveBootcamps: {
    text: string;
    sub?: string;
  };
  educationAlgorithm: {
    text: string;
    sub?: string;
    highlightBadge?: string;
  };
}

interface PlatformComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuiz?: () => void;
}

export default function PlatformComparisonModal({
  isOpen,
  onClose,
  onOpenQuiz,
}: PlatformComparisonModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'coding' | 'aptitude' | 'ai' | 'pricing'>('all');

  if (!isOpen) return null;

  const comparisonData: ComparisonRow[] = [
    {
      category: 'coding',
      feature: 'Code Execution & Sandboxes',
      genericCourses: {
        text: '❌ No code execution',
        sub: 'You only watch passive 50+ hours of video without typing code.',
      },
      expensiveBootcamps: {
        text: '⚠️ Basic web compiler',
        sub: 'Slow compilation with no memory, CPU, or hidden test analysis.',
      },
      educationAlgorithm: {
        text: '✅ Live In-Browser Docker Sandboxes',
        sub: 'Instant execution on every lesson with automated test suites & edge-case validation.',
        highlightBadge: 'Docker Sandboxed',
      },
    },
    {
      category: 'aptitude',
      feature: 'Placement Aptitude & OA Simulators',
      genericCourses: {
        text: '❌ Static PDF sheets',
        sub: 'Memorizing complex algebra formulas that students forget during exams.',
      },
      expensiveBootcamps: {
        text: '⚠️ Generic multiple choice',
        sub: 'Basic MCQs with no real-time speed mechanics or visual intuition.',
      },
      educationAlgorithm: {
        text: '✅ 7 Zero-Algebra Motion Labs & 60s Duels',
        sub: 'Interactive visual physics tracks (Trains, Clocks, Venn) + TCS/Amazon OA simulators.',
        highlightBadge: 'Zero Algebra',
      },
    },
    {
      category: 'coding',
      feature: 'Architecture & Project Rigor',
      genericCourses: {
        text: '❌ Toy Todo & Weather apps',
        sub: 'Outdated Java 8 syntax and generic clones rejected by tech recruiters.',
      },
      expensiveBootcamps: {
        text: '⚠️ Basic MVC Monoliths',
        sub: 'Standard CRUD web apps with minimal enterprise scale or concurrency.',
      },
      educationAlgorithm: {
        text: '✅ Enterprise Distributed Systems',
        sub: 'Java 21 Virtual Threads, Spring Boot 3, Kafka event streaming & Redis distributed locks.',
        highlightBadge: 'Production Microservices',
      },
    },
    {
      category: 'ai',
      feature: 'AI Career Tools & Interview Prep',
      genericCourses: {
        text: '❌ Zero interview prep',
        sub: 'No mock interviews or ATS resume analysis. You prepare alone.',
      },
      expensiveBootcamps: {
        text: '⚠️ 1-2 Peer mock calls',
        sub: 'Inconsistent student-to-student practice with no rubric standard.',
      },
      educationAlgorithm: {
        text: '✅ 24/7 AI Mock Interviewer & ATS Scanner',
        sub: '50,000+ Qs with Staff SDE rubric grading, live feedback & AI resume keyword injection.',
        highlightBadge: 'Staff SDE Rubrics',
      },
    },
    {
      category: 'pricing',
      feature: 'Tuition Cost & Financial Debt',
      genericCourses: {
        text: '❌ ₹500 – ₹3,000 (Low finish rate)',
        sub: 'No accountability, zero mentorship, and 95% drop-out rate.',
      },
      expensiveBootcamps: {
        text: '⚠️ ₹80,000 – ₹1.5 Lakhs (or 17% ISA)',
        sub: 'Predatory salary deductions taking ₹1.8L+ from your first 3 years of pay.',
      },
      educationAlgorithm: {
        text: '✅ 100% Transparent, Fixed All-Inclusive Fee',
        sub: '₹0 salary deductions, zero debt, lifetime verified credentials, and full support.',
        highlightBadge: '₹0 Debt & Zero ISA',
      },
    },
    {
      category: 'ai',
      feature: 'Doubt Support & Resolution SLA',
      genericCourses: {
        text: '❌ Unanswered comment forums',
        sub: 'Wait days or weeks with zero guarantee of an instructor response.',
      },
      expensiveBootcamps: {
        text: '⚠️ Long TA ticket queues',
        sub: 'Junior teaching assistants with delayed response times.',
      },
      educationAlgorithm: {
        text: '✅ 24-Hour Instructor SLA + 24/7 AI Tutor',
        sub: 'Instant context-aware AI whiteboard diagnostics + guaranteed faculty resolutions.',
        highlightBadge: 'Guaranteed 24h SLA',
      },
    },
  ];

  const filteredData = activeTab === 'all' 
    ? comparisonData 
    : comparisonData.filter(item => item.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1.5 pr-6">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider">
              <i className="fa-solid fa-scale-balanced text-indigo-600"></i>
              <span>The Education Algorithm Advantage</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              See How We Compare to Other Platforms
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Compare our active engineering accelerator against generic video platforms and expensive bootcamps.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition shrink-0"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {[
            { id: 'all', label: '📊 All Criteria' },
            { id: 'coding', label: '💻 Code Execution & Projects' },
            { id: 'aptitude', label: '🎮 Aptitude & Company OAs' },
            { id: 'ai', label: '🤖 AI Career & Interviews' },
            { id: 'pricing', label: '💰 Pricing & Financial ROI' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition border ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Comparison Matrix Table / Cards */}
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            <div className="col-span-3">Feature &amp; Metric</div>
            <div className="col-span-3 text-slate-600">Generic Video Courses</div>
            <div className="col-span-3 text-amber-700">Expensive Bootcamps</div>
            <div className="col-span-3 text-indigo-700 font-extrabold">🚀 Education Algorithm</div>
          </div>

          {/* Comparison Rows */}
          {filteredData.map((row, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-4 md:items-center"
            >
              {/* Feature Title */}
              <div className="md:col-span-3">
                <span className="text-xs sm:text-sm font-black text-slate-900 block">
                  {row.feature}
                </span>
                {row.educationAlgorithm.highlightBadge && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold uppercase">
                    {row.educationAlgorithm.highlightBadge}
                  </span>
                )}
              </div>

              {/* Generic Courses */}
              <div className="md:col-span-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 md:bg-transparent md:border-0 md:p-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase md:hidden mb-1">Generic Video Platforms:</div>
                <div className="text-xs font-bold text-slate-800">{row.genericCourses.text}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{row.genericCourses.sub}</p>
              </div>

              {/* Expensive Bootcamps */}
              <div className="md:col-span-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 md:bg-transparent md:border-0 md:p-0">
                <div className="text-[10px] font-bold text-amber-700 uppercase md:hidden mb-1">Expensive Bootcamps:</div>
                <div className="text-xs font-bold text-slate-800">{row.expensiveBootcamps.text}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{row.expensiveBootcamps.sub}</p>
              </div>

              {/* Education Algorithm */}
              <div className="md:col-span-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 md:bg-transparent md:border-0 md:p-0">
                <div className="text-[10px] font-black text-indigo-700 uppercase md:hidden mb-1">🚀 Education Algorithm:</div>
                <div className="text-xs font-extrabold text-indigo-900">{row.educationAlgorithm.text}</div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">{row.educationAlgorithm.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Financial ROI Highlight Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
              <i className="fa-solid fa-piggy-bank text-emerald-600"></i>
              <span>Zero-Debt Career Guarantee</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Save up to <strong>₹1,80,000</strong> compared to 17% salary-sharing Income Share Agreements (ISAs). 100% transparent pricing with average cohort package of <strong>₹14.5 LPA</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenQuiz && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQuiz();
                }}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs border border-indigo-200 transition shadow-xs flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-circle-question"></i>
                <span>Take 2-Min Quiz</span>
              </button>
            )}
            <a
              href="/courses"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
            >
              <span>Explore Syllabus</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
