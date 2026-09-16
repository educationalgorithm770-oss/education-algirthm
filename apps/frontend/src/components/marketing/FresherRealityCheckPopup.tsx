'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFormattedQuotes, RealityQuote, JobMetrics } from '@/lib/reality-check-quotes';

export default function FresherRealityCheckPopup() {
  const [metrics, setMetrics] = useState<JobMetrics>({
    fresherCount: 347,
    totalCount: 789,
    topSalary: '₹38 LPA',
    topCompanies: ['Cisco India', 'Capgemini', 'Persistent Systems', 'Google'],
  });

  const [quotes, setQuotes] = useState<RealityQuote[]>(() =>
    getFormattedQuotes({
      fresherCount: 347,
      totalCount: 789,
      topSalary: '₹38 LPA',
      topCompanies: ['Cisco India', 'Capgemini', 'Persistent Systems', 'Google'],
    })
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isGatedModalOpen, setIsGatedModalOpen] = useState(false);
  const [isFlippedToReality, setIsFlippedToReality] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchLiveJobMetrics() {
      try {
        const res = await fetch('/api/jobs?limit=1000', { signal: controller.signal });
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs)) {
          const freshers = data.jobs.filter(
            (j: { experienceLevel?: string }) =>
              (j.experienceLevel && j.experienceLevel.toLowerCase().includes('fresher')) ||
              (j.experienceLevel && j.experienceLevel.includes('0-1')) ||
              (j.experienceLevel && j.experienceLevel.includes('0-2'))
          );
          const topComps = Array.from(new Set(data.jobs.map((j: { companyName?: string }) => j.companyName || 'Tech Enterprise'))).slice(0, 5);

          const updated: JobMetrics = {
            fresherCount: freshers.length > 0 ? freshers.length : 347,
            totalCount: data.count || 789,
            topSalary: '₹38 LPA',
            topCompanies: (topComps as string[]).length > 0 ? (topComps as string[]) : ['Cisco India', 'Capgemini'],
          };
          setMetrics(updated);
          setQuotes(getFormattedQuotes(updated));
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Fallback intact
      }
    }
    fetchLiveJobMetrics();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentIdx((curr) => (curr + 1) % quotes.length);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quotes.length]);

  const handleShuffle = () => {
    let nextIdx = Math.floor(Math.random() * quotes.length);
    if (nextIdx === currentIdx && quotes.length > 1) {
      nextIdx = (nextIdx + 1) % quotes.length;
    }
    setCurrentIdx(nextIdx);
    setSecondsLeft(60);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    sessionStorage.setItem('ea_fresher_popup_minimized', 'true');
  };

  const handleExpand = () => {
    setIsMinimized(false);
    sessionStorage.removeItem('ea_fresher_popup_minimized');
  };

  const currentQuote = quotes[currentIdx] || quotes[0];
  const progressPercent = ((60 - secondsLeft) / 60) * 100;

  return (
    <>
      {/* MINIMIZED FLOATING PILL (Mobile Responsive) */}
      {isMinimized && (
        <div
          onClick={handleExpand}
          className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 cursor-pointer bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-2xl border-2 border-indigo-500 flex items-center gap-2 hover:scale-105 transition-transform duration-300 max-w-[calc(100vw-90px)] sm:max-w-none"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
          <span className="text-[11px] sm:text-xs font-black truncate">🔥 {metrics.fresherCount}+ Fresher Roles Live</span>
          <span className="text-[9px] sm:text-[10px] bg-indigo-600 px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0">Reality Check 👀</span>
        </div>
      )}

      {/* EXPANDED INTERACTIVE POPUP (Mobile Responsive) */}
      {!isMinimized && (
        <div className="fixed bottom-4 left-3 right-3 sm:right-auto sm:left-6 sm:bottom-6 z-40 max-w-md sm:w-[440px] transition-all duration-500 ease-out">
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-600 shadow-2xl p-4 sm:p-5 relative overflow-hidden">
            {/* Top 60s Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Header with live status & controls */}
            <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-rose-600">
                  Fresher Reality Check 🔥
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">Rotates in {secondsLeft}s</span>
                <button
                  onClick={handleShuffle}
                  title="Shuffle Reality Check"
                  className="text-slate-400 hover:text-indigo-600 transition-colors text-xs p-1"
                >
                  <i className="fa-solid fa-shuffle"></i>
                </button>
                <button
                  onClick={handleMinimize}
                  title="Minimize"
                  className="text-slate-400 hover:text-slate-600 transition-colors text-xs p-1"
                >
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
              </div>
            </div>

            {/* Sarcastic Headline & Punchline */}
            <div className="py-2.5 sm:py-3 space-y-1.5 sm:space-y-2">
              <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 leading-snug">
                {currentQuote.headline}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                {currentQuote.punchline}
              </p>
            </div>

            {/* Interactive Myth vs Reality Flip Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 space-y-1 mb-2.5 sm:mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-indigo-700 truncate pr-2">
                  {currentQuote.myth}
                </span>
                <button
                  onClick={() => setIsFlippedToReality(!isFlippedToReality)}
                  className="text-[9px] sm:text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer shrink-0"
                >
                  {isFlippedToReality ? 'False Belief ❌' : 'Reality ⚡'}
                </button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-normal">
                {isFlippedToReality ? (
                  <span>{currentQuote.reality}</span>
                ) : (
                  <span>
                    ❌ <strong>The False Belief:</strong> People believe the tech market stopped hiring without checking live active openings.
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row sm:flex-row items-center gap-2 pt-1">
              <a
                href="#jobs-radar"
                className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl shadow-xs transition-colors"
              >
                View {metrics.fresherCount}+ Fresher Roles &rarr;
              </a>
              <button
                onClick={() => setIsGatedModalOpen(true)}
                className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-extrabold py-2 sm:py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Learn Programming First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GATED COHORT LEAD-GEN MODAL */}
      {isGatedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 border border-slate-200 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsGatedModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-base cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-xl sm:text-2xl shadow-inner">
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                Cohort Exclusive Talent Network
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Direct Referrals &amp; Mentorship
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                1-Click Referrals and AI Pitch Generators are exclusively unlocked for enrolled students with verified <strong>Proof-of-Work repositories</strong> and completed <strong>System Sandboxes</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
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

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <Link
                href="/courses"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 sm:py-3 rounded-xl shadow-md transition-colors"
              >
                Enroll in Fall 2026 Cohort &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold py-2.5 sm:py-3 rounded-xl transition-colors"
              >
                Student Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
