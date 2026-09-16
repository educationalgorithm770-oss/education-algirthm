'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  iconBg: string;
}

function MetricCard({ title, value, change, isPositive, icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} text-white flex items-center justify-center text-lg shadow-sm shrink-0`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
      </div>
      <div className="mt-3 flex items-center space-x-1.5 text-xs font-semibold">
        <span className={isPositive ? 'text-emerald-600' : 'text-amber-600'}>
          <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-clock'}`}></i> {change}
        </span>
        <span className="text-slate-400 font-normal">live MySQL sync</span>
      </div>
    </div>
  );
}

export default function InstructorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/instructor/stats');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load instructor dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const instructorName = data?.instructor?.name || 'Faculty Member';
  const pendingDoubtsCount = data?.stats?.pendingDoubts ?? 0;
  const activeStudentsCount = data?.stats?.activeStudents ?? 0;
  const publishedModulesCount = data?.stats?.publishedModules ?? 0;
  const recentDoubts = data?.recentDoubts || [];
  const upcomingSessions = data?.upcomingSessions || [];
  const assignedCourses = data?.assignedCourses || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Faculty Control Hub • Live MySQL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {instructorName} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              You have <span className="font-extrabold text-amber-300">{pendingDoubtsCount} student doubts</span> awaiting review and <span className="font-extrabold text-emerald-300">{upcomingSessions.length} live sessions</span> scheduled.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
            <Link
              href="/instructor/live"
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>Launch Live Session</span>
            </Link>
            <Link
              href="/instructor/courses"
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Curriculum Studio</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Active Students Enrolled"
            value={activeStudentsCount.toLocaleString()}
            change="+14.2%"
            isPositive={true}
            icon="fa-user-graduate"
            iconBg="bg-emerald-600"
          />
          <MetricCard
            title="Published Modules"
            value={publishedModulesCount.toLocaleString()}
            change="Active"
            isPositive={true}
            icon="fa-shapes"
            iconBg="bg-teal-600"
          />
          <MetricCard
            title="Pending Student Doubts"
            value={pendingDoubtsCount.toString()}
            change={pendingDoubtsCount > 0 ? "Needs review" : "All resolved"}
            isPositive={pendingDoubtsCount === 0}
            icon="fa-comments-dollar"
            iconBg="bg-amber-500"
          />
          <MetricCard
            title="Live Attendance Rate"
            value="96.4%"
            change="+2.8%"
            isPositive={true}
            icon="fa-tower-broadcast"
            iconBg="bg-indigo-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Recent Student Doubts Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <i className="fa-solid fa-comments text-emerald-600"></i>
                    <span>Student Doubts Awaiting Feedback</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time questions submitted by learners in your courses.</p>
                </div>
                <Link
                  href="/instructor/doubts"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                >
                  <span>View All Desk</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading doubt feed...</div>
              ) : recentDoubts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                  <i className="fa-solid fa-circle-check text-2xl text-emerald-400 block"></i>
                  <p>All student doubts have been resolved! Great work.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDoubts.map((doubt: any) => (
                    <div
                      key={doubt.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                            {doubt.avatar}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{doubt.student}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doubt.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {doubt.status === 'resolved' ? 'Resolved' : 'Pending Response'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{doubt.topic}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{doubt.questionText}</p>
                      <div className="flex justify-end pt-1">
                        <Link
                          href="/instructor/doubts"
                          className="text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          Open in Doubt Desk &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Courses Grid */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                  <span>Active Course Curricula ({assignedCourses.length})</span>
                </h3>
                <Link href="/instructor/courses" className="text-xs font-bold text-indigo-600 hover:underline">
                  Manage Content
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedCourses.map((c: any) => (
                  <Link
                    key={c.id}
                    href="/instructor/courses"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-300 space-y-2 transition group block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                        {c.level || 'Intermediate'} • {c.duration || '16 Weeks'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition flex items-center gap-1">
                        <span>Edit</span>
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-950 transition">{c.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{c.module_count} Modules</span>
                      <span>₹{Number(c.price).toLocaleString('en-IN')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Upcoming Masterclasses & Quick Tools */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-calendar-check text-emerald-600"></i>
                  <span>Upcoming Live Sessions</span>
                </h3>
                <Link href="/instructor/live" className="text-xs font-bold text-emerald-600 hover:underline">
                  Schedule
                </Link>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No upcoming webinars scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session: any) => (
                    <div key={session.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600">
                        <span>{session.courseTitle}</span>
                        <span>{session.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{session.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        <i className="fa-regular fa-clock mr-1"></i>
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Upcoming'}
                      </p>
                      {session.meetLink && (
                        <a
                          href={session.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block w-full text-center py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition"
                        >
                          Join Live Room
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-sm text-white">Faculty Quick Tools</h3>
              <div className="space-y-2">
                <Link
                  href="/instructor/announcements"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center space-x-2.5 block"
                >
                  <i className="fa-solid fa-bullhorn text-purple-300"></i>
                  <span>Broadcast Announcement</span>
                </Link>
                <Link
                  href="/instructor/quizzes"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center space-x-2.5 block"
                >
                  <i className="fa-solid fa-circle-question text-emerald-300"></i>
                  <span>Create Assessment Quiz</span>
                </Link>
                <Link
                  href="/instructor/profile"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center space-x-2.5 block"
                >
                  <i className="fa-solid fa-id-badge text-amber-300"></i>
                  <span>Edit Faculty Profile</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
      <StudentFooter />
    </div>
  );
}
