'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  enrolledCourses?: string[];
  enrolledCourseIds?: number[];
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
}

interface Course {
  id: number;
  title: string;
  description?: string | null;
  level: string;
  duration: string;
  price: number;
  modules: CourseModule[];
}

import LeaderboardDrawer from '@/components/dashboard/LeaderboardDrawer';
import HeatmapModal from '@/components/dashboard/HeatmapModal';

interface DailyQuest {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
  icon: string;
}

interface StreakData {
  current: number;
  longest: number;
  xp: number;
  streakFreezes: number;
  consistencyScore: number;
  cohortRank: number;
  totalCohortStudents: number;
  leagueTier: string;
  courseProgressPercent?: number;
  enrolledCourseTitle?: string;
  focusHours?: number;
  solvedLabs?: number;
  completedLessons?: number;
  totalVideos?: number;
  weeklyActivity: { day: string; completed: boolean; isToday: boolean; isFuture: boolean; xp: number }[];
  dailyQuests: DailyQuest[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'syllabus'>('overview');
  const [timeGreeting, setTimeGreeting] = useState('Welcome back');
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [updatingQuest, setUpdatingQuest] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

  const fetchStreak = async () => {
    try {
      const res = await fetch('/api/student/streak');
      const data = await res.json();
      if (data.success && data.streak) {
        setStreakData(data.streak);
      }
    } catch (e) {
      console.error('Failed to load streak:', e);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good morning');
    else if (hour < 18) setTimeGreeting('Good afternoon');
    else setTimeGreeting('Good evening');

    async function loadData() {
      try {
        setLoading(true);
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setUser(meData.user);
        } else {
          router.replace('/login?next=/dashboard');
          return;
        }

        const courseRes = await fetch('/api/courses');
        const courseData = await courseRes.json();
        if (courseData.success && Array.isArray(courseData.courses)) {
          setCourses(courseData.courses);
        }

        await fetchStreak();
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleQuest = async (questId: string) => {
    try {
      setUpdatingQuest(questId);
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStreak();
      }
    } catch (e) {
      console.error('Failed to toggle quest:', e);
    } finally {
      setUpdatingQuest(null);
    }
  };

  const isMatchingCourse = (course: Course, enrolledNames: string[] = [], enrolledIds: number[] = []) => {
    if (enrolledIds.includes(course.id)) return true;
    const ct = (course.title || '').toLowerCase();
    return enrolledNames.some(en => {
      const eLower = en.toLowerCase();
      return ct.includes(eLower) || eLower.includes(ct) ||
        (ct.includes('java') && eLower.includes('java')) ||
        (ct.includes('data science') && eLower.includes('data science')) ||
        (ct.includes('devops') && eLower.includes('devops'));
    });
  };

  const activeCourse = React.useMemo(() => {
    if (!courses || courses.length === 0) return null;
    if (user?.role === 'admin') return courses[0];
    if (user?.enrolledCourses && user.enrolledCourses.length > 0) {
      const match = courses.find(c => isMatchingCourse(c, user.enrolledCourses, user.enrolledCourseIds));
      if (match) return match;
    }
    return courses[0];
  }, [courses, user]);

  const completedQuestsCount = streakData?.dailyQuests?.filter(q => q.completed).length || 0;
  const totalQuestsCount = streakData?.dailyQuests?.length || 3;
  const dailyProgressPercent = Math.round((completedQuestsCount / totalQuestsCount) * 100);
  const currentXp = streakData?.xp || 1450;
  const nextTierTargetXp = 2000;
  const tierProgressPercent = Math.min(100, Math.round((currentXp / nextTierTargetXp) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8 w-full space-y-6 sm:space-y-8">
        
        {/* Top Greeting & Status Line */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {timeGreeting}, <span className="text-indigo-600">{user?.name ? user.name.split(' ')[0] : 'Student'}</span> 👋
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Cohort 2026
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5 shadow-xs">
              <span>🔥 {streakData?.current || 7}-Day Streak</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-[11px] font-bold">Top 5% Cohort</span>
            </div>
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <i className="fa-solid fa-shield-halved text-indigo-600 text-xs"></i>
              <span>{streakData?.streakFreezes || 1} Shield Ready</span>
            </div>
          </div>
        </div>

        {/* 📊 4 Clean Student Intelligence Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Streak & Consistency */}
          <div
            onClick={() => setIsHeatmapOpen(true)}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition group space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Streak &amp; Records</span>
              <span className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs group-hover:scale-110 transition">🔥</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-black text-slate-900">
                {streakData?.current || 1} {(streakData?.current || 1) === 1 ? 'Day' : 'Days'} Active
              </div>
              <div className="text-xs text-orange-600 font-bold flex items-center gap-1">
                <span>Best Record: {streakData?.longest || 1} {(streakData?.longest || 1) === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Consistency Index</span>
              <span className="font-extrabold text-emerald-600">{streakData?.consistencyScore || 94}%</span>
            </div>
          </div>

          {/* Card 2: Syllabus Progress & Smart Next Lesson Action */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition group space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Course Syllabus</span>
              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs group-hover:scale-110 transition">📚</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-black text-slate-900">
                {streakData?.courseProgressPercent ?? 0}% Completed
              </div>
              <div className="text-xs text-indigo-600 font-bold truncate">
                {activeCourse ? activeCourse.title : (streakData?.enrolledCourseTitle || 'Java Full Stack & Cloud Engineering')}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link
                href={activeCourse ? `/dashboard/learn/${activeCourse.id}` : '/dashboard/courses'}
                className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <i className="fa-solid fa-play text-[10px]"></i>
                <span>Resume Next Lesson</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Study Focus Time & Labs */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition group space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Focus Hours &amp; Labs</span>
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs group-hover:scale-110 transition">⚡</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-black text-slate-900">
                {streakData?.focusHours !== undefined ? `${streakData.focusHours} Hours` : '0.0 Hours'}
              </div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <i className="fa-solid fa-code text-xs"></i>
                <span>{streakData?.solvedLabs || 0} Code Labs Solved</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Code Arena Sandbox</span>
              <Link href="/code-arena" className="font-extrabold text-indigo-600 hover:underline">Launch &rarr;</Link>
            </div>
          </div>

          {/* Card 4: Cohort Rank & Leaderboard */}
          <div
            onClick={() => setIsLeaderboardOpen(true)}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition group space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Leaderboard Standings</span>
              <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs group-hover:scale-110 transition">🏆</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-black text-slate-900">
                Rank #{streakData?.cohortRank || 1}
              </div>
              <div className="text-xs text-purple-600 font-bold">
                of {streakData?.totalCohortStudents || 27} Enrolled Students
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Promotion Zone</span>
              <span className="font-extrabold text-purple-600 group-hover:underline">View Ranks &rarr;</span>
            </div>
          </div>

        </div>

        {/* Modals and Slide-Over Drawers */}
        <LeaderboardDrawer
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          currentRank={streakData?.cohortRank || 1}
          currentXp={currentXp}
          totalStudents={streakData?.totalCohortStudents || 22}
        />

        <HeatmapModal
          isOpen={isHeatmapOpen}
          onClose={() => setIsHeatmapOpen(false)}
          currentStreak={streakData?.current || 1}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-4 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 text-xs sm:text-sm font-extrabold transition border-b-2 ${
              activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Workstation Apps
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-2 px-1 text-xs sm:text-sm font-extrabold transition border-b-2 ${
              activeTab === 'tools' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Learning Tools Desk
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`pb-2 px-1 text-xs sm:text-sm font-extrabold transition border-b-2 ${
              activeTab === 'syllabus' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Course Curriculum
          </button>
        </div>

        {/* Tab 1: Overview & Primary Workstation Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1: Capstones */}
            <Link href="/dashboard/projects" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-diagram-project"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">🚀 Real-World Capstones</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Build real-world projects, solve production-level challenges, and strengthen your portfolio with hands-on capstones.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>Explore Capstones &rarr;</span>
              </div>
            </Link>

            {/* Pillar 2 & 3: Video Player & AI Doubt Tutor */}
            <Link href={activeCourse ? `/dashboard/learn/${activeCourse.id}` : '/courses'} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-circle-play"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">🤖 AI Student LMS</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Stream lectures, generate AI notes &amp; ask doubts.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>Enter Player &rarr;</span>
              </div>
            </Link>

            {/* Pillar 4: Code Arena */}
            <Link href="/code-arena" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-code"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">⌨️ AI Code Arena</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Multi-language IDE with Docker execution sandbox.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>Open Workstation &rarr;</span>
              </div>
            </Link>

            {/* Pillar 5: AI Mock Interview Arena */}
            <Link href="/dashboard/ai-interview" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-comments"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition">🎤 AI Interview Arena</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Simulated mock interviews with 5-axis scorecards.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-purple-600 flex items-center space-x-1">
                <span>Start Mock Session &rarr;</span>
              </div>
            </Link>

            {/* Pillar 6: AI Resume Career Studio */}
            <Link href="/dashboard/ai-resume" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-file-contract"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">✨ AI Resume Career Studio</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Interactive builder, Google XYZ metric booster, multi-template ATS styling &amp; PDF export.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>Build &amp; Optimize Resume &rarr;</span>
              </div>
            </Link>

            {/* Pillar 7: Question Bank */}
            <Link href="/dashboard/question-bank" className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-book-bookmark"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition">📚 FAANG Question Bank</h3>
                <p className="text-xs text-slate-600 leading-relaxed">500+ real interview questions with Java &amp; Python solutions.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-amber-600 flex items-center space-x-1">
                <span>Explore Bank &rarr;</span>
              </div>
            </Link>

            {/* Pillar 8: Certificates */}
            <Link href="/dashboard/certificates" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-award"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">🏆 Project Certificates</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Cryptographic certificates with SHA-256 hash validation.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <span>View Certificate &rarr;</span>
              </div>
            </Link>

            {/* Pillar 9: 1-on-1 SDE Mocks */}
            <Link href="/dashboard/mock-interviews" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-user-check"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">👨‍💼 1-on-1 SDE Mocks</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Book 60-minute mock interviews with senior FAANG mentors.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>Book Mentor Slot &rarr;</span>
              </div>
            </Link>



            {/* Pillar 11: Tech Job Board */}
            <Link href="/dashboard/jobs" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">💼 Live Tech Job Board</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Browse curated SDE roles with internal referral access.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <span>Explore Tech Jobs &rarr;</span>
              </div>
            </Link>

            {/* Pillar 12: Billing & GST Invoices */}
            <Link href="/dashboard/payments" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition group flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">💳 Billing &amp; Invoices</h3>
                <p className="text-xs text-slate-600 leading-relaxed">View payment history, download GST tax invoices, and check enrollment payment receipts.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center space-x-1">
                <span>View Payment History &rarr;</span>
              </div>
            </Link>
          </div>
        )}

        {/* Tab 2: Secondary Tools Desk */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link href="/dashboard/doubts" className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition space-y-3 bg-gradient-to-br from-indigo-50/40 to-white">
              <i className="fa-solid fa-comments text-2xl text-indigo-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Student Doubt Desk</h3>
              <p className="text-xs text-slate-600">Ask questions, share code snippets &amp; get 1-on-1 faculty solutions.</p>
            </Link>

            <Link href="/dashboard/quizzes" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-list-check text-2xl text-emerald-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Knowledge Quizzes</h3>
              <p className="text-xs text-slate-600">Take timed module assessments with instant score breakdowns.</p>
            </Link>

            <Link href="/dashboard/assignments" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-file-code text-2xl text-amber-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Capstone Assignments</h3>
              <p className="text-xs text-slate-600">Submit GitHub project repositories for instructor grading.</p>
            </Link>

            <Link href="/dashboard/flashcards" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-layer-group text-2xl text-purple-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Spaced Repetition Deck</h3>
              <p className="text-xs text-slate-600">Memory review scheduled at Day 1, 3, 7, 30 intervals.</p>
            </Link>

            <Link href="/dashboard/certificates" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-award text-2xl text-emerald-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Verified Certificates</h3>
              <p className="text-xs text-slate-600">Digital certificates signed with SHA-256 verification hash.</p>
            </Link>

            <Link href="/dashboard/payments" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-receipt text-2xl text-indigo-600"></i>
              <h3 className="text-lg font-bold text-slate-900">Billing &amp; Tax Invoices</h3>
              <p className="text-xs text-slate-600">Download official 18% GST tax invoices &amp; enrollment receipts.</p>
            </Link>

            <Link href="/dashboard/settings" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 transition space-y-3">
              <i className="fa-solid fa-gear text-2xl text-slate-700"></i>
              <h3 className="text-lg font-bold text-slate-900">Settings &amp; Password</h3>
              <p className="text-xs text-slate-600">Update student profile, change account password &amp; security.</p>
            </Link>
          </div>
        )}

        {/* Tab 3: Curriculum Modules */}
        {activeTab === 'syllabus' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">Cohort Curriculum &amp; Syllabus</h2>
            {courses.map((c) => (
              <div key={c.id} className="space-y-3 pt-2">
                <h3 className="font-extrabold text-indigo-600 text-base">{c.title}</h3>
                {(c.modules || []).map((mod) => (
                  <div key={mod.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{mod.title}</div>
                    <p className="text-xs text-slate-600">{mod.description}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

      </main>

      <StudentFooter />
    </div>
  );
}
