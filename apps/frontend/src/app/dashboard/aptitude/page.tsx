'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import AlgoBotMascot from '@/components/aptitude/AlgoBotMascot';
import DailySpinWheel from '@/components/aptitude/DailySpinWheel';
import { sounds } from '@/components/aptitude/SoundManager';

interface Topic {
  id: number;
  slug: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  difficultyMix: { easy?: number; medium?: number; hard?: number };
  summary: string;
  cheatSheet: Array<{ title: string; formula: string; explanation: string }>;
  totalQuestions: number;
  attempts: number;
  masteryPercentage: number;
}

interface MockExam {
  id: number;
  slug: string;
  title: string;
  company: string;
  badgeLogo: string;
  durationMinutes: number;
  totalQuestions: number;
  sectionalCutoffs: Record<string, number>;
}

interface StudentStats {
  studentId: number;
  xp: number;
  brainGems: number;
  streakDays: number;
  level: number;
  currentTitle: string;
  avatarCosmetic: string;
  unlockedBadges: string[];
  canSpinToday: boolean;
}

export default function AptitudeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeCheatSheet, setActiveCheatSheet] = useState<Topic | null>(null);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [soundActive, setSoundActive] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/aptitude/topics');
        const data = await res.json();
        if (data.success) {
          setTopics(data.topics || []);
          setMockExams(data.mockExams || []);
          if (data.studentStats) {
            setStudentStats(data.studentStats);
          }
        }

        // Also fetch gamification status
        const gRes = await fetch('/api/aptitude/gamification');
        const gData = await gRes.json();
        if (gData.success && gData.stats) {
          setStudentStats(gData.stats);
        }
      } catch (e) {
        console.error('Failed to load aptitude hub:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    setSoundActive(sounds.isEnabled());
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Modules', icon: 'fa-layer-group' },
    { id: 'Quantitative Aptitude', label: 'Quant / Math', icon: 'fa-calculator' },
    { id: 'Logical Reasoning', label: 'Logical Reasoning', icon: 'fa-brain' },
    { id: 'Verbal Ability', label: 'Verbal Ability', icon: 'fa-spell-check' },
    { id: 'Data Interpretation', label: 'Data & Charts', icon: 'fa-chart-pie' }
  ];

  const filteredTopics = selectedCategory === 'ALL'
    ? topics
    : topics.filter(t => t.category === selectedCategory);

  const toggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundActive(newState);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <StudentNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Loading Aptitude & Reasoning Arena...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white font-sans">
      <StudentNavbar />

      {/* Daily Spin Modal */}
      {showSpinWheel && (
        <DailySpinWheel
          canSpinToday={studentStats?.canSpinToday ?? true}
          onSpinSuccess={(reward) => {
            if (studentStats) {
              setStudentStats({
                ...studentStats,
                xp: studentStats.xp + reward.xp,
                brainGems: studentStats.brainGems + reward.gems,
                canSpinToday: false
              });
            }
          }}
          onClose={() => setShowSpinWheel(false)}
        />
      )}

      {/* Cheat Sheet Popover Modal */}
      {activeCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveCheatSheet(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg border border-indigo-100">
                <i className={`fa-solid ${activeCheatSheet.icon}`}></i>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">{activeCheatSheet.title}</h3>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{activeCheatSheet.category} Formula Sheet</span>
              </div>
            </div>

            <div className="space-y-4">
              {activeCheatSheet.cheatSheet.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs font-black text-amber-700 flex items-center space-x-2">
                    <i className="fa-solid fa-bolt text-xs text-amber-500"></i>
                    <span>{item.title}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/60 rounded-xl font-mono text-xs sm:text-sm font-bold text-indigo-900">
                    {item.formula}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href={`/dashboard/aptitude/practice/${activeCheatSheet.slug}`}
                onClick={() => setActiveCheatSheet(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
              >
                <span>Practice this Topic</span>
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Top Gamer Stat HUD */}
        <section className="bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 border border-indigo-100/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col 2xl:flex-row items-center justify-between gap-4 sm:gap-5 relative z-10 w-full">
            {/* Left: Mascot & Student Speech Bubble */}
            <div className="w-full 2xl:w-auto flex items-center min-w-0">
              <AlgoBotMascot
                mood="HAPPY"
                size="md"
              />
            </div>

            {/* Right: 4 Stat Badges + Action Buttons */}
            <div className="flex flex-col sm:flex-row 2xl:flex-nowrap items-stretch sm:items-center justify-start 2xl:justify-end gap-2.5 sm:gap-3 w-full 2xl:w-auto">
              
              {/* 4 Stat Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 flex-1 w-full 2xl:w-auto">
                
                {/* Streak */}
                <div className="bg-white border border-amber-200/90 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 sm:space-x-3 shadow-xs hover:shadow-sm transition min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm sm:text-base shrink-0 border border-amber-100">
                    <i className="fa-solid fa-fire animate-bounce"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 leading-none truncate">Streak</div>
                    <div className="text-xs sm:text-sm font-black text-amber-600 mt-0.5 sm:mt-1 truncate">{studentStats?.streakDays || 1} Days 🔥</div>
                  </div>
                </div>

                {/* Brain Gems */}
                <div className="bg-white border border-pink-200/90 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 sm:space-x-3 shadow-xs hover:shadow-sm transition min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm sm:text-base shrink-0 border border-pink-100">
                    <i className="fa-solid fa-gem"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 leading-none truncate">Brain Gems</div>
                    <div className="text-xs sm:text-sm font-black text-pink-600 mt-0.5 sm:mt-1 truncate">{studentStats?.brainGems || 25} 💎</div>
                  </div>
                </div>

                {/* XP & Level */}
                <div className="bg-white border border-indigo-200/90 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 sm:space-x-3 shadow-xs hover:shadow-sm transition min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm sm:text-base shrink-0 border border-indigo-100">
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 leading-none truncate">Level {studentStats?.level || 1}</div>
                    <div className="text-xs sm:text-sm font-black text-indigo-600 mt-0.5 sm:mt-1 truncate">{studentStats?.xp || 120} XP</div>
                  </div>
                </div>

                {/* Rank Title */}
                <div className="bg-white border border-emerald-200/90 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center space-x-2.5 sm:space-x-3 shadow-xs hover:shadow-sm transition min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm sm:text-base shrink-0 border border-emerald-100">
                    <i className="fa-solid fa-crown"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-400 leading-none truncate">Rank Title</div>
                    <div className="text-[11px] sm:text-xs md:text-sm font-black text-emerald-700 mt-0.5 sm:mt-1 truncate">{studentStats?.currentTitle || 'Math Novice'}</div>
                  </div>
                </div>
              </div>

              {/* Action Controls: Sound Toggle & Lucky Wheel Button */}
              <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-1 sm:pt-0">
                <button
                  onClick={toggleSound}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border transition flex items-center justify-center text-xs sm:text-sm ${
                    soundActive
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={soundActive ? 'Sound FX Enabled' : 'Sound FX Muted'}
                >
                  <i className={`fa-solid ${soundActive ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                </button>

                <button
                  onClick={() => { setShowSpinWheel(true); sounds.playClick(); }}
                  className={`flex-1 sm:flex-initial px-3 sm:px-4 h-9 sm:h-10 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 border shadow-sm ${
                    studentStats?.canSpinToday ?? true
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/20 animate-pulse'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-gift text-xs sm:text-sm text-amber-700"></i>
                  <span>{studentStats?.canSpinToday ?? true ? 'Daily Spin' : 'Claimed'}</span>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Dual High-Impact Feature Launchers: Roadmap & Visual Motion Labs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Roadmap Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-5 sm:p-7 shadow-lg shadow-indigo-600/15 text-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                <i className="fa-solid fa-route"></i>
                <span>Adaptive Placement Tracks</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Aptitude Pro Roadmap 🛣️
              </h2>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Choose your target window: 14-Day Rapid OA Sprint, 30-Day Pro Accelerator, or 60-Day Grandmaster. Unlock daily nodes and earn verified certificates!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/aptitude/roadmap"
                className="w-full sm:w-fit px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-indigo-50 text-indigo-700 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Launch 30-Day Roadmap</span>
              </Link>
            </div>
          </div>

          {/* Visual Concept Motion Labs Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-5 sm:p-7 shadow-lg shadow-emerald-600/15 text-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                <i className="fa-solid fa-gamepad"></i>
                <span>Zero Algebra Physics</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Motion UI Concept Labs 🎮
              </h2>
              <p className="text-xs text-emerald-100 leading-relaxed">
                7 interactive visual simulators: Percentage Slicer, Relative Speed Trains, Merchant Balance Scale, Tank Flow LCM, and Neon Venn Bubbles!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/aptitude/labs"
                className="w-full sm:w-fit px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-flask-vial"></i>
                <span>Enter Concept Labs</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 1v1 Speed Duel Arena Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5 sm:p-8 shadow-lg shadow-purple-600/15 text-white flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 text-center md:text-left w-full md:w-auto">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-white border border-white/30 text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <i className="fa-solid fa-swords"></i>
              <span>High Stakes Battle</span>
            </div>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white">
              60-Second Rapid-Fire Speed Duel ⚔️
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 max-w-xl">
              Battle the clock or AlgoBot AI in lightning-fast Vedic mental math. 5 rapid questions, instant score multipliers, and 2x XP rewards!
            </p>
          </div>

          <Link
            href="/dashboard/aptitude/speed-duel"
            className="w-full md:w-auto justify-center px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-purple-50 text-purple-700 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition flex items-center space-x-2.5 shrink-0"
          >
            <i className="fa-solid fa-gamepad"></i>
            <span>Enter Duel Arena</span>
          </Link>
        </section>

        {/* Company OA Simulators Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-building-circle-check text-indigo-600"></i>
                <span>Company Mock Assessment Blueprints</span>
              </h2>
              <p className="text-xs text-slate-500">Simulate exact exam patterns, sectional timers, and cutoffs for top tech recruiters.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {mockExams.map((mock) => (
              <div
                key={mock.id}
                className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg group-hover:scale-110 transition">
                      <i className={`fa-solid ${mock.badgeLogo}`}></i>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {mock.durationMinutes} Mins
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{mock.company}</div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition mt-0.5 leading-snug">
                      {mock.title}
                    </h3>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center space-x-3 pt-1 border-t border-slate-100">
                    <span><i className="fa-solid fa-list-check text-indigo-500 me-1"></i>{mock.totalQuestions} Questions</span>
                    <span><i className="fa-solid fa-shield-halved text-emerald-600 me-1"></i>OA Blueprint</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5">
                  <Link
                    href={`/dashboard/aptitude/mock/${mock.slug}`}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 border border-slate-200 hover:border-indigo-600"
                  >
                    <span>Launch Simulator</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Practice Drill Topics Hub */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                <span>Practice Drills & Topic Labs</span>
              </h2>
              <p className="text-xs text-slate-500">Zero algebra. Master 10-second Vedic shortcut tricks for each aptitude topic.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1.5 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-xs`}></i>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xl group-hover:scale-105 transition">
                      <i className={`fa-solid ${topic.icon}`}></i>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setActiveCheatSheet(topic); sounds.playClick(); }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold transition flex items-center space-x-1"
                        title="View Formula Cheat Sheet"
                      >
                        <i className="fa-solid fa-bolt text-amber-500"></i>
                        <span>Cheat Sheet</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{topic.category}</span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition mt-0.5">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {topic.summary}
                    </p>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Mastery Accuracy</span>
                      <span className="font-extrabold text-emerald-600">{topic.masteryPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, topic.masteryPercentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-medium">
                    <i className="fa-solid fa-circle-question text-indigo-500 me-1"></i>
                    {topic.totalQuestions} Questions
                  </div>

                  <Link
                    href={`/dashboard/aptitude/practice/${topic.slug}`}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm shadow-indigo-600/20 flex items-center space-x-1.5"
                  >
                    <span>Practice Drill</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
